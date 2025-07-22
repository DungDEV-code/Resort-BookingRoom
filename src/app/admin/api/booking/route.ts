import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "7");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Create search condition
    const whereCondition = search
      ? {
          OR: [
            { maDatPhong: { contains: search } }, // Remove mode: "insensitive"
            { khachhang: { tenKhachHang: { contains: search } } },
            { phong: { tenPhong: { contains: search } } },
          ],
        }
      : {};

    // Get total bookings count
    const totalBookings = await prisma.datphong.count({
      where: whereCondition,
    });

    // Get paginated bookings list
    const datphongList = await prisma.datphong.findMany({
      where: whereCondition,
      orderBy: {
        thoiGianDat: "desc",
      },
      select: {
        maDatPhong: true,
        check_in: true,
        check_out: true,
        thoiGianDat: true,
        trangThai: true,
        khachhang: {
          select: {
            tenKhachHang: true,
          },
        },
        phong: {
          select: {
            tenPhong: true,
          },
        },
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalBookings / limit);

    return NextResponse.json(
      {
        success: true,
        data: datphongList,
        pagination: {
          currentPage: page,
          totalPages,
          totalBookings,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi lấy danh sách đặt phòng:", error);
    return NextResponse.json({ success: false, message: "Lỗi server" }, { status: 500 });
  }
}