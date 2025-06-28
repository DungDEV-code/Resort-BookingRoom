import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roleadminuser_role, roleadminuser_trangThaiTk } from "@/generated/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { email, userName, password } = await req.json();

    if (!email || !userName) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!userName) missingFields.push("userName");

      return NextResponse.json(
        { message: `Thiếu trường: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const exists = await prisma.roleadminuser.findFirst({
      where: { OR: [{ email }, { userName }] },
    });

    if (exists) {
      return NextResponse.json({ message: "Email hoặc username đã tồn tại." }, { status: 409 });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

    const newUser = await prisma.roleadminuser.create({
      data: {
        email,
        userName,
        passWord: hashedPassword,
        trangThaiTk: roleadminuser_trangThaiTk.DangHoatDong,
        role: roleadminuser_role.KhachHang,
      },
    });

    return NextResponse.json({ message: "Đăng ký thành công!", user: newUser }, { status: 200 });
  } catch (error: any) {
    console.error("Error Register:", error.message);
    return NextResponse.json({ message: "Lỗi server khi đăng ký." }, { status: 500 });
  }
}