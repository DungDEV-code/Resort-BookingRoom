import { phong_tinhTrang } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Lấy maLoaiPhong từ URL
    const url = request.nextUrl;
    const maLoaiPhong = url.pathname.split("/").pop(); // Tách từ URL

    if (!maLoaiPhong) {
      return NextResponse.json({ message: "Thiếu mã loại phòng" }, { status: 400 });
    }

    // Lấy thông tin loại phòng
    const roomType = await prisma.loaiphong.findUnique({
      where: { maLoaiPhong },
      select: {
        maLoaiPhong: true,
        tenLoaiPhong: true,
        moTa: true,
        hinhAnh: true,
        soNguoi: true,
        soGiuong: true,
      },
    });

    if (!roomType) {
      return NextResponse.json({ message: "Không tìm thấy loại phòng" }, { status: 404 });
    }

    // Lấy danh sách phòng
    const rooms = await prisma.phong.findMany({
      where: { maLoaiPhong },
      select: {
        maPhong: true,
        tenPhong: true,
        gia: true,
        tinhTrang: true,
        hinhAnh: true,
      },
    });

    // Enrich dữ liệu
    const enrichedRoomType = {
      ...roomType,
      priceRange: {
        min: rooms.length > 0 ? Math.min(...rooms.map((r) => Number(r.gia))) : 800000,
        max: rooms.length > 0 ? Math.max(...rooms.map((r) => Number(r.gia))) : 1500000,
      },
      amenities: ["Wifi miễn phí", "Ban công riêng", "Điều hòa", "Mini Bar"],
      rating: 4.5,
      totalRooms: rooms.length,
      availableRooms: rooms.filter((r) => r.tinhTrang === phong_tinhTrang.Trong).length,
      rooms: rooms.map((room) => ({
        maPhong: room.maPhong,
        tenPhong: room.tenPhong,
        gia: Number(room.gia),
        tinhTrang: room.tinhTrang || phong_tinhTrang.Trong,
        hinhAnh: room.hinhAnh || roomType.hinhAnh,
      })),
    };

    return NextResponse.json(enrichedRoomType);
  } catch (error) {
    console.error("Lỗi lấy thông tin phòng:", error);
    return NextResponse.json({ message: "Lỗi server khi lấy loại phòng" }, { status: 500 });
  }
}
