import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
export async function GET() {
  try {
    const users = await prisma.roleadminuser.findMany({
      select: {
        email: true,
        userName: true,
        trangThaiTk: true,
        role: true,
        passWord:true,
      },
    })

    // Map kết quả để frontend dễ dùng
    const formattedUsers = users.map((user) => ({
      email: user.email,
      userName: user.userName,
      trangThaiTk: user.trangThaiTk ?? "DangHoatDong",
      role: user.role ?? "Không xác định",
      passWord:user.passWord,
    }))

    return NextResponse.json(formattedUsers, {
      headers: {
        "Cache-Control": "no-store", // Không cache
      },
    })
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy danh sách người dùng:", error)
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách người dùng", message: error.message },
      { status: 500 }
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, userName, passWord, role, trangThaiTk } = body

    if (!email || !userName || !passWord || !role) {
      return NextResponse.json({ error: "Thiếu thông tin tài khoản" }, { status: 400 })
    }

    // Kiểm tra email đã tồn tại chưa
    const existing = await prisma.roleadminuser.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email đã tồn tại" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(passWord, 10)

    const newUser = await prisma.roleadminuser.create({
      data: {
        email,
        userName,
        passWord: hashedPassword,
        role,
        trangThaiTk: trangThaiTk || "DangHoatDong",
      },
    })

    return NextResponse.json({ message: "Tạo tài khoản thành công", data: newUser })
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản:", error)
    return NextResponse.json({ error: "Lỗi khi tạo tài khoản" }, { status: 500 })
  }
}
