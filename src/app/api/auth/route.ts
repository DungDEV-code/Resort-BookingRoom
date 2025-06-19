import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { emailOrUsername, password } = body

    if (!emailOrUsername || !password) {
      return NextResponse.json({ message: "Thiếu thông tin đăng nhập." }, { status: 400 })
    }

    const user = await prisma.roleadminuser.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { userName: emailOrUsername },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ message: "Tài khoản không tồn tại." }, { status: 404 })
    }

    // So sánh mật khẩu thường (không mã hóa)
    if (user.passWord !== password) {
      return NextResponse.json({ message: "Sai mật khẩu." }, { status: 401 })
    }

    // Chặn đăng nhập nếu tài khoản không hoạt động hoặc không phải khách hàng
    if (user.trangThaiTk !== "Đang hoạt " || user.role !== "Khách Hàng") {
      return NextResponse.json({ message: "Tài khoản không đủ điều kiện đăng nhập." }, { status: 403 })
    }

    return NextResponse.json({
      message: "Đăng nhập thành công.",
      user: {
        email: user.email,
        role: user.role,
        userName: user.userName,
        trangThaiTk: user.trangThaiTk,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ message: "Lỗi server." }, { status: 500 })
  }
}
