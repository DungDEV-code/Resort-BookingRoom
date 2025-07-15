import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs/promises"
import path from "path";

// ✅ GET: Lấy tất cả loại phòng
export async function GET() {
  try {
    const roomTypes = await prisma.loaiphong.findMany({
      include: {
        phong: {
          select: { maPhong: true },
        },
      },
    });

    return NextResponse.json(roomTypes, {
      headers: {
        "Cache-Control": "no-store", // ⚠️ Không cache response
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách loại phòng:", error);
    return NextResponse.json(
      { error: "Lỗi khi lấy danh sách loại phòng" },
      { status: 500 }
    );
  }
}

// ✅ POST: Tạo mới một loại phòng
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("hinhAnh") as File;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Ảnh không hợp lệ" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filepath = path.join(process.cwd(), "public", "img", filename);
    await fs.writeFile(filepath, buffer);

    // ✅ Lấy dữ liệu từ form
    const maLoaiPhong = form.get("maLoaiPhong")?.toString() ?? "";
    const tenLoaiPhong = form.get("tenLoaiPhong")?.toString() ?? "";
    const moTa = form.get("moTa")?.toString() ?? "";

    const soNguoi = Number(form.get("soNguoi"));
    const soGiuong = Number(form.get("soGiuong"));
    const gia_min = Number(form.get("gia_min"));
    const gia_max = Number(form.get("gia_max"));

    // ✅ Kiểm tra số có hợp lệ không
    if (
      !maLoaiPhong ||
      !tenLoaiPhong ||
      !moTa ||
      isNaN(soNguoi) || soNguoi <= 0 ||
      isNaN(soGiuong) || soGiuong <= 0 ||
      isNaN(gia_min) || gia_min <= 0 ||
      isNaN(gia_max) || gia_max <= 0
    ) {
      return NextResponse.json({
        error: "Vui lòng nhập đầy đủ và chính xác các trường số và thông tin bắt buộc!",
      }, { status: 400 });
    }

    const newRoomType = await prisma.loaiphong.create({
      data: {
        maLoaiPhong,
        tenLoaiPhong,
        moTa,
        hinhAnh: filename,
        soNguoi,
        soGiuong,
        gia_min,
        gia_max,
      },
    });

    return NextResponse.json(newRoomType, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi upload ảnh:", error);
    return NextResponse.json({ error: "Upload thất bại" }, { status: 500 });
  }
}

