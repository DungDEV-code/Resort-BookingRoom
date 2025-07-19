import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET: Lấy danh sách voucher
export async function GET() {
    try {
        const vouchers = await prisma.voucher.findMany({
            orderBy: { ngayBatDau: "desc" }
        })
        return NextResponse.json({ success: true, data: vouchers })
    } catch (error) {
        return NextResponse.json({ success: false, message: "Lỗi khi lấy dữ liệu" }, { status: 500 })
    }
}
function generateVoucherCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const randomPart = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `VOUCHER_${randomPart}`
}
// POST: Thêm voucher mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ✅ Kiểm tra điều kiện áp dụng là số và >= 0
    if (
      body.dieuKienApDung === undefined ||
      body.dieuKienApDung === null ||
      isNaN(Number(body.dieuKienApDung)) ||
      Number(body.dieuKienApDung) < 0
    ) {
      return NextResponse.json(
        { success: false, message: "Điều kiện áp dụng phải là một số hợp lệ và không âm." },
        { status: 400 }
      )
    }

    const voucher = await prisma.voucher.create({
      data: {
        maVoucher: generateVoucherCode(),
        tenVoucher: body.tenVoucher,
        moTa: body.moTa,
        phanTramGiam: body.phanTramGiam,
        ngayBatDau: new Date(body.ngayBatDau),
        ngayKetThuc: new Date(body.ngayKetThuc),
        dieuKienApDung: Number(body.dieuKienApDung), // ép kiểu rõ ràng
        trangThai: body.trangThai ?? "ConHieuLuc"
      }
    })

    return NextResponse.json({ success: true, data: voucher })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Thêm thất bại" },
      { status: 500 }
    )
  }
}
