import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dichvudatphong_trangThaiDV } from '@/generated/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const whereConditions = search
      ? {
          OR: [
            {
              ma: {
                // Chuyển đổi thành chữ thường trong truy vấn
                contains: search,
              },
            },
            {
              datphong: {
                khachhang: {
                  tenKhachHang: {
                    contains: search,
                  },
                },
              },
            },
          ],
        }
      : {};

    const raw = await prisma.dichvudatphong.findMany({
      where: whereConditions,
      include: {
        dichvu: {
          select: { tenDV: true },
        },
        datphong: {
          include: {
            khachhang: {
              select: { tenKhachHang: true },
            },
          },
        },
      },
      orderBy: {
        ma: 'asc',
      },
    });

    const formatted = raw.map((item) => ({
      ma: item.ma || 'Không rõ',
      maDatPhong: item.maDatPhong || 'Không rõ',
      tenDV: item.dichvu?.tenDV || 'Không rõ',
      soLuong: item.soLuong || 0,
      donGiaLucDat: item.donGiaLucDat || 0,
      thanhTien: item.ThanhTien || 0,
      tenKhachHang: item.datphong?.khachhang?.tenKhachHang || 'Không rõ',
      dichvudatphong_trangThaiDV: item.trangThaiDV || 'Không xác định',
    }));

    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách dịch vụ đặt phòng:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách dịch vụ đặt phòng' },
      { status: 500 }
    );
  }
}
