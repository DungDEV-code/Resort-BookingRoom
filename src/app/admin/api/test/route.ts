import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const max = await prisma.phong.aggregate({
      _max: {
        gia: true,
      },
    });

    const maxPrice = max._max.gia;

    if (!maxPrice) {
      return NextResponse.json(
        { success: false, message: "Không có dữ liệu giá phòng" },
        { status: 404 }
      );
    }

    const phongList = await prisma.phong.findMany({
      where: {
        gia: maxPrice,
      },
    });

    return NextResponse.json(
      { success: true, data: phongList },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi khi lấy phòng giá cao nhất:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}
