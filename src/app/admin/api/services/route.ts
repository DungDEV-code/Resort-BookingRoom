import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

// GET: Lấy tất cả dịch vụ
export async function GET() {
  try {
    const services = await prisma.dichvu.findMany({
      include: {
        dichvudatphong: {
          select: { maDatPhong: true },
        },
      },
    });

    return NextResponse.json(services, {
      headers: {
        "Cache-Control": "no-store", // Không cache response
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dịch vụ:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách dịch vụ" },
      { status: 500 }
    );
  }
}

// POST: Tạo mới một dịch vụ
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("anhDV") as File;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Ảnh không hợp lệ" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    
    // ✅ Sửa lại đường dẫn lưu ảnh
    const filepath = path.join(process.cwd(), "public", "img", "services", filename);
    await fs.writeFile(filepath, buffer);

    // Lấy dữ liệu từ form
    const maDV = form.get("maDV")?.toString() ?? "";
    const tenDV = form.get("tenDV")?.toString() ?? "";
    const moTaDV = form.get("moTaDV")?.toString() ?? "";
    const giaDV = Number(form.get("giaDV"));

    // Kiểm tra dữ liệu đầu vào
    if (!maDV || !tenDV || !moTaDV || isNaN(giaDV) || giaDV <= 0) {
      return NextResponse.json({
        error: "Vui lòng nhập đầy đủ và chính xác các trường thông tin bắt buộc!",
      }, { status: 400 });
    }

    // Lưu vào DB chỉ tên ảnh
    const newService = await prisma.dichvu.create({
      data: {
        maDV,
        tenDV,
        moTaDV,
        giaDV,
        anhDV: filename, // ✅ Chỉ lưu tên
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo dịch vụ:", error);
    return NextResponse.json({ error: "Tạo dịch vụ thất bại" }, { status: 500 });
  }
}