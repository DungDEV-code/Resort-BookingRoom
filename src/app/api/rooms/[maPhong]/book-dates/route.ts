import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ maPhong: string }> }
) {
  const { maPhong } = await params;

  if (!maPhong) {
    return NextResponse.json(
      { success: false, message: "Vui lòng cung cấp mã phòng" },
      { status: 400 }
    );
  }

  try {
    const bookings = await prisma.datphong.findMany({
      where: { maPhong },
      select: {
        check_in: true,
        check_out: true,
      },
    });

    console.log("Bookings for maPhong:", maPhong, JSON.stringify(bookings, null, 2));

    // Chuẩn hóa định dạng ngày và lọc bỏ các booking không hợp lệ
    const formattedBookings = bookings
      .filter((booking) => booking.check_in && booking.check_out) // Lọc bỏ booking có check_in hoặc check_out là null
      .map((booking) => ({
        check_in: booking.check_in!.toISOString().split("T")[0], // Sử dụng ! vì đã lọc null
        check_out: booking.check_out!.toISOString().split("T")[0],
      }));

    return NextResponse.json({ success: true, data: formattedBookings });
  } catch (error) {
    console.error("Lỗi Prisma:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}