// /api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // điều chỉnh nếu khác

export async function GET(req: NextRequest) {
  // 1️⃣ Ưu tiên kiểm tra auth_token (JWT - đăng nhập thường)
  const token = req.cookies.get("auth_token")?.value;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      return NextResponse.json({ user: decoded });
    } catch {
      // JWT không hợp lệ → thử NextAuth
    }
  }

  // 2️⃣ Nếu không có JWT hoặc JWT không hợp lệ → kiểm tra session của NextAuth (Google)
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return NextResponse.json({ user: session.user });
  }

  return NextResponse.json({ user: null }, { status: 401 });
}
