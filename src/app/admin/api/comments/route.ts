import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "7");
    const skip = (page - 1) * limit;

    const maBinhLuan = searchParams.get("maBinhLuan")?.trim();

    const whereClause: any = {};

    if (maBinhLuan) {
      whereClause.maBinhLuan = maBinhLuan; // tìm chính xác
    }

    const [comments, totalCount] = await Promise.all([
      prisma.binhluan.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          datphong: {
            select: {
              maPhong: true,
              khachhang: {
                select: { tenKhachHang: true },
              },
            },
          },
        },
        orderBy: {
          thoiGianBL: "desc",
        },
      }),
      prisma.binhluan.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      data: comments,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Lỗi GET bình luận:", error);
    return NextResponse.json({ message: "Lỗi lấy bình luận" }, { status: 500 });
  }
}
