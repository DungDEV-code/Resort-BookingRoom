import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { maHD: string } }) {
    const { maHD } = params

    try {
        const body = await request.json()
        const { trangThaiHD } = body

        if (!["ChuaThanhToan", "DaThanhToan"].includes(trangThaiHD)) {
            return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 })
        }

        const updated = await prisma.hoadon.update({
            where: { maHD },
            data: {
                trangThaiHD,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Lỗi khi cập nhật hóa đơn:", error)
        return NextResponse.json(
            { message: "Lỗi khi cập nhật trạng thái hóa đơn" },
            { status: 500 }
        )
    }
}
