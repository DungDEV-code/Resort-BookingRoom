import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "room-stats") {
        const totalRooms = await prisma.phong.count();
        const availableRooms = await prisma.phong.count({
            where: { tinhTrang: "Trong" },
        });
        return NextResponse.json({ totalRooms, availableRooms });
    }
    if (type === "total-revenue") {
        const totalRevenue = await prisma.hoadon.aggregate({
            _sum: { tongTien: true },
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthlyRevenue = await prisma.hoadon.aggregate({
            _sum: { tongTien: true },
            where: {
                ngayTaoHD: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        return NextResponse.json({
            totalRevenue: totalRevenue._sum.tongTien || 0,
            monthlyRevenue: monthlyRevenue._sum.tongTien || 0,
        });
    }

    if (type === "customer-count") {
        // 1. Tổng số khách hàng đã từng đặt phòng (unique maKhachHang)
        const distinctCustomers = await prisma.datphong.findMany({
            select: { maKhachHang: true },
            distinct: ["maKhachHang"],
        });
        const customerCount = distinctCustomers.length;

        // 2. Khách hàng đặt phòng nhiều nhất (theo số lần đặt phòng)
        const topCustomer = await prisma.datphong.groupBy({
            by: ["maKhachHang"],
            _count: { maKhachHang: true },
            orderBy: { _count: { maKhachHang: "desc" } },
            take: 1,
        });

        let mostBookedCustomer = null;
        if (topCustomer.length > 0) {
            const khach = await prisma.khachhang.findUnique({
                where: { maKhachHang: topCustomer[0].maKhachHang },
            });

            mostBookedCustomer = {
                maKH: khach?.maKhachHang,
                tenKH: khach?.tenKhachHang,
                soLanDat: topCustomer[0]._count.maKhachHang,
            };
        }

        // 3. Khách hàng chi tiêu nhiều nhất
        // Lấy tổng tiền từng hóa đơn theo mã đặt phòng
        const hoadons = await prisma.hoadon.groupBy({
            by: ["maDatPhong"],
            _sum: { tongTien: true },
        });

        // Lấy mã khách hàng từ bảng đặt phòng tương ứng
        const datphongs = await prisma.datphong.findMany({
            where: {
                maDatPhong: {
                    in: hoadons.map((hd) => hd.maDatPhong),
                },
            },
            select: {
                maDatPhong: true,
                maKhachHang: true,
            },
        });

        // Tính tổng chi tiêu theo từng khách hàng
        const spendingMap = new Map<string, number>();
        hoadons.forEach((hd) => {
            const dp = datphongs.find((dp) => dp.maDatPhong === hd.maDatPhong);
            if (!dp) return;
            const maKH = dp.maKhachHang;
            const tong = Number(hd._sum.tongTien ?? 0);
            spendingMap.set(maKH, (spendingMap.get(maKH) || 0) + tong);
        });

        // Sắp xếp theo chi tiêu giảm dần, lấy khách chi tiêu nhiều nhất
        const sorted = [...spendingMap.entries()].sort((a, b) => b[1] - a[1]);
        const [maKhachHangTop, tongChiTieu] = sorted[0] || [null, 0];

        let biggestSpender = null;
        if (maKhachHangTop) {
            const khach = await prisma.khachhang.findUnique({
                where: { maKhachHang: maKhachHangTop },
            });

            biggestSpender = {
                maKH: khach?.maKhachHang,
                tenKH: khach?.tenKhachHang,
                tongChiTieu,
            };
        }

        return NextResponse.json({
            customerCount,
            mostBookedCustomer,
            biggestSpender,
        });
    }
    if (type === "top-service") {
        const topService = await prisma.dichvudatphong.groupBy({
            by: ["maDichVu"],
            _count: { maDichVu: true },
            orderBy: { _count: { maDichVu: "desc" } },
            take: 1,
        });

        if (topService.length === 0) {
            return NextResponse.json({ topService: null });
        }

        const maDichVu = topService[0].maDichVu;

        const dichVu = await prisma.dichvu.findUnique({
            where: { maDV: maDichVu },
        });

        // Tính tổng số lượng sử dụng dịch vụ đó
        const usage = await prisma.dichvudatphong.aggregate({
            where: { maDichVu },
            _sum: { soLuong: true },
        });

        const soLuong = usage._sum.soLuong || 0;
        const donGia = dichVu?.giaDV?.toNumber() || 0;
        const doanhThu = donGia * soLuong;

        return NextResponse.json({
            topService: {
                maDichVu: dichVu?.maDV,
                tenDichVu: dichVu?.tenDV,
                soLanSuDung: topService[0]._count.maDichVu,
                tongSoLuong: soLuong,
                donGia: donGia,
                doanhThu: doanhThu,
            },
        });
    }

    if (type === "booking-stats") {
        const totalBookings = await prisma.datphong.count();
        const pendingBookings = await prisma.datphong.count({
            where: { trangThai: "ChoXacNhan" },
        });
        const checkedInBookings = await prisma.datphong.count({
            where: { trangThai: "Check_in" },
        });
        const cancelledBookings = await prisma.datphong.count({
            where: { trangThai: "DaHuy" },
        });

        return NextResponse.json({
            totalBookings,
            pendingBookings,
            checkedInBookings,
            cancelledBookings,
        });
    }

    return NextResponse.json({ error: "Tham số 'type' không hợp lệ" }, { status: 400 });
}
