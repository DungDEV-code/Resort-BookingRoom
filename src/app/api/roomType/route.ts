import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.loaiphong.findMany({
      select: {
        maLoaiPhong: true,
        tenLoaiPhong: true,
        moTa: true,
        hinhAnh: true,
        gia_min: true,
        gia_max: true,
      },
    });

    const enrichedRooms = rooms.map((room) => ({
      ...room,
      priceRange: {
        min: room.gia_min || 0,
        max: room.gia_max || 0,
      },
      amenities: ["Wifi miễn phí", "Ban công riêng", "Điều hòa", "Mini Bar"],
      rating: 4.5,
      isPopular: false,
    }));

    return NextResponse.json(enrichedRooms);
  } catch (error) {
    console.error("Lỗi lấy rooms:", error);
    return NextResponse.json({ message: "Lỗi server khi lấy loại phòng" }, { status: 500 });
  }
}
