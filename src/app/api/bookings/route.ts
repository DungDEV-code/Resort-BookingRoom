import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  hoadon_phuongThucThanhToan,
  hoadon_trangThaiHD,
  phong_tinhTrang,
  dichvudatphong,
} from "@/generated/prisma";
// ✅ Interface định nghĩa cấu trúc token JWT đã decode
interface DecodedToken {
  email: string;
  userName: string;
  role: string;
}
// ✅ Interface định dạng dữ liệu trả về cho các trạng thái đặt phòng
interface BookingStatus {
  new: FormattedBooking[];
  old: FormattedBooking[];
  all: FormattedBooking[];
}
// ✅ Interface định dạng thông tin đặt phòng gửi về client
interface FormattedBooking {
  maDatPhong: string;
  check_in: string;
  check_out: string;
  trangThai: string | null;
  tongTien: number;
  thoiGianDat: string;
  lyDoHuy?: string | null;
  phong: {
    maPhong: string;
    tenPhong: string;
    gia: number;
    hinhAnh: string;
    loaiphong: {
      tenLoaiPhong: string;
      soNguoi: number;
      soGiuong: number;
    };
  };
  dichvudatphong: Array<{
    ma: string;
    tenDichVuLucDat: string;
    donGiaLucDat: number;
    soLuong: number;
    thanhTien: number;
  }>;
  hoadon: {
    maHD: string;
    phuongThucThanhToan: string;
    trangThaiHD: string | null;
    tongTien: number;
    ngayTaoHD: string;
  }[];
}
// ✅ Interface định nghĩa dữ liệu request từ client khi đặt phòng
interface BookingRequest {
  maPhong: string;
  tenKhachHang: string;
  soDienThoai: string;
  email?: string;
  checkIn: string;
  checkOut: string;
  phuongThucThanhToan: string;
  trangThai:'ChoXacNhan';
  maVoucher?: string;
  dichVuDat: {
    maDichVu: string;
    tenDichVu: string;
    giaDV: number;
    soLuong: number;
    thanhTien: number;
  }[];
  tongTien: number;
}
// ✅ API GET: Lấy lịch sử đặt phòng của khách hàng
export async function GET(req: NextRequest) {
  try {
    // 1. Xác thực qua token hoặc email
    const authResult = await getMaKhachHangFromRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    // 2. Truy vấn và định dạng đơn đặt phòng
    const bookings = await getCustomerBookings(authResult.maKhachHang);
    const result = categorizeBookings(bookings);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đặt phòng:", error);
    return NextResponse.json({ message: "Lỗi server nội bộ" }, { status: 500 });
  }
}
// ✅ Hàm xác thực và tìm mã khách hàng từ token hoặc email
async function getMaKhachHangFromRequest(
  req: NextRequest,
  emailFromBody?: string
): Promise<
  | { success: true; maKhachHang: string }
  | { success: false; message: string; status: number }
> {
  const token = req.cookies.get("auth_token")?.value;
  const emailFromUrl = req.nextUrl.searchParams.get("email");
  const emailToUse = token
    ? (jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken).email
    : emailFromBody || emailFromUrl;

  if (!emailToUse) {
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

// ✅ Truy vấn danh sách đặt phòng theo mã khách hàng
async function getCustomerBookings(maKhachHang: string) {
  return prisma.datphong.findMany({
    where: { maKhachHang },
    include: {
      phong: {
        include: {
          loaiphong: {
            select: {
              tenLoaiPhong: true,
              soNguoi: true,
              soGiuong: true,
            },
          },
        },
      },
      dichvudatphong: {
        select: {
          ma: true,
          tenDichVuLucDat: true,
          donGiaLucDat: true,
          soLuong: true,
          ThanhTien: true,
        },
      },
      hoadon: {
        select: {
          maHD: true,
          phuongThucThanhToan: true,
          trangThaiHD: true,
          tongTien: true,
          ngayTaoHD: true,
        },
      },
    },
    orderBy: { thoiGianDat: "desc" },
  });
}

// ✅ Phân loại đặt phòng thành nhóm: mới, cũ, tất cả
function categorizeBookings(bookings: any[]): BookingStatus {
  const formatted = bookings.map((b): FormattedBooking => ({
    maDatPhong: b.maDatPhong,
    check_in: formatDateToString(b.check_in),
    check_out: formatDateToString(b.check_out),
    trangThai: b.trangThai,
    tongTien: Number(b.tongTien),
    thoiGianDat: b.thoiGianDat.toISOString(),
    lyDoHuy: b.lyDoHuy,
    phong: {
      maPhong: b.phong.maPhong,
      tenPhong: b.phong.tenPhong,
      gia: Number(b.phong.gia),
      hinhAnh: b.phong.hinhAnh,
      loaiphong: {
        tenLoaiPhong: b.phong.loaiphong.tenLoaiPhong,
        soNguoi: b.phong.loaiphong.soNguoi,
        soGiuong: b.phong.loaiphong.soGiuong,
      },
    },
    dichvudatphong: b.dichvudatphong.map((dv: any) => ({
      ma: dv.ma,
      tenDichVuLucDat: dv.tenDichVuLucDat,
      donGiaLucDat: Number(dv.donGiaLucDat),
      soLuong: dv.soLuong,
      thanhTien: Number(dv.ThanhTien),
    })),
    hoadon: b.hoadon
      ? [{
          maHD: b.hoadon.maHD,
          phuongThucThanhToan: b.hoadon.phuongThucThanhToan,
          trangThaiHD: b.hoadon.trangThaiHD,
          tongTien: Number(b.hoadon.tongTien),
          ngayTaoHD: b.hoadon.ngayTaoHD.toISOString(),
        }]
      : [],
  }));

  return {
    new: formatted.filter((b) => b.trangThai === null || b.trangThai === "ChoXacNhan" || b.trangThai === "YeuCauHuy"),
    old: formatted.filter((b) => b.trangThai === "Check_in" || b.trangThai === "Check_out" || b.trangThai === "DaHuy"),
    all: formatted,
  };
}

function formatDateToString(date: Date | null): string {
  return date ? date.toISOString().split("T")[0] : "";
}

function generateShortId() {
  return crypto.randomBytes(5).toString("hex").toUpperCase();
}

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
            check_in: { lt: checkOutDate },
            check_out: { gt: checkInDate },
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
    let tongTienDatPhong = room.gia.toNumber() * nights;

    if (body.maVoucher) {
      const voucher = await prisma.voucher.findUnique({
        where: { maVoucher: body.maVoucher },
      });

      if (voucher && voucher.trangThai === "ConHieuLuc") {
        const today = new Date();
        if (today >= voucher.ngayBatDau && today <= voucher.ngayKetThuc) {
          if (!voucher.dieuKienApDung || tongTienDatPhong >= Number(voucher.dieuKienApDung)) {
            const giamGia = (voucher.phanTramGiam / 100) * tongTienDatPhong;
            tongTienDatPhong -= giamGia;
          }
        }
      }
    }


    let tongTienDichVu = 0;
    if (dichVuDat && Array.isArray(dichVuDat)) {
      tongTienDichVu = dichVuDat.reduce((sum, dv) => sum + Number(dv.thanhTien), 0);
    }

    const tongTienHoaDon = tongTienDatPhong + tongTienDichVu;

    if (phuongThucThanhToan === "ChuyenKhoan") {
      const partnerCode = "MOMO";
      const accessKey = "F8BBA842ECF85";
      const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
      const requestId = partnerCode + new Date().getTime();
      const orderId = maDatPhong;
      const orderInfo = `Thanh toán đặt phòng ${maDatPhong}`;
      const redirectUrl = "http://localhost:3000/rooms";
      const ipnUrl = "https://1cd133ab6b0d.ngrok-free.app/api/momo-callback";
      const amount = tongTienHoaDon.toString();
      const requestType = "payWithATM";

      const bookingData = {
        maDatPhong,
        maKhachHang: authResult.maKhachHang,
        maPhong,

        maVoucher: body.maVoucher || null, // ✅ thêm dòng này
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        tongTienDatPhong: tongTienDatPhong.toString(),
        tongTienHoaDon: tongTienHoaDon.toString(),
        dichVuDat: dichVuDat || [],
        tenKhachHang,
        soDienThoai,
      };


      const extraData = Buffer.from(JSON.stringify(bookingData)).toString("base64");
      console.log("📋 Base64-encoded extraData:", extraData);

      // Sửa đổi: Tạo rawSignature với extraData đã mã hóa base64
      const rawSignature =
        `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
        `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
        `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

      console.log("🔐 Raw signature:", rawSignature);
      console.log("🔐 Signature:", signature);

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

        if (data.resultCode !== 0 || !data.payUrl) {
          console.error("❌ MoMo API Error:", data);
          return NextResponse.json(
            {
              success: false,
              message: data.message || "Không thể tạo URL thanh toán MoMo",
              errorCode: data.resultCode,
            },
            { status: 500 }
          );
        }

        console.log("✅ Tạo payment URL thành công, chờ callback từ MoMo...");
        return NextResponse.json(
          {
            success: true,
            payUrl: data.payUrl,
            deeplink: data.deeplink,
            maDatPhong,
            message: "Vui lòng hoàn tất thanh toán để xác nhận đặt phòng",
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

    if (phuongThucThanhToan === "TienMat") {
      const fullBooking = await prisma.$transaction(async (prisma) => {
        await prisma.datphong.create({
          data: {
            maDatPhong,
            maKhachHang: authResult.maKhachHang,
            maPhong,
            trangThai:'ChoXacNhan',
            maVoucher: body.maVoucher || undefined,
            check_in: checkInDate,
            check_out: checkOutDate,
            tongTien: tongTienDatPhong,
            thoiGianDat: new Date(),
          },
        });

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
export async function DELETE(req: NextRequest) {
  try {
    const { maDatPhong, lyDoHuy } = await req.json();

    if (!maDatPhong) {
      return NextResponse.json({ success: false, message: "Thiếu mã đặt phòng" }, { status: 400 });
    }

    const authResult = await getMaKhachHangFromRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const booking = await prisma.datphong.findUnique({
      where: { maDatPhong },
      include: { hoadon: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, message: "Không tìm thấy đặt phòng" }, { status: 404 });
    }

    if (booking.maKhachHang !== authResult.maKhachHang) {
      return NextResponse.json({ success: false, message: "Không có quyền hủy đặt phòng này" }, { status: 403 });
    }

    if (booking.trangThai !== null && booking.trangThai !== "ChoXacNhan") {
      return NextResponse.json({ success: false, message: "Chỉ có thể yêu cầu hủy các đặt phòng mới hoặc chờ xác nhận" }, { status: 400 });
    }

    // if (booking.hoadon?.phuongThucThanhToan === "ChuyenKhoan" && booking.hoadon?.trangThaiHD === "DaThanhToan") {
    //   return NextResponse.json({ success: false, message: "Không thể hủy đặt phòng đã thanh toán qua chuyển khoản" }, { status: 400 });
    // }

    await prisma.datphong.update({
      where: { maDatPhong },
      data: {
        trangThai: "YeuCauHuy",
        lyDoHuy: lyDoHuy || "Khách hàng yêu cầu hủy",
      },
    });

    return NextResponse.json({ success: true, message: "Yêu cầu hủy đặt phòng đã được gửi" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Lỗi khi yêu cầu hủy đặt phòng:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server nội bộ", error: error.message || error },
      { status: 500 }
    );
  }
}