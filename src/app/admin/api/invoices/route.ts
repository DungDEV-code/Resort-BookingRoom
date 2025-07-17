import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Lấy tham số query page, limit và search từ URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10); // Mặc định trang 1
    const limit = parseInt(url.searchParams.get("limit") || "7", 10); // Mặc định giới hạn là 7
    const search = url.searchParams.get("search") || ""; // Lấy tham số tìm kiếm

    // Tính toán offset
    const offset = (page - 1) * limit;

    // Điều kiện tìm kiếm
    const where = search
      ? {
          OR: [
            { maHD: { contains: search } },
            { maDatPhong: { contains: search } },
          ],
        }
      : {};

    // Truy vấn hóa đơn với phân trang và tìm kiếm
    const invoices = await prisma.hoadon.findMany({
      select: {
        maHD: true,
        phuongThucThanhToan: true,
        trangThaiHD: true,
        tongTien: true,
        ngayTaoHD: true,
        maDatPhong: true,
      },
      where,
      skip: offset,
      take: limit,
      orderBy: {
        ngayTaoHD: "desc",
      },
    });

    // Lấy tổng số hóa đơn phù hợp với điều kiện tìm kiếm
    const totalInvoices = await prisma.hoadon.count({ where });

    // Tính toán tổng số trang
    const totalPages = Math.ceil(totalInvoices / limit);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalInvoices,
        limit,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy hóa đơn:", error);
    return NextResponse.json(
      { success: false, message: "Không thể lấy danh sách hóa đơn" },
      { status: 500 }
    );
  }
}