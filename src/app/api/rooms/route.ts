import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TINH_TRANG_MAP: Record<string, string> = {
  Trong: "Trống",
  DaDat: "Đã Đặt",
  DangDonDep: "Đang dọn dẹp",
  DangSuaChua: "Đang sửa chữa",
};

export async function GET() {
  try {
    const rooms = await prisma.phong.findMany({
      select: {
        maPhong: true,
        moTa: true,
        tinhTrang: true,
        gia: true,
        hinhAnh: true,
        tenPhong: true,
        loaiphong: {
          select: {
            tenLoaiPhong: true,
            soNguoi: true,
            soGiuong: true,
          },
        },
      },
    });

    const formattedRooms = rooms.map((room) => ({
      ...room,
      tinhTrang: room.tinhTrang ? TINH_TRANG_MAP[room.tinhTrang] || room.tinhTrang : "Không xác định",
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
