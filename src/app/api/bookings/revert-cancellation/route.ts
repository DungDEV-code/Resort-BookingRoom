import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { datphong_trangThai } from "@/generated/prisma" // enum Prisma

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { maDatPhong } = body

    if (!maDatPhong) {
      return NextResponse.json(
        { success: false, message: "Thiếu mã đặt phòng!" },
        { status: 400 }
      )
    }

    const booking = await prisma.datphong.findUnique({
      where: { maDatPhong },
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đặt phòng!" },
        { status: 404 }
      )
    }

    // Kiểm tra trạng thái phải là "YeuCauHuy"
    if (booking.trangThai !== datphong_trangThai.YeuCauHuy) {
      return NextResponse.json(
        { success: false, message: "Đặt phòng không ở trạng thái yêu cầu hủy." },
        { status: 400 }
      )
    }

    // Cập nhật trạng thái thành null (chưa xử lý tiếp)
    await prisma.datphong.update({
      where: { maDatPhong },
      data: {
        trangThai: 'ChoXacNhan',
        lyDoHuy: null, // Optional: xóa lý do hủy nếu có
      },
    })

    return NextResponse.json({ success: true, message: "Thu hồi yêu cầu hủy thành công!" })
  } catch (error) {
    console.error("Lỗi khi thu hồi yêu cầu hủy:", error)
    return NextResponse.json(
      { success: false, message: "Lỗi hệ thống, vui lòng thử lại sau." },
      { status: 500 }
    )
  }
}
