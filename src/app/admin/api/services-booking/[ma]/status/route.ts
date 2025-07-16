import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { ma: string } }
) {
  try {
    const { ma } = params;

    // Kiểm tra dịch vụ có tồn tại không
    const service = await prisma.dichvudatphong.findUnique({
      where: { ma },
    });

    if (!service) {
      return NextResponse.json({ error: "Không tìm thấy dịch vụ" }, { status: 404 });
    }

    // Toggle trạng thái
    const newStatus =
      service.trangThaiDV === "DaHoanThanh"
        ? "ChuaHoanThanh"
        : "DaHoanThanh";

    const updated = await prisma.dichvudatphong.update({
      where: { ma },
      data: {
        trangThaiDV: newStatus,
      },
    });

    return NextResponse.json({
      message: "Cập nhật trạng thái thành công",
      trangThaiDV: updated.trangThaiDV,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi cập nhật trạng thái" },
      { status: 500 }
    );
  }
}
