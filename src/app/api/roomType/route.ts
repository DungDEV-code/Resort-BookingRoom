import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.loaiphong.findMany({
      select: {
        maLoaiPhong: true, // Thêm maLoaiPhong vào select
        tenLoaiPhong: true,
        moTa: true,
        hinhAnh: true,
      },
    });

    // Thêm các trường bổ sung nếu cần (ví dụ: price, amenities, v.v.)
    const enrichedRooms = rooms.map((room) => ({
      ...room,
      price: 6000000, // Giá mặc định hoặc logic tính giá
      originalPrice: 6000000,
      amenities: ["Wifi miễn phí", "Ban công riêng", "Điều hòa", "Mini Bar"], // Mảng tiện ích mặc định
      rating: 4.5, // Đánh giá mặc định
      isPopular: false, // Trạng thái phổ biến mặc định
    }));

    return NextResponse.json(enrichedRooms);
  } catch (error) {
    console.error("Lỗi lấy rooms:", error);
    return NextResponse.json({ message: "Lỗi server khi lấy loại phòng" }, { status: 500 });
  }
}