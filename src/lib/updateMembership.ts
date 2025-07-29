import { Decimal } from "@/generated/prisma/runtime/library";
import { prisma } from "@/lib/prisma";

// Hàm cập nhật tất cả khách hàng
export async function updateAllCustomersMembership() {
    const khachHangs = await prisma.khachhang.findMany({
        select: { maKhachHang: true }
    });

    for (const kh of khachHangs) {
        await updateMembershipForCustomer(kh.maKhachHang);
    }
}

// Hàm cập nhật hạng cho một khách hàng
export async function updateMembershipForCustomer(maKhachHang: string) {
    // Tính tổng chi tiêu từ hóa đơn của các đơn đã checkout và thanh toán
    const tongTien = await prisma.hoadon.aggregate({
        where: {
            datphong: {
                maKhachHang,
                trangThai: 'Check_out',
            },
            trangThaiHD: 'DaThanhToan',
        },
        _sum: {
            tongTien: true,
        },
    });

    // Convert sang Decimal (chắc chắn)
    const tongChiTieuDecimal = tongTien._sum.tongTien
        ? new Decimal(tongTien._sum.tongTien)
        : new Decimal(0);

    // Lấy danh sách membership giảm dần theo minSpending
    const memberships = await prisma.membership.findMany({
        orderBy: { minSpending: 'desc' },
    });

    const khachhang = await prisma.khachhang.findUnique({
        where: { maKhachHang },
        select: { maMembership: true }
    });

    if (!khachhang) return;

    const membershipPhuHop = memberships.find(m =>
        tongChiTieuDecimal.gte(m.minSpending)
    );

    // Chỉ cập nhật nếu có thay đổi membership
    if (
        membershipPhuHop &&
        khachhang.maMembership !== membershipPhuHop.maMembership
    ) {
        await prisma.khachhang.update({
            where: { maKhachHang },
            data: {
                maMembership: membershipPhuHop.maMembership,
            },
        });
    }
}
