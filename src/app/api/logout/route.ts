// src/app/api/logout/route.ts
import { NextResponse } from "next/server"
import { serialize } from "cookie"

export async function POST() {
  const response = NextResponse.json({ message: "Đã đăng xuất" })
  response.headers.set(
    "Set-Cookie",
    serialize("auth_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0, // Hủy cookie
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  )
  return response
}
