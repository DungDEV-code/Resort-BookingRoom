import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Cập nhật trạng thái bình luận
export async function PUT(req: NextRequest, { params }: { params: { maBinhLuan: string } }) {
  try {
    const { trangThai } = await req.json();
    if (!["ChoPheDuyet", "DaPheDuyet", "BiTuChoi"].includes(trangThai)) {
      return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    const updated = await prisma.binhluan.update({
      where: { maBinhLuan: params.maBinhLuan },
      data: { trangThai },
    });

    return NextResponse.json({ message: "Cập nhật thành công", data: updated });
  } catch (error) {
    console.error("PUT /admin/comments error:", error);
    return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
  }
}

// 🗑️ Xóa bình luận
export async function DELETE(
  _request: Request,
  { params }: { params: { maBinhLuan: string } }
) {
  try {
    await prisma.binhluan.delete({
      where: { maBinhLuan: params.maBinhLuan },
    })

    return NextResponse.json({ message: "Xóa thành công" })
  } catch (error) {
    console.error("Lỗi DELETE bình luận:", error)
    return NextResponse.json({ message: "Xóa thất bại" }, { status: 500 })
  }
}
