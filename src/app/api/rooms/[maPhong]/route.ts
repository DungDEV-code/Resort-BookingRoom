import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TINH_TRANG_MAP: Record<string, string> = {
  Trong: "Trống",
  DaDat: "Đã Đặt",
  DangDonDep: "Đang dọn dẹp",
  DangSuaChua: "Đang sửa chữa",
};

export async function GET(
  request: Request,
  context: { params: Promise<{ maPhong?: string }> } // Sử dụng Promise cho params
) {
  try {
    // Await params để lấy maPhong
    const { maPhong } = await context.params;

    // Kiểm tra maPhong
    if (!maPhong) {
      return NextResponse.json({ error: "Mã phòng không hợp lệ" }, { status: 400 });
    }

    const room = await prisma.phong.findUnique({
      where: { maPhong },
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

    if (!room) {
      return NextResponse.json({ error: "Phòng không tồn tại" }, { status: 404 });
    }

    const formattedRoom = {
      maPhong: room.maPhong,
      moTa: room.moTa || "",
      tinhTrang: room.tinhTrang ? TINH_TRANG_MAP[room.tinhTrang] || room.tinhTrang : "Không xác định",
      gia: Number(room.gia), // Chuyển Decimal thành number
      hinhAnh: room.hinhAnh || "/placeholder.svg?height=384&width=896",
      tenPhong: room.tenPhong || room.loaiphong?.tenLoaiPhong || "Phòng không xác định",
      loaiphong: {
        tenLoaiPhong: room.loaiphong?.tenLoaiPhong || "",
        soNguoi: room.loaiphong?.soNguoi || 2,
        soGiuong: room.loaiphong?.soGiuong || 1,
      },
      rating: Number((Math.random() * 2 + 3).toFixed(1)), // Giả lập rating
      tienNghi: ["wifi", "parking", "pool", "gym"].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2), // Giả lập tiện nghi
    };

    return NextResponse.json(formattedRoom, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin phòng:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}