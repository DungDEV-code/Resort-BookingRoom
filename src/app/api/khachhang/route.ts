import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      maUser,
      tenKhachHang,
      ngaySinh,
      gioiTinh,
      diaChi,
      soDienThoai,
    } = body;

    // ✅ Kiểm tra dữ liệu đầu vào
    if (!maUser || !tenKhachHang || !ngaySinh || !gioiTinh || !diaChi || !soDienThoai) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc." },
        { status: 400 }
      );
    }

    // ✅ Chuyển đổi ngày sinh an toàn
    const parsedNgaySinh = new Date(ngaySinh);
    if (isNaN(parsedNgaySinh.getTime())) {
      return NextResponse.json(
        { error: "Ngày sinh không hợp lệ." },
        { status: 400 }
      );
    }

    // ✅ Tạo mã khách hàng từ timestamp
    const maKhachHang = `KH${Date.now()}`;

    // ✅ Tạo khách hàng mới
    const newKhachHang = await prisma.khachhang.create({
      data: {
        maKhachHang,
        maUser,
        tenKhachHang,
        ngaySinh: parsedNgaySinh,
        gioiTinh,
        diaChi,
        soDienThoai,
      },
    });

    return NextResponse.json(newKhachHang, { status: 201 });
  } catch (error) {
    console.error("POST /api/khachhang error:", error);
    return NextResponse.json({ error: "Tạo khách hàng thất bại." }, { status: 500 });
  }
}
