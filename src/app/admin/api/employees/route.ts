import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const employees = await prisma.nhanvien.findMany({
            orderBy: {
                maNhanVien: "asc",
            },
        })

        return NextResponse.json(employees, {
            headers: {
                "Cache-Control": "no-store",
            },
        })
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhân viên:", error)
        return NextResponse.json(
            { error: "Không thể lấy danh sách nhân viên" },
            { status: 500 }
        )
    }
}
function generateRandomMaNhanVien(prefix = "NV") {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    const timestamp = Date.now().toString().slice(-4)
    return `${prefix}${random}${timestamp}`
}
export async function POST(req: Request) {
    try {
        const body = await req.json()

        const {
            maUser,
            tenNhanVien,
            soDienThoai,
            ngayVaoLam,
            viTri,
            trangThaiLamViec,
        } = body

        if (!maUser || !tenNhanVien || !soDienThoai || !ngayVaoLam || !viTri) {
            return NextResponse.json({ error: "Thiếu thông tin cần thiết." }, { status: 400 })
        }

        // ✅ Kiểm tra maUser đã tồn tại trong bảng nhân viên chưa
        const existed = await prisma.nhanvien.findUnique({
            where: { maUser },
        })

        if (existed) {
            return NextResponse.json({ error: "Email này đã được tạo thông tin rồi." }, { status: 400 })
        }

        const maNhanVien = generateRandomMaNhanVien()

        const nhanVien = await prisma.nhanvien.create({
            data: {
                maNhanVien,
                maUser,
                tenNhanVien,
                soDienThoai,
                ngayVaoLam: new Date(ngayVaoLam),
                viTri,
                trangThaiLamViec: trangThaiLamViec as any || undefined,
            },
        })

        return NextResponse.json(nhanVien)
    } catch (error) {
        console.error("Lỗi khi tạo nhân viên:", error)
        return NextResponse.json({ error: "Không thể tạo nhân viên." }, { status: 500 })
    }
}