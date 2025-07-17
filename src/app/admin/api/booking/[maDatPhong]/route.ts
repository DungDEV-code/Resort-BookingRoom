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
                // Đã thanh toán → cập nhật hoàn tiền
                await prisma.$transaction([
                    prisma.datphong.update({
                        where: { maDatPhong },
                        data: { trangThai: 'DaHuy', lyDoHuy },
                    }),
                    prisma.hoadon.update({
                        where: { maHD: hoaDon.maHD },
                        data: { trangThaiHD: 'DaHoanTien' },
                    }),
                ]);
            } else {
                // Chưa thanh toán hoặc không có hóa đơn → xóa liên quan
                await prisma.$transaction([
                    prisma.dichvudatphong.deleteMany({
                        where: { maDatPhong },
                    }),
                    prisma.hoadon.deleteMany({
                        where: { maDatPhong },
                    }),
                    prisma.datphong.update({
                        where: { maDatPhong },
                        data: { trangThai: 'DaHuy', lyDoHuy },
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
