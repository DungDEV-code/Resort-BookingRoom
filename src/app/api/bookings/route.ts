import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Types
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
  dichvudatphong: Array<{
    ma: string;
    tenDichVuLucDat: string;
    donGiaLucDat: number;
    soLuong: number;
    thanhTien: number;
  }>;
  hoadon: Array<{
    maHD: string;
    phuongThucThanhToan: string;
    trangThaiHD: string | null;
    tongTien: number;
    ngayTaoHD: string;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Xác thực qua token hoặc email
    const authResult = await getMaKhachHangFromRequest(req);
    if (!authResult.success) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    // 2. Truy vấn đơn đặt phòng
    const bookings = await getCustomerBookings(authResult.maKhachHang!);
    const result = formatAndCategorizeBookings(bookings);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Lỗi lấy dữ liệu booking:", error);
    return NextResponse.json({ message: "Lỗi server nội bộ" }, { status: 500 });
  }
}

async function getMaKhachHangFromRequest(req: NextRequest): Promise<
  | { success: true; maKhachHang: string }
  | { success: false; message: string; status: number }
> {
  const token = req.cookies.get("auth_token")?.value;
  const emailFromQuery = req.nextUrl.searchParams.get("email");

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
      const user = await prisma.roleadminuser.findUnique({
        where: { email: decoded.email },
        include: {
          khachhang: {
            select: { maKhachHang: true },
          },
        },
      });

      if (!user?.khachhang?.[0]?.maKhachHang) {
        return { success: false, message: "Không tìm thấy khách hàng", status: 404 };
      }

      return { success: true, maKhachHang: user.khachhang[0].maKhachHang };
    } catch (error) {
      return { success: false, message: "Token không hợp lệ", status: 401 };
    }
  }

  // Nếu không có token, thử lấy từ email query
  if (emailFromQuery) {
    const user = await prisma.roleadminuser.findUnique({
      where: { email: emailFromQuery },
      include: {
        khachhang: {
          select: { maKhachHang: true },
        },
      },
    });

    if (!user?.khachhang?.[0]?.maKhachHang) {
      return { success: false, message: "Không tìm thấy khách hàng", status: 404 };
    }

    return { success: true, maKhachHang: user.khachhang[0].maKhachHang };
  }

  return { success: false, message: "Không được phép truy cập", status: 401 };
}

async function getCustomerBookings(maKhachHang: string) {
  return await prisma.datphong.findMany({
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

function formatAndCategorizeBookings(bookings: any[]): BookingStatus {
  const formattedBookings: FormattedBooking[] = bookings.map((booking) => ({
    maDatPhong: booking.maDatPhong,
    check_in: formatDateToString(booking.check_in),
    check_out: formatDateToString(booking.check_out),
    trangThai: booking.trangThai,
    tongTien: Number(booking.tongTien),
    thoiGianDat: booking.thoiGianDat.toISOString(),
    phong: {
      maPhong: booking.phong.maPhong,
      tenPhong: booking.phong.tenPhong,
      gia: Number(booking.phong.gia),
      hinhAnh: booking.phong.hinhAnh,
      loaiphong: {
        tenLoaiPhong: booking.phong.loaiphong.tenLoaiPhong,
        soNguoi: booking.phong.loaiphong.soNguoi,
        soGiuong: booking.phong.loaiphong.soGiuong,
      },
    },
    dichvudatphong: booking.dichvudatphong.map((dichvu: any) => ({
      ma: dichvu.ma,
      tenDichVuLucDat: dichvu.tenDichVuLucDat,
      donGiaLucDat: Number(dichvu.donGiaLucDat),
      soLuong: dichvu.soLuong,
      thanhTien: Number(dichvu.ThanhTien),
    })),
    hoadon: booking.hoadon.map((hd: any) => ({
      maHD: hd.maHD,
      phuongThucThanhToan: hd.phuongThucThanhToan,
      trangThaiHD: hd.trangThaiHD,
      tongTien: Number(hd.tongTien),
      ngayTaoHD: hd.ngayTaoHD.toISOString(),
    })),
  }));

  const newBookings = formattedBookings.filter((b) => b.trangThai === null);
  const oldBookings = formattedBookings.filter((b) => b.trangThai === "Check_in" || b.trangThai === "Check_out");

  return { new: newBookings, old: oldBookings, all: formattedBookings };
}

function formatDateToString(date: Date | null): string {
  return date ? date.toISOString().split("T")[0] : "";
}
