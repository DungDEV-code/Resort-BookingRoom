import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "7");
    const trangThai = searchParams.get("trangThai");
    const maKhachHang = searchParams.get("maKhachHang");
    const tenKhachHang = searchParams.get("tenKhachHang");

    const where: any = {};
    if (trangThai) where.trangThai = trangThai;
    if (maKhachHang) where.maKhachHang = maKhachHang;

    // ✅ Lọc theo tên khách hàng thông qua quan hệ
    if (tenKhachHang) {
      where.khachhang = {
        is: {
          tenKhachHang: {
            contains: tenKhachHang, // 👈 không dùng mode
          },
        },
      };
    }

    const total = await prisma.lienhe_hotro.count({ where });

    const data = await prisma.lienhe_hotro.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { ngayTao: "desc" },
      include: {
        khachhang: {
          select: {
            tenKhachHang: true,
            soDienThoai: true,
          },
        },
      },
    });

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error("GET /api/contact error:", error);
    return NextResponse.json(
      { message: "Không thể tải danh sách liên hệ hỗ trợ." },
      { status: 500 }
    );
  }
}
