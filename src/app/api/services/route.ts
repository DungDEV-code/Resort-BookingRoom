// app/api/rooms/route.ts


import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
    try {
        const services = await prisma.dichvu.findMany({
            select: {
                tenDV: true,
                moTaDV: true,
                giaDV: true,
                anhDV: true,
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error("Lỗi lấy services:", error);
        return NextResponse.json({ message: "Lỗi server khi lấy services" }, { status: 500 });
    }
}
