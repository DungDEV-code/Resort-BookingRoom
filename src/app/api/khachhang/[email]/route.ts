import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET method - Lấy thông tin khách hàng
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await context.params; // ✅ PHẢI await
    const decodedEmail = decodeURIComponent(email);

    const khachHang = await prisma.khachhang.findFirst({
      where: { maUser: decodedEmail },
      select: {
        maKhachHang: true,
        maUser: true,
        tenKhachHang: true,
        ngaySinh: true,
        gioiTinh: true,
        diaChi: true,
        soDienThoai: true,
        maMembership: true,
        membership: {
          select: {
            maMembership: true,
            level: true,
            minSpending: true,
            description: true,
          },
        },
      },
    });

    if (!khachHang) {
      return NextResponse.json({ error: 'Không tìm thấy khách hàng' }, { status: 404 });
    }

    return NextResponse.json(khachHang, { status: 200 });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin khách hàng:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


// PUT method - Cập nhật thông tin khách hàng
export async function PUT(req: NextRequest, { params }: { params: { email: string } }) {
  try {
    const email = decodeURIComponent(params.email);
    const body = await req.json();

    // Validate dữ liệu đầu vào
    if (!body.tenKhachHang || !body.ngaySinh || !body.gioiTinh || !body.diaChi || !body.soDienThoai) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    // Kiểm tra khách hàng có tồn tại không
    const existingKhachHang = await prisma.khachhang.findFirst({
      where: { maUser: email },
    });

    if (!existingKhachHang) {
      return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
    }

    // Cập nhật thông tin - sử dụng updateMany vì không có unique constraint trên maUser
    const updated = await prisma.khachhang.updateMany({
      where: { maUser: email },
      data: {
        tenKhachHang: body.tenKhachHang,
        ngaySinh: new Date(body.ngaySinh),
        gioiTinh: body.gioiTinh,
        diaChi: body.diaChi,
        soDienThoai: body.soDienThoai,
      },
    });

    // Lấy dữ liệu đã cập nhật để trả về
    const updatedKhachHang = await prisma.khachhang.findFirst({
      where: { maUser: email },
      select: {
        maKhachHang: true,
        maUser: true,
        tenKhachHang: true,
        ngaySinh: true,
        gioiTinh: true,
        diaChi: true,
        soDienThoai: true,
        maMembership: true,
        membership: {
          select: {
            maMembership: true,
            level: true,
            minSpending: true,
            description: true,
          }
        },
      },
    });

    return NextResponse.json({
      message: "Cập nhật thành công",
      data: updatedKhachHang
    }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/khachhang/:email error:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}