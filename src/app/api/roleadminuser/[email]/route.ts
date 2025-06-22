import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email: encodedEmail } = await params;
    const email = decodeURIComponent(encodedEmail);
    const body = await req.json();
    const { userName, passWord } = body;

    const updated = await prisma.roleadminuser.update({
      where: { email },
      data: {
        userName,
        passWord, // nếu cần hash mật khẩu thì xử lý thêm ở đây
      },
    });

    return NextResponse.json({ message: "Tài khoản đã được cập nhật", updated });
  } catch (error) {
    console.error("Lỗi cập nhật roleadminuser:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ email: string }> }) {
  try {
    const { email: encodedEmail } = await context.params;
    const email = decodeURIComponent(encodedEmail);

    const user = await prisma.roleadminuser.findUnique({
      where: { email },
      select: {
        userName: true,
        trangThaiTk: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Lỗi lấy roleadminuser:", error);
    return NextResponse.json({ error: "Không thể lấy dữ liệu" }, { status: 500 });
  }
}