import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface DecodedToken {
  email: string;
  userName: string;
  role: string;
}

interface BookingStatus {
  new: FormattedBooking[];
  old: FormattedBooking[];
  all: FormattedBooking[];
}

interface FormattedBooking {
  maDatPhong: string;
  check_in: string;
  check_out: string;
  trangThai: string | null;
  tongTien: number;
  thoiGianDat: string;
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
  dichvudatphong: {
    ma: string;
    tenDichVuLucDat: string;
    donGiaLucDat: number;
    soLuong: number;
    thanhTien: number;
  }[];
  hoadon: {
    maHD: string;
    phuongThucThanhToan: string;
    trangThaiHD: string | null;
    tongTien: number;
    ngayTaoHD: string;
  }[];
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await getMaKhachHangFromRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const bookings = await getCustomerBookings(authResult.maKhachHang);
    const result = categorizeBookings(bookings);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Lỗi lấy lịch sử đặt phòng:", error);
    return NextResponse.json({ message: "Lỗi server nội bộ" }, { status: 500 });
  }
}

async function getMaKhachHangFromRequest(req: NextRequest): Promise<
  | { success: true; maKhachHang: string }
  | { success: false; message: string; status: number }
> {
  const token = req.cookies.get("auth_token")?.value;
  const email = req.nextUrl.searchParams.get("email");

  let emailToUse: string | null = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      emailToUse = decoded.email;
    } catch (err) {
      return { success: false, message: "Token không hợp lệ", status: 401 };
    }
  } else if (email) {
    emailToUse = email;
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

function categorizeBookings(bookings: any[]): BookingStatus {
  const formatted = bookings.map((b): FormattedBooking => ({
    maDatPhong: b.maDatPhong,
    check_in: formatDateToString(b.check_in),
    check_out: formatDateToString(b.check_out),
    trangThai: b.trangThai,
    tongTien: Number(b.tongTien),
    thoiGianDat: b.thoiGianDat.toISOString(),
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
    hoadon: b.hoadon.map((hd: any) => ({
      maHD: hd.maHD,
      phuongThucThanhToan: hd.phuongThucThanhToan,
      trangThaiHD: hd.trangThaiHD,
      tongTien: Number(hd.tongTien),
      ngayTaoHD: hd.ngayTaoHD.toISOString(),
    })),
  }));

  return {
    new: formatted.filter(b => b.trangThai === null),
    old: formatted.filter(b => b.trangThai === "Check_in" || b.trangThai === "Check_out"),
    all: formatted,
  };
}

function formatDateToString(date: Date | null): string {
  return date ? date.toISOString().split("T")[0] : "";
}
