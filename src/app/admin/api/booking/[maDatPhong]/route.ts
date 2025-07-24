import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
                dichvudatphong: true,
            },
        });

        if (!currentBooking) {
            return NextResponse.json({ error: 'Đơn đặt phòng không tồn tại' }, { status: 404 });
        }

        // ✅ Xử lý hủy đơn đặt phòng
        if (trangThai === 'DaHuy') {
            const hoaDon = currentBooking.hoadon;

            if (hoaDon?.trangThaiHD === 'DaThanhToan') {
                const today = new Date();
                if (!currentBooking.check_in) {
                    return NextResponse.json({ error: 'Không có ngày check-in' }, { status: 400 });
                }
                const checkInDate = new Date(currentBooking.check_in);

                // Đặt cả hai mốc thời gian về 0h00 để chỉ so sánh ngày
                today.setHours(0, 0, 0, 0);
                checkInDate.setHours(0, 0, 0, 0);

                const diffTime = checkInDate.getTime() - today.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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
            }
            else {
                // Chưa thanh toán hoặc không có hóa đơn → xóa liên quan
                await prisma.$transaction([
                    prisma.dichvudatphong.deleteMany({
                        where: { maDatPhong },
                    }),
                    prisma.datphong.update({
                        where: { maDatPhong },
                        data: {
                            trangThai: 'DaHuy',
                            lyDoHuy: lyDoHuy || undefined,
                        },
                    }),
                ]);
            }

            return NextResponse.json({ message: 'Cập nhật trạng thái hủy thành công' });
        }

        // ✅ Kiểm tra ngày check-in nếu cập nhật sang 'Check_in'
        if (trangThai === 'Check_in') {
            const today = new Date();
            const checkInDate = currentBooking.check_in;

            if (!checkInDate) {
                return NextResponse.json({ error: 'Không có ngày check-in' }, { status: 400 });
            }

            if (today < new Date(checkInDate)) {
                return NextResponse.json({
                    error: 'Chưa đến ngày check-in. Không thể thực hiện check-in bây giờ.',
                }, { status: 400 });
            }
        }

        // ✅ Cập nhật các trạng thái khác
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
