import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // đảm bảo file này đã config prisma client

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

    const maKhachHang = `KH${Date.now()}`; // tạo mã KH đơn giản

    const newKhachHang = await prisma.khachhang.create({
      data: {
        maKhachHang,
        maUser,
        tenKhachHang,
        ngaySinh: new Date(ngaySinh),
        gioiTinh,
        diaChi,
        soDienThoai,
      },
    });

    return NextResponse.json(newKhachHang, { status: 201 });
  } catch (error) {
    console.error("POST /api/khachhang error:", error);
    return NextResponse.json({ error: "Tạo thất bại" }, { status: 500 });
  }
}
