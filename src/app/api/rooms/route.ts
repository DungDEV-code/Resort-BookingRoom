import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Map enum values to Vietnamese display text
const TINH_TRANG_MAP: Record<string, string> = {
  Trong: "Trống",
  DaDat: "Đã Đặt", 
  DangDonDep: "Đang dọn dẹp",
  DangSuaChua: "Đang sửa chữa",
};

export async function GET() {
  try {
    // Get all rooms
    const rooms = await prisma.phong.findMany({
      select: {
        maPhong: true,
        maLoaiPhong: true,
        moTa: true,
        tinhTrang: true,
        gia: true,
        hinhAnh: true,
        tenPhong: true,
      },
    });

    // Get all room types
    const roomTypes = await prisma.loaiphong.findMany({
      select: {
        maLoaiPhong: true,
        tenLoaiPhong: true,
        soNguoi: true,
        soGiuong: true,
      },
    });

    // Create a map of room types for quick lookup
    const roomTypeMap = new Map(
      roomTypes.map(type => [type.maLoaiPhong, type])
    );

    // Join data manually
    const formattedRooms = rooms.map((room) => {
      const roomType = roomTypeMap.get(room.maLoaiPhong);
      
      return {
        maPhong: room.maPhong,
        tenPhong: room.tenPhong,
        moTa: room.moTa,
        tinhTrang: room.tinhTrang ? TINH_TRANG_MAP[room.tinhTrang] || room.tinhTrang : "Không xác định",
        gia: room.gia,
        hinhAnh: room.hinhAnh,
        maLoaiPhong: room.maLoaiPhong,
        loaiphong: roomType ? {
          tenLoaiPhong: roomType.tenLoaiPhong,
          soNguoi: roomType.soNguoi,
          soGiuong: roomType.soGiuong,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRooms,
      total: formattedRooms.length
    });

  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Lỗi server khi lấy danh sách phòng',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}