import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("adminToken")?.value
    if (!token) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string }

    const nhanVien = await prisma.nhanvien.findUnique({
      where: { maUser: decoded.email }, // maUser chính là email trong roleadminuser
      select: {
        maUser: true,
        chucVu: true,
        roleadminuser: {
          select: {
            role: true,
          },
        },
      },
    })

    if (!nhanVien || !nhanVien.roleadminuser)
      return NextResponse.json({ error: "Không tìm thấy nhân viên hoặc role" }, { status: 404 })

    return NextResponse.json({
      email: nhanVien.maUser,
      chucVu: nhanVien.chucVu,
      role: nhanVien.roleadminuser.role, // Lấy từ bảng roleadminuser
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Token không hợp lệ" }, { status: 401 })
  }
}
