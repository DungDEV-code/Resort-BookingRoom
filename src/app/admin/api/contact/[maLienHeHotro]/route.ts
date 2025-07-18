import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { maLienHeHotro: string } }) {
  try {
    const { maLienHeHotro } = params
    const body = await request.json()
    const { trangThai } = body

    // Validate trạng thái
    const validStatuses = ["Moi", "DangXuLy", "DaXuLy"]
    if (!validStatuses.includes(trangThai)) {
      return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 })
    }

    // Cập nhật trạng thái liên hệ hỗ trợ
    const updatedContact = await prisma.lienhe_hotro.update({
      where: {
        maLienHeHotro: maLienHeHotro,
      },
      data: {
        trangThai: trangThai as any,
        ngayCapNhat: new Date(),
      },
      include: {
        khachhang: {
          select: {
            tenKhachHang: true,
            soDienThoai: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: updatedContact,
    })
  } catch (error: any) {
    console.error("PUT /api/contact/[maLienHeHotro] error:", error)

    if (error.code === "P2025") {
      return NextResponse.json({ message: "Không tìm thấy liên hệ hỗ trợ" }, { status: 404 })
    }

    return NextResponse.json({ message: "Không thể cập nhật trạng thái liên hệ hỗ trợ" }, { status: 500 })
  }
}
