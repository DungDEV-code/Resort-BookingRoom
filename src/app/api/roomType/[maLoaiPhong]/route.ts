import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { phong_tinhTrang } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    // Lấy mã loại phòng từ URL
    const maLoaiPhong = request.nextUrl.pathname.split("/").pop();

    if (!maLoaiPhong) {
      return NextResponse.json({ message: "Thiếu mã loại phòng" }, { status: 400 });
    }

    // Truy vấn loại phòng
    const roomType = await prisma.loaiphong.findUnique({
      where: { maLoaiPhong },
      select: {
        maLoaiPhong: true,
        tenLoaiPhong: true,
        moTa: true,
        hinhAnh: true,
        soNguoi: true,
        soGiuong: true,
        gia_min: true,
        gia_max: true,
      },
    });

    if (!roomType) {
      return NextResponse.json({ message: "Không tìm thấy loại phòng" }, { status: 404 });
    }

    // Truy vấn các phòng thuộc loại phòng đó
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

    // Tính toán khoảng giá (nếu chưa có trong bảng `loaiphong`)
    const giaMin = roomType.gia_min ?? (rooms.length > 0 ? Math.min(...rooms.map((r) => Number(r.gia))) : 800000);
    const giaMax = roomType.gia_max ?? (rooms.length > 0 ? Math.max(...rooms.map((r) => Number(r.gia))) : 1500000);

    // Số phòng trống
    const availableRooms = rooms.filter(
      (room) => room.tinhTrang === phong_tinhTrang.Trong
    ).length;

    // Chuẩn hóa dữ liệu trả về
    const responseData = {
      ...roomType,
      priceRange: {
        min: giaMin,
        max: giaMax,
      },
      amenities: ["Wifi miễn phí", "Ban công riêng", "Điều hòa", "Mini Bar"], // Tùy biến thêm
      rating: 4.5, // có thể tính trung bình `binhluan.danhGia` theo `datphong.maPhong` nếu cần
      totalRooms: rooms.length,
      availableRooms,
      rooms: rooms.map((room) => ({
        maPhong: room.maPhong,
        tenPhong: room.tenPhong,
        gia: Number(room.gia),
        tinhTrang: room.tinhTrang ?? phong_tinhTrang.Trong,
        hinhAnh: room.hinhAnh || roomType.hinhAnh,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin loại phòng:", error);
    return NextResponse.json(
      { message: "Lỗi server khi lấy loại phòng" },
      { status: 500 }
    );
  }
}
