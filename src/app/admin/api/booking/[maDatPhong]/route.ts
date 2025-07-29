import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

async function updateMembershipForCustomer(maKhachHang: string) {
    const tongTien = await prisma.hoadon.aggregate({
        where: {
            datphong: {
                maKhachHang,
            },
            trangThaiHD: 'DaThanhToan',
        },
        _sum: {
            tongTien: true,
        },
    });

    const tongChiTieuDecimal = tongTien._sum.tongTien instanceof Decimal
        ? tongTien._sum.tongTien
        : new Decimal(tongTien._sum.tongTien || 0);

    const memberships = await prisma.membership.findMany({
        orderBy: { minSpending: 'desc' },
    });

    const khachhang = await prisma.khachhang.findUnique({
        where: { maKhachHang },
    });

    if (!khachhang) return;

    const membershipPhuHop = memberships.find(m =>
        tongChiTieuDecimal.gte(m.minSpending)
    );

    if (membershipPhuHop) {
        await prisma.khachhang.update({
            where: { maKhachHang },
            data: {
                maMembership: membershipPhuHop.maMembership,
            },
        });
    }
}

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ maDatPhong: string }> }
) {
    const { maDatPhong } = await context.params;

    if (!maDatPhong) {
        return NextResponse.json({ error: 'Thiếu bookingId' }, { status: 400 });
    }

    const body = await request.json();
    const { trangThai, lyDoHuy } = body;

    try {
        const currentBooking = await prisma.datphong.findUnique({
            where: { maDatPhong },
            include: {
                hoadon: true,
                khachhang: true,
            },
        });

        if (!currentBooking) {
            return NextResponse.json({ error: 'Đơn đặt phòng không tồn tại' }, { status: 404 });
        }

        // ✅ Hủy đơn
        if (trangThai === 'DaHuy') {
            const hoaDon = currentBooking.hoadon;

            if (hoaDon?.trangThaiHD === 'DaThanhToan') {
                const today = new Date();
                const checkInDate = currentBooking.check_in;

                if (!checkInDate) {
                    return NextResponse.json({ error: 'Không có ngày check-in' }, { status: 400 });
                }

                today.setHours(0, 0, 0, 0);
                const checkDate = new Date(checkInDate);
                checkDate.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const trangThaiHD = diffDays <= 1 ? 'KhongHoanTien' : 'DaHoanTien';

                await prisma.$transaction([
                    prisma.datphong.update({
                        where: { maDatPhong },
                        data: { trangThai: 'DaHuy', lyDoHuy },
                    }),
                    prisma.hoadon.update({
                        where: { maHD: hoaDon.maHD },
                        data: { trangThaiHD },
                    }),
                ]);
            } else {
                await prisma.$transaction([
                    prisma.dichvudatphong.deleteMany({ where: { maDatPhong } }),
                    prisma.datphong.update({
                        where: { maDatPhong },
                        data: { trangThai: 'DaHuy', lyDoHuy: lyDoHuy || undefined },
                    }),
                ]);
            }

            return NextResponse.json({ message: 'Cập nhật trạng thái hủy thành công' });
        }

        // ✅ Check-in
        if (trangThai === 'Check_in') {
            const today = new Date();
            const checkInDate = currentBooking.check_in;

            if (!checkInDate) {
                return NextResponse.json({ error: 'Không có ngày check-in' }, { status: 400 });
            }

            // Kiểm tra xem có phải ngày check-in và đã từ 8h sáng trở đi
            const checkInDateStart = new Date(checkInDate);
            checkInDateStart.setHours(8, 0, 0, 0); // Đặt giờ bắt đầu check-in là 8h sáng

            if (today < checkInDateStart) {
                return NextResponse.json({
                    error: 'Chưa đến thời gian check-in. Check-in chỉ được phép từ 8h sáng ngày check-in.',
                }, { status: 400 });
            }

            if (!currentBooking.hoadon || currentBooking.hoadon.trangThaiHD !== 'DaThanhToan') {
                return NextResponse.json({
                    error: 'Vui lòng thanh toán trước khi check-in.',
                }, { status: 400 });
            }
        }

        // ✅ Check-out và cập nhật hạng thành viên tự động (có thể tăng hoặc giảm)
        if (trangThai === 'Check_out') {
            await prisma.datphong.update({
                where: { maDatPhong },
                data: {
                    trangThai: 'Check_out',
                    check_out: new Date(),
                },
            });

            // Gọi hàm cập nhật membership
            await updateMembershipForCustomer(currentBooking.maKhachHang);

            return NextResponse.json({ message: 'Check-out thành công và cập nhật hạng thành viên nếu cần.' });
        }

        // ✅ Trạng thái khác
        await prisma.datphong.update({
            where: { maDatPhong },
            data: { trangThai },
        });

        return NextResponse.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error: any) {
        console.error("Lỗi cập nhật trạng thái:", error);
        return NextResponse.json({ message: error.message || "Lỗi không xác định" }, { status: 500 });
    }
}