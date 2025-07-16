import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { phong_tinhTrang, Prisma } from "@/generated/prisma";


// Schema validation cho request body
const RoomSchema = z.object({
    maPhong: z.string().min(1, "Mã phòng không được để trống").max(20),
    tenPhong: z.string().max(50).optional().default(""),
    maLoaiPhong: z.string().min(1, "Mã loại phòng không được để trống").max(20),
    moTa: z.string().optional().default(""),
    tinhTrang: z.nativeEnum(phong_tinhTrang).default("Trong"),
    gia: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
});

// GET: Lấy danh sách phòng
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const sortBy = searchParams.get("sortBy") || "maPhong";
        const sortOrder = searchParams.get("sortOrder") || "asc";

        // Validate sortBy and sortOrder
        const validSortFields = ["maPhong", "gia"];
        const validSortOrders: Prisma.SortOrder[] = ["asc", "desc"];
        const sortField = validSortFields.includes(sortBy) ? sortBy : "maPhong";
        const sortOrderValidated: Prisma.SortOrder = validSortOrders.includes(sortOrder as Prisma.SortOrder)
            ? (sortOrder as Prisma.SortOrder)
            : "asc";

        const skip = (page - 1) * pageSize;

        // Search condition
        const where: Prisma.phongWhereInput = search
            ? {
                OR: [
                    { maPhong: { contains: search } },
                    { tenPhong: { contains: search } },
                    {
                        loaiphong: {
                            is: {
                                tenLoaiPhong: {
                                    contains: search,
                                },
                            },
                        },
                    },
                ],
            }
            : {};

        // Count total results
        const totalRooms = await prisma.phong.count({ where });

        // Define correct type for returned data
        type PhongWithRelation = Prisma.phongGetPayload<{
            include: {
                loaiphong: { select: { tenLoaiPhong: true } };
                datphong: { select: { maDatPhong: true } };
            };
        }>;

        const orderBy: Prisma.phongOrderByWithRelationInput = {
            [sortField]: sortOrderValidated,
        };

        const rooms: PhongWithRelation[] = await prisma.phong.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                loaiphong: {
                    select: {
                        tenLoaiPhong: true,
                    },
                },
                datphong: {
                    select: {
                        maDatPhong: true,
                    },
                },
            },
            orderBy,
        });

        // Map thêm số lượng đơn đặt
        const formattedRooms = rooms.map((room) => ({
            ...room,
            bookingCount: room.datphong.length,
        }));

        return NextResponse.json(
            {
                rooms: formattedRooms,
                totalRooms,
            },
            {
                headers: { "Cache-Control": "no-store" },
            }
        );
    } catch (error) {
        console.error("Lỗi khi lấy danh sách phòng:", error);
        return NextResponse.json(
            { error: "Lỗi khi lấy danh sách phòng" },
            { status: 500 }
        );
    }
}
// POST: Thêm phòng mới
export async function POST(req: NextRequest) {
    let filename = ""

    try {
        const form = await req.formData()
        const file = form.get("hinhAnh") as File

        // ✅ Xử lý ảnh nếu có
        if (file && typeof file !== "string") {
            const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
            if (!validTypes.includes(file.type)) {
                return NextResponse.json({ error: "Chỉ chấp nhận file ảnh" }, { status: 400 })
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "Ảnh vượt quá 5MB" }, { status: 400 })
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
            const filepath = path.join(process.cwd(), "public", "img", "rooms", filename)
            await fs.writeFile(filepath, buffer)
        }

        // ✅ Lấy giá trị từ form
        const maPhong = form.get("maPhong")?.toString() ?? ""
        const tenPhong = form.get("tenPhong")?.toString() ?? ""
        const maLoaiPhong = form.get("maLoaiPhong")?.toString() ?? ""
        const moTa = form.get("moTa")?.toString() ?? ""
        const tinhTrang = form.get("tinhTrang")?.toString() as phong_tinhTrang ?? "Trong"
        const gia = Number(form.get("gia"))

        // ✅ Validate đầu vào
        const validated = RoomSchema.safeParse({
            maPhong,
            tenPhong,
            maLoaiPhong,
            moTa,
            tinhTrang,
            gia,
        })

        if (!validated.success) {
            if (filename) await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { })
            return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: validated.error.errors }, { status: 400 })
        }

        // ✅ Check mã phòng trùng
        const existing = await prisma.phong.findUnique({ where: { maPhong } })
        if (existing) {
            if (filename) await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { })
            return NextResponse.json({ error: "Mã phòng đã tồn tại" }, { status: 400 })
        }

        // ✅ Check mã loại phòng tồn tại (chỉ cần xác nhận tồn tại)
        const loaiPhong = await prisma.loaiphong.findUnique({
            where: { maLoaiPhong },
            select: { tenLoaiPhong: true }, // chỉ cần tên
        })

        if (!loaiPhong) {
            if (filename) await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { })
            return NextResponse.json({ error: "Mã loại phòng không tồn tại" }, { status: 400 })
        }

        // ✅ Tạo phòng
        const room = await prisma.phong.create({
            data: {
                maPhong,
                tenPhong,
                maLoaiPhong,
                moTa,
                tinhTrang,
                gia,
                hinhAnh: filename,
            },
            select: {
                maPhong: true,
                tenPhong: true,
                maLoaiPhong: true,
                moTa: true,
                tinhTrang: true,
                gia: true,
                hinhAnh: true,
                loaiphong: {
                    select: { tenLoaiPhong: true }, // dùng khi trả về frontend
                },
            },
        })

        return NextResponse.json(room, { status: 201 })
    } catch (err) {
        if (filename) await fs.unlink(path.join(process.cwd(), "public", "img", "rooms", filename)).catch(() => { })
        console.error("Lỗi khi thêm phòng:", err)
        return NextResponse.json({ error: "Lỗi khi thêm phòng hoặc upload ảnh" }, { status: 500 })
    }
}