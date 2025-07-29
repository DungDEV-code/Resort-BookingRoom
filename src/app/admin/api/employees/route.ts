import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nhanvien_chucVu, nhanvien_trangThaiLamViec } from "@/generated/prisma";


export async function GET() {
    try {
        const employees = await prisma.nhanvien.findMany({
            orderBy: {
                maNhanVien: "asc",
            },
            include: {
                roleadminuser: {
                    select: {
                        email: true,
                        userName: true,
                        trangThaiTk: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json(employees, {
            headers: {
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nhân viên:", error);
        return NextResponse.json(
            { error: "Không thể lấy danh sách nhân viên" },
            { status: 500 }
        );
    }
}

function generateRandomMaNhanVien(prefix = "NV") {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${random}${timestamp}`;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            maUser,
            tenNhanVien,
            soDienThoai,
            ngayVaoLam,
            chucVu, // Sửa từ viTri thành chucVu để khớp với schema
            trangThaiLamViec,
        } = body;

        // Validation input
        if (!maUser || !tenNhanVien || !soDienThoai || !ngayVaoLam || !chucVu) {
            return NextResponse.json(
                { error: "Vui lòng cung cấp đầy đủ thông tin: maUser, tenNhanVien, soDienThoai, ngayVaoLam, chucVu" },
                { status: 400 }
            );
        }

        // Validate phone number format (VD: 10-11 số)
        const phoneRegex = /^\d{10,11}$/;
        if (!phoneRegex.test(soDienThoai)) {
            return NextResponse.json(
                { error: "Số điện thoại không hợp lệ" },
                { status: 400 }
            );
        }

        // Validate chucVu
        const validChucVu = Object.values(nhanvien_chucVu);
        if (!validChucVu.includes(chucVu)) {
            return NextResponse.json(
                { error: `Chức vụ không hợp lệ. Chức vụ phải là một trong: ${validChucVu.join(", ")}` },
                { status: 400 }
            );
        }

        // Validate trangThaiLamViec if provided
        if (trangThaiLamViec) {
            const validTrangThai = Object.values(nhanvien_trangThaiLamViec);
            if (!validTrangThai.includes(trangThaiLamViec)) {
                return NextResponse.json(
                    { error: `Trạng thái làm việc không hợp lệ. Trạng thái phải là một trong: ${validTrangThai.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        // Kiểm tra maUser đã tồn tại trong bảng nhanvien
        const existedNhanVien = await prisma.nhanvien.findUnique({
            where: { maUser },
        });

        if (existedNhanVien) {
            return NextResponse.json(
                { error: "Email này đã được sử dụng cho nhân viên khác." },
                { status: 400 }
            );
        }

        // Kiểm tra maUser có tồn tại trong bảng roleadminuser
        const userExists = await prisma.roleadminuser.findUnique({
            where: { email: maUser },
        });

        if (!userExists) {
            return NextResponse.json(
                { error: "Email chưa được đăng ký trong hệ thống." },
                { status: 400 }
            );
        }

        const maNhanVien = generateRandomMaNhanVien();

        const nhanVien = await prisma.nhanvien.create({
            data: {
                maNhanVien,
                maUser,
                tenNhanVien,
                soDienThoai,
                ngayVaoLam: new Date(ngayVaoLam),
                chucVu,
                trangThaiLamViec: trangThaiLamViec || nhanvien_trangThaiLamViec.DangLam,
            },
            include: {
                roleadminuser: {
                    select: {
                        email: true,
                        userName: true,
                        trangThaiTk: true,
                        role: true
                    }
                }
            }
        });

        return NextResponse.json(nhanVien);
    } catch (error) {
        console.error("Lỗi khi tạo nhân viên:", error);
        return NextResponse.json(
            { error: "Không thể tạo nhân viên. Vui lòng thử lại sau." },
            { status: 500 }
        );
    }
}