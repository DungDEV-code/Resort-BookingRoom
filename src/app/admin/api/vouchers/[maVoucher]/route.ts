import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// PUT: Cập nhật voucher theo mã
export async function PUT(
  req: NextRequest,
  { params }: { params: { maVoucher: string } }
) {
  try {
    const { maVoucher } = params
    const body = await req.json()

    // ✅ Kiểm tra điều kiện áp dụng là số hợp lệ
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

    const updated = await prisma.voucher.update({
      where: { maVoucher },
      data: {
        tenVoucher: body.tenVoucher,
        moTa: body.moTa,
        phanTramGiam: body.phanTramGiam,
        ngayBatDau: new Date(body.ngayBatDau),
        ngayKetThuc: new Date(body.ngayKetThuc),
        dieuKienApDung: Number(body.dieuKienApDung), // ép kiểu rõ ràng
        trangThai: body.trangThai,
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Cập nhật thất bại" },
      { status: 500 }
    )
  }
}


// DELETE: Xóa voucher theo mã
export async function DELETE(req: NextRequest, { params }: { params: { maVoucher: string } }) {
  try {
    const { maVoucher } = params
    await prisma.voucher.delete({ where: { maVoucher } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Xóa thất bại" }, { status: 500 })
  }
}
