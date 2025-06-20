// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { email, userName, password } = await req.json();

        if (!email || !userName || !password) {
            const missingFields = []
            if (!email) missingFields.push("email")
            if (!userName) missingFields.push("userName")
            if (!password) missingFields.push("password")

            return NextResponse.json(
                { message: `Thiếu trường: ${missingFields.join(", ")}` },
                { status: 400 }
            );
        }

        // Check tồn tại
        const exists = await prisma.roleadminuser.findFirst({
            where: { OR: [{ email }, { userName }] }
        });

        if (exists) {
            return NextResponse.json({ message: "Email hoặc username đã tồn tại." }, { status: 409 });
        }

        const newUser = await prisma.roleadminuser.create({
            data: {
                email,
                userName,
                passWord: password, // nếu chưa hash
                trangThaiTk: "Đang hoạt động",
                role: "Khách Hàng"
            }
        });

        return NextResponse.json({ message: "Đăng ký thành công!", user: newUser });
    } catch (error) {
        console.error("Error Register:", error);
        return NextResponse.json({ message: "Lỗi server khi đăng ký." }, { status: 500 });
    }
}
