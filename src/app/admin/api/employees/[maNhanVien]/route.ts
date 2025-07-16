import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { maNhanVien: string } }) {
  try {
    const body = await req.json()
    const {
      tenNhanVien,
      soDienThoai,
      ngayVaoLam,
      viTri,
      trangThaiLamViec,
    } = body

    const updated = await prisma.nhanvien.update({
      where: { maNhanVien: params.maNhanVien },
      data: {
        tenNhanVien,
        soDienThoai,
        ngayVaoLam: new Date(ngayVaoLam),
        viTri,
        trangThaiLamViec,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Lỗi khi cập nhật nhân viên:", error)
    return NextResponse.json(
      { error: "Không thể cập nhật nhân viên" },
      { status: 500 }
    )
  }
}
