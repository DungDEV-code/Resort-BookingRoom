import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const customers = await prisma.khachhang.findMany({
      include: {
        membership: true, // Include membership information
      },
      orderBy: {
        maKhachHang: "asc",
      },
    })

    // Map kết quả để frontend dễ dùng
    const formattedCustomers = customers.map((customer) => ({
      maKhachHang: customer.maKhachHang,
      maUser: customer.maUser,
      tenKhachHang: customer.tenKhachHang,
      ngaySinh: customer.ngaySinh,
      gioiTinh: customer.gioiTinh,
      diaChi: customer.diaChi,
      soDienThoai: customer.soDienThoai,
      maMembership: customer.maMembership,
      membershipLevel: customer.membership?.level || null,
      membershipDescription: customer.membership?.description || null,
      minSpending: customer.membership?.minSpending || null,
    }))

    return NextResponse.json(formattedCustomers, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("❌ Lỗi khi lấy danh sách khách hàng:", error)
    return NextResponse.json({ error: "Lỗi khi lấy danh sách khách hàng", message: error.message }, { status: 500 })
  }
}


