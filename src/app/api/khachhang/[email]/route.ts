// /api/khachhang/[email]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lấy thông tin khách hàng theo email (maUser)
export async function GET(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);

    const khachHang = await prisma.khachhang.findFirst({
      where: { maUser: email },
      select: {
        maKhachHang: true,
        maUser: true,
        tenKhachHang: true,
        ngaySinh: true,
        gioiTinh: true,
        diaChi: true,
        soDienThoai: true,
        maMembership: true,
        membership: {
          select: {
            maMembership: true,
            level: true,
            minSpending: true,
            description: true,
          },
        },
      },
    });

    if (!khachHang) {
      return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
    }

    return NextResponse.json(khachHang, { status: 200 });
  } catch (error) {
    console.error("GET /api/khachhang/:email error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// Cập nhật thông tin khách hàng
export async function PUT(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    const body = await req.json();

    const { tenKhachHang, ngaySinh, gioiTinh, diaChi, soDienThoai } = body;

    if (!tenKhachHang || !ngaySinh || !gioiTinh || !diaChi || !soDienThoai) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const khachHang = await prisma.khachhang.findFirst({
      where: { maUser: email },
    });

    if (!khachHang) {
      return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
    }

    await prisma.khachhang.updateMany({
      where: { maUser: email },
      data: {
        tenKhachHang,
        ngaySinh: new Date(ngaySinh),
        gioiTinh,
        diaChi,
        soDienThoai,
      },
    });

    const updated = await prisma.khachhang.findFirst({
      where: { maUser: email },
      select: {
        maKhachHang: true,
        maUser: true,
        tenKhachHang: true,
        ngaySinh: true,
        gioiTinh: true,
        diaChi: true,
        soDienThoai: true,
        maMembership: true,
        membership: {
          select: {
            maMembership: true,
            level: true,
            minSpending: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Cập nhật thành công", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/khachhang/:email error:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}
