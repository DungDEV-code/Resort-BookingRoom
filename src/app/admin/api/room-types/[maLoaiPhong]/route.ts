import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
// PUT: Cập nhật loại phòng
export async function PUT(
  req: NextRequest,
  context: { params: { maLoaiPhong: string } }
) {
  try {
    const { params } = context
    const maLoaiPhong = params.maLoaiPhong

    const form = await req.formData()
    const tenLoaiPhong = form.get("tenLoaiPhong")?.toString() || ""
    const moTa = form.get("moTa")?.toString() || ""
    const soNguoi = Number(form.get("soNguoi"))
    const soGiuong = Number(form.get("soGiuong"))
    const gia_min = Number(form.get("gia_min"))
    const gia_max = Number(form.get("gia_max"))

    const file = form.get("hinhAnh")
    let hinhAnh = ""

    if (file instanceof File && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const filepath = path.join(process.cwd(), "public", "img", filename)
      await fs.writeFile(filepath, buffer)
      hinhAnh = filename
    } else {
      hinhAnh = form.get("hinhAnh")?.toString() || ""
    }

    const updated = await prisma.loaiphong.update({
      where: { maLoaiPhong },
      data: {
        tenLoaiPhong,
        moTa,
        soNguoi,
        soGiuong,
        gia_min,
        gia_max,
        hinhAnh,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Lỗi cập nhật loại phòng:", error)
    return NextResponse.json(
      { error: "Không cập nhật được loại phòng" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { maLoaiPhong: string } }
) {
  try {
    const { maLoaiPhong } = params

    // Kiểm tra loại phòng có tồn tại không
    const exists = await prisma.loaiphong.findUnique({
      where: { maLoaiPhong },
    })

    if (!exists) {
      return NextResponse.json(
        { error: "Loại phòng không tồn tại" },
        { status: 404 }
      )
    }

    // Tiến hành xoá
    await prisma.loaiphong.delete({
      where: { maLoaiPhong },
    })

    return NextResponse.json({ message: "Xoá loại phòng thành công" })
  } catch (error) {
    console.error("Lỗi khi xoá loại phòng:", error)
    return NextResponse.json(
      { error: "Không thể xoá loại phòng" },
      { status: 500 }
    )
  }
}

export async function updateLoaiPhong(maLoaiPhong: string, formData: FormData) {
  try {
    const res = await fetch(`/admin/api/room-types/${maLoaiPhong}`, {
      method: "PUT",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, message: err.error || "Cập nhật thất bại" };
    }

    const result = await res.json();
    return { success: true, message: "Cập nhật thành công", data: result };
  } catch (error: any) {
    return { success: false, message: error.message || "Lỗi kết nối tới server" };
  }
}