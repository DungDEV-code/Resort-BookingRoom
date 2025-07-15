import { prisma } from "@/lib/prisma"

import fs from "fs/promises"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

// PUT: Cập nhật dịch vụ
export async function PUT(
  req: NextRequest,
  context: { params: { maDV: string } }
) {
  try {
    const { maDV } = context.params;

    const form = await req.formData();
    const tenDV = form.get("tenDV")?.toString() || "";
    const moTaDV = form.get("moTaDV")?.toString() || "";
    const giaDV = Number(form.get("giaDV"));
    let anhDV = "";

    const file = form.get("anhDV");
    if (file instanceof File && file.size > 0) {
      const dir = path.join(process.cwd(), "public", "img", "services");
      await fs.mkdir(dir, { recursive: true }); // ✅ đảm bảo thư mục tồn tại

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const filepath = path.join(dir, filename);

      await fs.writeFile(filepath, buffer);
      anhDV = filename;
    } else {
      anhDV = form.get("anhDV")?.toString() || "";
    }

    const updated = await prisma.dichvu.update({
      where: { maDV },
      data: {
        tenDV,
        moTaDV,
        giaDV,
        anhDV, // ✅ chỉ lưu tên file
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi cập nhật dịch vụ:", error);
    return NextResponse.json(
      { error: "Không cập nhật được dịch vụ" },
      { status: 500 }
    );
  }
}


// DELETE: Xóa dịch vụ
export async function DELETE(
  req: NextRequest,
  { params }: { params: { maDV: string } }
) {
  try {
    const { maDV } = params

    // Kiểm tra dịch vụ có tồn tại không
    const exists = await prisma.dichvu.findUnique({
      where: { maDV },
    })

    if (!exists) {
      return NextResponse.json(
        { error: "Dịch vụ không tồn tại" },
        { status: 404 }
      )
    }

    // Tiến hành xóa
    await prisma.dichvu.delete({
      where: { maDV },
    })

    return NextResponse.json({ message: "Xóa dịch vụ thành công" })
  } catch (error) {
    console.error("Lỗi khi xóa dịch vụ:", error)
    return NextResponse.json(
      { error: "Không thể xóa dịch vụ" },
      { status: 500 }
    )
  }
}