import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Lấy auth_token từ cookie
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Không được phép truy cập" }, { status: 401 });
    }

    // Xác minh token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
      userName: string;
      role: string;
    };

    // Tìm người dùng trong bảng roleadminuser
    const user = await prisma.roleadminuser.findUnique({
      where: { email: decoded.email },
      include: {
        khachhang: true,
      },
    });

    if (!user || !user.khachhang || user.khachhang.length === 0) {
      return NextResponse.json({ message: "Không tìm thấy khách hàng" }, { status: 404 });
    }

    // Lấy maKhachHang từ bản ghi khachhang đầu tiên
    const maKhachHang = user.khachhang[0].maKhachHang;

    // Lấy chi tiết đặt phòng theo maDatPhong và maKhachHang
    const booking = await prisma.datphong.findFirst({
      where: {
        maDatPhong: params.id,
        maKhachHang: maKhachHang,
      },
      include: {
        phong: {
          include: {
            loaiphong: true,
          },
        },
        khachhang: true,
        hoadon: true,
        dichvudatphong: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Không tìm thấy đặt phòng" }, { status: 404 });
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đặt phòng:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ message: "Token không hợp lệ" }, { status: 401 });
    }
    return NextResponse.json({ message: "Lỗi server nội bộ" }, { status: 500 });
  }
}