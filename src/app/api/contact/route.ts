import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { randomUUID } from "crypto";
export async function GET(request: NextRequest) {
    try {
        const user = await getKhachHangFromAuth(request);
        if (!user.success) {
            return NextResponse.json({ message: user.message }, { status: user.status! });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 3;
        const skip = (page - 1) * limit;

        const search = searchParams.get("search")?.trim() || "";
        const trangThai = searchParams.get("trangThai");

        const whereClause: any = {
            maKhachHang: user.maKhachHang, // 👈 chỉ lấy liên hệ của khách hàng này
        };

        if (search) {
            whereClause.maLienHeHotro = search;
        }

        if (trangThai) {
            whereClause.trangThai = trangThai as any;
        }

        const [lienHeList, totalCount] = await Promise.all([
            prisma.lienhe_hotro.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { ngayTao: "desc" },
                include: {
                    khachhang: {
                        select: {
                            tenKhachHang: true,
                            soDienThoai: true,
                        },
                    },
                },
            }),
            prisma.lienhe_hotro.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            data: lienHeList,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error("Lỗi lấy liên hệ hỗ trợ:", error);
        return NextResponse.json({ message: "Lỗi server khi lấy dữ liệu" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getKhachHangFromAuth(req);
        if (!user.success) {
            return NextResponse.json({ message: user.message }, { status: user.status! });
        }

        const body = await req.json();
        const { tieuDe, noiDung } = body;

        if (!tieuDe || !noiDung) {
            return NextResponse.json({ message: "Vui lòng nhập tiêu đề và nội dung." }, { status: 400 });
        }

        const maLienHeHotro = "LH" + Date.now(); // VD: LH17212121212
        const lienHe = await prisma.lienhe_hotro.create({
            data: {
                maLienHeHotro,
                maKhachHang: user.maKhachHang!,
                tieuDe: tieuDe.trim(),
                noiDung: noiDung.trim(),
                // trangThai mặc định là 'Moi'
                ngayTao: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất.",
            data: lienHe,
        }, { status: 201 });
    } catch (error) {
        console.error("Lỗi khi gửi liên hệ:", error);
        return NextResponse.json({ message: "Lỗi máy chủ. Không thể gửi liên hệ." }, { status: 500 });
    }
}

// Trích xuất maKhachHang từ JWT hoặc session
async function getKhachHangFromAuth(req: NextRequest): Promise<{
    success: boolean; message?: string; status?: number; maKhachHang?: string;
}> {
    const token = req.cookies.get("auth_token")?.value;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
            const user = await prisma.roleadminuser.findUnique({
                where: { email: decoded.email },
                include: {
                    khachhang: {
                        select: { maKhachHang: true },
                    },
                },
            });
            if (!user?.khachhang?.maKhachHang) {
                return { success: false, message: "Không tìm thấy khách hàng", status: 404 };
            }
            return { success: true, maKhachHang: user.khachhang.maKhachHang };
        } catch {
            return { success: false, message: "Token không hợp lệ", status: 401 };
        }
    }

    // fallback dùng session
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) return { success: false, message: "Không xác định được người dùng", status: 401 };

    const user = await prisma.roleadminuser.findUnique({
        where: { email },
        include: {
            khachhang: {
                select: { maKhachHang: true },
            },
        },
    });

    if (!user?.khachhang?.maKhachHang) {
        return { success: false, message: "Không tìm thấy khách hàng", status: 404 };
    }

    return { success: true, maKhachHang: user.khachhang.maKhachHang };
}