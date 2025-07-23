// File: /api/bookings/unpaid/route.ts
import { prisma } from "@/lib/prisma";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ success: false, message: "Thiếu email" }, { status: 400 });
    }

    const khach = await prisma.khachhang.findUnique({
      where: { maUser: email },
      select: { maKhachHang: true },
    });

    if (!khach) {
      return NextResponse.json({ success: false, message: "Không tìm thấy khách hàng" }, { status: 404 });
    }

    const unpaidCount = await prisma.datphong.count({
      where: {
        maKhachHang: khach.maKhachHang,
        NOT: { trangThai: "DaHuy" },
        OR: [
          { hoadon: null },
          {
            hoadon: {
              trangThaiHD: {
                not: "DaThanhToan",
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true, data: unpaidCount }, { status: 200 });
  } catch (error) {
    console.error("Lỗi API kiểm tra đơn chưa thanh toán:", error);
    return NextResponse.json({ success: false, message: "Lỗi server" }, { status: 500 });
  }
}
