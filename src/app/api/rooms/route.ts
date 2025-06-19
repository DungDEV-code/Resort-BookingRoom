// app/api/rooms/route.ts


import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const rooms = await prisma.loaiphong.findMany({
      select: {
        tenLoaiPhong: true,
        moTa: true,
        hinhAnh: true,
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Lỗi lấy rooms:", error);
    return NextResponse.json({ message: "Lỗi server khi lấy loại phòng" }, { status: 500 });
  }
}
