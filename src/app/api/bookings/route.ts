// Đầu file giữ nguyên
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import {
  hoadon_phuongThucThanhToan,
  hoadon_trangThaiHD,
  phong_tinhTrang,
  dichvudatphong,
} from "@/generated/prisma";

interface DecodedToken {
  email: string;
  userName: string;
  role: string;
}

interface BookingRequest {
  maPhong: string;
  tenKhachHang: string;
  soDienThoai: string;
  email?: string;
  checkIn: string;
  checkOut: string;
  phuongThucThanhToan: string;
  dichVuDat: {
    maDichVu: string;
    tenDichVu: string;
    giaDV: number;
    soLuong: number;
    thanhTien: number;
  }[];
  tongTien: number;
}




// Hàm tạo mã ngắn (dưới 20 ký tự)
const generateShortId = () => uuidv4().replace(/-/g, '').slice(0, 20);

export async function POST(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json();
    console.log("📦 Dữ liệu từ client:", JSON.stringify(body, null, 2));

    const authResult = await getMaKhachHangFromRequest(req, body.email);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const {
      maPhong,
      tenKhachHang,
      soDienThoai,
      checkIn,
      checkOut,
      phuongThucThanhToan,
      dichVuDat,
      tongTien,
    } = body;

    if (!maPhong || !tenKhachHang || !soDienThoai || !checkIn || !checkOut || !phuongThucThanhToan) {
      return NextResponse.json({ success: false, message: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      return NextResponse.json({ success: false, message: "Ngày không hợp lệ" }, { status: 400 });
    }

    const room = await prisma.phong.findUnique({ where: { maPhong } });
    if (!room || room.tinhTrang !== "Trong") {
      return NextResponse.json({ success: false, message: "Phòng không khả dụng" }, { status: 400 });
    }

    const overlappingBookings = await prisma.datphong.findMany({
      where: {
        maPhong,
        OR: [
          {
            check_in: { lte: checkOutDate },
            check_out: { gte: checkInDate },
          },
        ],
      },
    });
    if (overlappingBookings.length > 0) {
      return NextResponse.json({ success: false, message: "Phòng đã được đặt trong thời gian này" }, { status: 400 });
    }

    const maDatPhong = generateShortId();
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / millisecondsPerDay);
    const tongTienDatPhong = room.gia.mul(nights);

    // ✅ TÍNH TIỀN DỊCH VỤ NHƯNG KHÔNG TẠO TRONG DB
    let tongTienDichVu = 0;
    if (dichVuDat && Array.isArray(dichVuDat)) {
      dichVuDat.forEach((dv) => {
        tongTienDichVu += Number(dv.thanhTien);
      });
    }

    const tongTienHoaDon = tongTienDatPhong.add(tongTienDichVu);

    if (phuongThucThanhToan === "ChuyenKhoan") {
      const partnerCode = "MOMO";
      const accessKey = "F8BBA842ECF85";
      const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
      const requestId = partnerCode + new Date().getTime();
      const orderId = maDatPhong;
      const orderInfo = `Thanh toán đặt phòng ${maDatPhong}`;
      const redirectUrl = "http://localhost:3000/rooms";
      const ipnUrl = "https://3c58-203-167-9-129.ngrok-free.app/api/momo-callback";
      const amount = tongTienHoaDon.toString();
      const requestType = "payWithATM";

      // ✅ LƯU TOÀN BỘ THÔNG TIN BOOKING VÀO extraData
      const bookingData = {
        maDatPhong,
        maKhachHang: authResult.maKhachHang,
        maPhong,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        tongTienDatPhong: tongTienDatPhong.toString(),
        tongTienHoaDon: tongTienHoaDon.toString(),
        dichVuDat: dichVuDat || [],
        tenKhachHang,
        soDienThoai
      };

      const extraData = Buffer.from(JSON.stringify(bookingData)).toString("base64");

      const rawSignature =
        `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
        `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
        `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        extraData,
        requestType,
        signature,
        lang: "vi",
      };

      try {
        const momoRes = await fetch("https://test-payment.momo.vn/v2/gateway/api/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const data = await momoRes.json();

        // ✅ KIỂM TRA CẢ resultCode VÀ payUrl
        if (data.resultCode !== 0 || !data.payUrl) {
          console.error("❌ MoMo API Error:", data);
          return NextResponse.json(
            {
              success: false,
              message: data.message || "Không thể tạo URL thanh toán MoMo",
              errorCode: data.resultCode
            },
            { status: 500 }
          );
        }

        // ✅ CHỈ TRẢ VỀ PAYMENT URL - KHÔNG INSERT DATABASE
        console.log("✅ Tạo payment URL thành công, chờ callback từ MoMo...");
        return NextResponse.json(
          {
            success: true,
            payUrl: data.payUrl,
            deeplink: data.deeplink,
            maDatPhong,
            message: "Vui lòng hoàn tất thanh toán để xác nhận đặt phòng"
          },
          { status: 200 }
        );

      } catch (error) {
        console.error("❌ MoMo API Call Failed:", error);
        return NextResponse.json(
          { success: false, message: "Lỗi kết nối với MoMo API" },
          { status: 500 }
        );
      }
    }

    // ✅ XỬ LÝ THANH TOÁN TIỀN MẶT - INSERT NGAY VÌ KHÔNG CẦN GATEWAY
    if (phuongThucThanhToan === "TienMat") {
      const fullBooking = await prisma.$transaction(async (prisma) => {
        await prisma.datphong.create({
          data: {
            maDatPhong,
            maKhachHang: authResult.maKhachHang,
            maPhong,
            check_in: checkInDate,
            check_out: checkOutDate,
            tongTien: tongTienDatPhong,
            thoiGianDat: new Date(),
          },
        });

        // Tạo dịch vụ đặt phòng cho thanh toán tiền mặt
        if (dichVuDat && Array.isArray(dichVuDat)) {
          const dichVuDatPromises = dichVuDat.map((dv) => {
            return prisma.dichvudatphong.create({
              data: {
                ma: generateShortId(),
                maDatPhong,
                maDichVu: dv.maDichVu,
                tenDichVuLucDat: dv.tenDichVu,
                donGiaLucDat: dv.giaDV,
                soLuong: dv.soLuong,
                ThanhTien: Number(dv.thanhTien),
              },
            });
          });
          await Promise.all(dichVuDatPromises);
        }

        const invoice = await prisma.hoadon.create({
          data: {
            maHD: generateShortId(),
            maDatPhong,
            phuongThucThanhToan: "TienMat",
            tongTien: tongTienHoaDon,
            ngayTaoHD: new Date(),
            trangThaiHD: "ChuaThanhToan",
          },
        });

        await prisma.phong.update({
          where: { maPhong },
          data: { tinhTrang: "DaDat" },
        });

        return await prisma.datphong.findUnique({
          where: { maDatPhong },
          include: {
            phong: { include: { loaiphong: true } },
            dichvudatphong: true,
            hoadon: true,
          },
        });
      });

      return NextResponse.json({ success: true, data: fullBooking }, { status: 201 });
    }

    // Nếu không phải ChuyenKhoan hay TienMat
    return NextResponse.json(
      { success: false, message: "Phương thức thanh toán không hợp lệ" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("❌ Lỗi khi đặt phòng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server nội bộ", error: error.message || error },
      { status: 500 }
    );
  }
}

async function getMaKhachHangFromRequest(
  req: NextRequest,
  emailFromBody?: string
): Promise<
  | { success: true; maKhachHang: string }
  | { success: false; message: string; status: number }
> {
  const token = req.cookies.get("auth_token")?.value;
  const emailFromUrl = req.nextUrl.searchParams.get("email");

  let emailToUse: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      emailToUse = decoded.email;
    } catch {
      return { success: false, message: "Token không hợp lệ", status: 401 };
    }
  } else if (emailFromBody) {
    emailToUse = emailFromBody;
  } else if (emailFromUrl) {
    emailToUse = emailFromUrl;
  } else {
    return { success: false, message: "Không được phép truy cập", status: 401 };
  }

  const user = await prisma.roleadminuser.findUnique({
    where: { email: emailToUse },
    include: { khachhang: true },
  });

  if (!user?.khachhang) {
    return { success: false, message: "Không tìm thấy khách hàng", status: 404 };
  }

  return { success: true, maKhachHang: user.khachhang.maKhachHang };
}