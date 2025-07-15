import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { phong_tinhTrang } from "@/generated/prisma";

// Schema validation for request body (reused from POST)
const RoomSchema = z.object({
    maPhong: z.string().min(1, "Mã phòng không được để trống").max(20),
    tenPhong: z.string().max(50).optional().default(""),
    maLoaiPhong: z.string().min(1, "Mã loại phòng không được để trống").max(20),
    moTa: z.string().optional().default(""),
    tinhTrang: z.nativeEnum(phong_tinhTrang).default("Trong"),
    gia: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
});

// GET: View details of a specific room
export async function GET(req: NextRequest) {
  try {
    // 🟢 Tách maPhong từ URL
    const url = new URL(req.url)
    const segments = url.pathname.split("/")
    const maPhong = segments[segments.length - 1]

    if (!maPhong) {
      return NextResponse.json({ error: "Thiếu mã phòng" }, { status: 400 })
    }

    const room = await prisma.phong.findUnique({
      where: { maPhong },
      select: {
        maPhong: true,
        tenPhong: true,
        maLoaiPhong: true,
        moTa: true,
        tinhTrang: true,
        gia: true,
        hinhAnh: true,
        loaiphong: {
          select: {
            tenLoaiPhong: true,
          },
        },
        _count: {
          select: {
            datphong: true, // Đếm số lượng đơn đặt phòng
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Phòng không tồn tại" }, { status: 404 })
    }

    return NextResponse.json(
      {
        ...room,
        bookingCount: room._count.datphong,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phòng:", error)
    return NextResponse.json(
      {
        error: "Lỗi khi lấy chi tiết phòng",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}


// PUT: Update an existing room
export async function PUT(req: NextRequest, { params }: { params: { maPhong: string } }) {
    let filename = "";

    try {
        const { maPhong } = params;
        const form = await req.formData();
        const file = form.get("hinhAnh") as File | string;

        // Validate room existence
        const existingRoom = await prisma.phong.findUnique({
            where: { maPhong },
        });
        if (!existingRoom) {
            return NextResponse.json(
                { error: "Phòng không tồn tại" },
                { status: 404 }
            );
        }

        // Handle image upload if a new file is provided
        if (file && typeof file !== "string") {
            const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!validTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: "Chỉ chấp nhận file ảnh" },
                    { status: 400 }
                );
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "Ảnh vượt quá 5MB" },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
            const filepath = path.join(process.cwd(), "public", "img", "rooms", filename);
            await fs.writeFile(filepath, buffer);

            // Delete old image if it exists
            if (existingRoom.hinhAnh) {
                const oldFilePath = path.join(process.cwd(), "public", "img", "rooms", existingRoom.hinhAnh);
                await fs.unlink(oldFilePath).catch(() => { });
            }
        }

        // Get form values
        const tenPhong = form.get("tenPhong")?.toString() ?? "";
        const maLoaiPhong = form.get("maLoaiPhong")?.toString() ?? "";
        const moTa = form.get("moTa")?.toString() ?? "";
        const tinhTrang = form.get("tinhTrang")?.toString() as phong_tinhTrang ?? "Trong";
        const gia = Number(form.get("gia"));

        // Validate input
        const validated = RoomSchema.safeParse({
            maPhong,
            tenPhong,
            maLoaiPhong,
            moTa,
            tinhTrang,
            gia,
        });

        if (!validated.success) {
            if (filename) {
                await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { });
            }
            return NextResponse.json(
                { error: "Dữ liệu không hợp lệ", details: validated.error.errors },
                { status: 400 }
            );
        }

        // Check if room type exists
        const loaiPhong = await prisma.loaiphong.findUnique({
            where: { maLoaiPhong },
            select: { tenLoaiPhong: true },
        });

        if (!loaiPhong) {
            if (filename) {
                await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { });
            }
            return NextResponse.json(
                { error: "Mã loại phòng không tồn tại" },
                { status: 400 }
            );
        }

        // Update room
        const updatedRoom = await prisma.phong.update({
            where: { maPhong },
            data: {
                tenPhong,
                maLoaiPhong,
                moTa,
                tinhTrang,
                gia,
                hinhAnh: filename || existingRoom.hinhAnh, // Keep old image if no new one
            },
            include: {
                loaiphong: {
                    select: { tenLoaiPhong: true },
                },
            },
        });

        return NextResponse.json(updatedRoom, { status: 200 });
    } catch (error) {
        if (filename) {
            await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { });
        }
        console.error("Lỗi khi cập nhật phòng:", error);
        return NextResponse.json(
            { error: "Lỗi khi cập nhật phòng hoặc upload ảnh" },
            { status: 500 }
        );
    }
}

// DELETE: Delete a room
export async function DELETE(req: NextRequest, { params }: { params: { maPhong: string } }) {
    try {
        const { maPhong } = params;

        // Validate room existence
        const existingRoom = await prisma.phong.findUnique({
            where: { maPhong },
        });
        if (!existingRoom) {
            return NextResponse.json(
                { error: "Phòng không tồn tại" },
                { status: 404 }
            );
        }

        // Check if room has associated bookings
        const bookings = await prisma.datphong.findMany({
            where: { maPhong },
            select: { maDatPhong: true },
        });
        if (bookings.length > 0) {
            return NextResponse.json(
                { error: "Không thể xóa phòng vì có đặt phòng liên quan" },
                { status: 400 }
            );
        }

        // Delete image if it exists
        if (existingRoom.hinhAnh) {
            const filePath = path.join(process.cwd(), "public", "img", "rooms", existingRoom.hinhAnh);
            await fs.unlink(filePath).catch(() => { });
        }

        // Delete room
        await prisma.phong.delete({
            where: { maPhong },
        });

        return NextResponse.json(
            { message: "Xóa phòng thành công" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Lỗi khi xóa phòng:", error);
        return NextResponse.json(
            { error: "Lỗi khi xóa phòng" },
            { status: 500 }
        );
    }
}