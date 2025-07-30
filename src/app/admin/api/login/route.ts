
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Find user by email
    const user = await prisma.roleadminuser.findUnique({
      where: { email },
      include: {
        nhanvien: true, // Include nhanvien to get chucVu for NhanVien role
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 401 })
    }
    if (user.trangThaiTk !== "DangHoatDong") {
      return NextResponse.json({ error: "Tài khoản đã bị vô hiệu hóa" }, { status: 403 })
    }
    // Check if user role is Admin or NhanVien
    if (user.role !== "Admin" && user.role !== "NhanVien") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passWord)
    if (!isMatch) {
      return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 })
    }

    // Create JWT token with role and chucVu (if NhanVien)
    const tokenPayload: { email: string; role: string; chucVu?: string } = {
      email: user.email,
      role: user.role,
    }
    if (user.role === "NhanVien" && user.nhanvien) {
      tokenPayload.chucVu = user.nhanvien.chucVu
    } else if (user.role === "Admin") {
      tokenPayload.chucVu = "Admin" // Explicitly set chucVu for Admin
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" })

    // Return token as cookie
    const response = NextResponse.json({
      message: "Đăng nhập thành công",
      email: user.email,
      role: user.role,
      chucVu: tokenPayload.chucVu,
    })

    response.cookies.set("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Lỗi API đăng nhập:", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}