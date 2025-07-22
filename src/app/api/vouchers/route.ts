import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const vouchers = await prisma.voucher.findMany({
      where: {
        trangThai: "ConHieuLuc",
        ngayBatDau: { lte: today },
        ngayKetThuc: { gte: today },
      },
      select: {
        maVoucher: true,
        tenVoucher: true,
        phanTramGiam: true,
        dieuKienApDung: true,
        ngayBatDau: true,
        ngayKetThuc: true,
        trangThai: true,
      },
    });

    return NextResponse.json(vouchers, { status: 200 });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách voucher:", error);
    return NextResponse.json({ message: "Lỗi server nội bộ" }, { status: 500 });
  }
}