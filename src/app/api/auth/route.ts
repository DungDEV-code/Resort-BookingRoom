import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { roleadminuser_role, roleadminuser_trangThaiTk } from "@/generated/prisma"
import jwt from "jsonwebtoken"
import { serialize } from "cookie"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { emailOrUsername, password } = body

    if (!emailOrUsername || !password) {
      return NextResponse.json({ message: "Thiếu thông tin đăng nhập." }, { status: 400 })
    }

    const user = await prisma.roleadminuser.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { userName: emailOrUsername }],
      },
    })

    if (!user) {
      return NextResponse.json({ message: "Tài khoản không tồn tại." }, { status: 404 })
    }

    // Kiểm tra mật khẩu (plaintext - nên hash bằng bcrypt trong tương lai)
    if (user.passWord !== password) {
      return NextResponse.json({ message: "Sai mật khẩu." }, { status: 401 })
    }

    if (
      user.trangThaiTk !== roleadminuser_trangThaiTk.DangHoatDong ||
      user.role !== roleadminuser_role.KhachHang
    ) {
      return NextResponse.json({ message: "Tài khoản không đủ điều kiện đăng nhập." }, { status: 403 })
    }

    // Tạo JWT
    const token = jwt.sign(
      {
        email: user.email,
        userName: user.userName,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    const response = NextResponse.json({
      message: "Đăng nhập thành công!",
      user: {
        email: user.email,
        userName: user.userName,
        role: user.role,
        trangThaiTk: user.trangThaiTk, // Quan trọng! Trả về đúng ENUM key (DangHoatDong, BiKhoa)
      },
    });

    response.headers.set(
      "Set-Cookie",
      serialize("auth_token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 ngày
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    )

    return response
  } catch (err) {
    console.error("Lỗi đăng nhập:", err)
    return NextResponse.json({ message: "Lỗi server." }, { status: 500 })
  }
}
