// app/admin/api/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Tìm user theo email
    const user = await prisma.roleadminuser.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 401 })
    }

    // Kiểm tra vai trò có phải Admin
    if (user.role !== "Admin") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.passWord)
    if (!isMatch) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 })
    }

    // Tạo token JWT
    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    // Trả về token dưới dạng cookie
    const response = NextResponse.json({ message: "Đăng nhập thành công" })
    response.cookies.set("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Lỗi API đăng nhập:", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}
