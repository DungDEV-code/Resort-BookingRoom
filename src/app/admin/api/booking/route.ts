import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "7")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * limit

    // Tạo điều kiện tìm kiếm
    const whereCondition = search
      ? {
          OR: [
            { maDatPhong: { contains: search, mode: "insensitive" as const } },
            { khachhang: { tenKhachHang: { contains: search, mode: "insensitive" as const } } },
            { phong: { tenPhong: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}

    // Lấy tổng số bản ghi
    const totalBookings = await prisma.datphong.count({
      where: whereCondition,
    })

    // Lấy danh sách đặt phòng với phân trang
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
        trangThai: true, // Thêm trường trạng thái nếu có
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
    })

    const totalPages = Math.ceil(totalBookings / limit)

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
      { status: 200 },
    )
  } catch (error) {
    console.error("Lỗi lấy danh sách đặt phòng:", error)
    return NextResponse.json({ success: false, message: "Lỗi server" }, { status: 500 })
  }
}
