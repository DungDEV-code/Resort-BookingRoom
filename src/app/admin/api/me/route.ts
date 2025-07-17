// app/admin/api/me/route.ts
import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("adminToken")?.value
    if (!token) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role: string }

    return NextResponse.json({ email: decoded.email, role: decoded.role })
  } catch (error) {
    return NextResponse.json({ error: "Token không hợp lệ" }, { status: 401 })
  }
}
