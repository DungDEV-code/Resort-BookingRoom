import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { roleadminuser_trangThaiTk } from "@/generated/prisma"
export async function PATCH(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try { 
    const { email } = params
    const body = await request.json()
    const { trangThaiTk } = body

    if (!trangThaiTk || !["DangHoatDong", "BiKhoa"].includes(trangThaiTk)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 })
    }

    const user = await prisma.roleadminuser.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 })
    }

    const updatedUser = await prisma.roleadminuser.update({
      where: { email },
      data: { trangThaiTk: trangThaiTk as roleadminuser_trangThaiTk },
    })

    return NextResponse.json({
      message: `Đã cập nhật trạng thái tài khoản ${email}`,
      data: updatedUser,
    })
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái:", error)
    return NextResponse.json(
      { error: "Lỗi khi cập nhật trạng thái tài khoản" },
      { status: 500 }
    )
  }
}
