import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { serialize } from "cookie";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: "Đã đăng xuất" });

  // 1️⃣ Xóa cookie auth_token (dùng cho đăng nhập thông thường)
  response.headers.set(
    "Set-Cookie",
    serialize("auth_token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0, // Hủy cookie
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  );

  // 2️⃣ Xóa cookie session của NextAuth (dùng cho đăng nhập Google)
  const session = await getServerSession(authOptions);
  if (session) {
    // Xóa cookie session của NextAuth (tên cookie mặc định là next-auth.session-token)
    response.headers.append(
      "Set-Cookie",
      serialize("next-auth.session-token", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0, // Hủy cookie
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    );
  }

  return response;
}