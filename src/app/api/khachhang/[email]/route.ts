import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Sửa đúng cách truyền params
export async function GET(req: NextRequest) {
  try {
    const email = decodeURIComponent(req.nextUrl.pathname.split("/").pop() || "");

    const khachHang = await prisma.khachhang.findFirst({
      where: { maUser: email },
    });

    return NextResponse.json(khachHang);
  } catch (error) {
    console.error("Lỗi lấy thông tin khách hàng:", error);
    return NextResponse.json({ error: "Không lấy được thông tin" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { email: string } }) {
  try {
    const email = decodeURIComponent(params.email);
    const body = await req.json();

    const updated = await prisma.khachhang.updateMany({
      where: { maUser: email },
      data: {
        tenKhachHang: body.tenKhachHang,
        ngaySinh: new Date(body.ngaySinh),
        gioiTinh: body.gioiTinh,
        diaChi: body.diaChi,
        soDienThoai: body.soDienThoai,
      },
    });

    return NextResponse.json({ message: "Cập nhật thành công", updated });
  } catch (error) {
    console.error("PUT /api/khachhang/:email error:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}
