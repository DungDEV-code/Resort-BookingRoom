import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: { maPhong: string } }
) {
  const { maPhong } = context.params;

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

    console.log("Bookings:", bookings); // 👈 kiểm tra kỹ

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Lỗi Prisma:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
