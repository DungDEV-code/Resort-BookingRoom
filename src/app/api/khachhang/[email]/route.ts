// /api/khachhang/[email]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lấy thông tin khách hàng theo email (maUser)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ email?: string }> }
) {
  try {
    // Await the params Promise to get the actual parameters
    const params = await context.params;
    const rawEmail = params.email;

    // Kiểm tra xem email có tồn tại không
    if (!rawEmail) {
      return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
    }

    // Giải mã email
    const email = decodeURIComponent(rawEmail);

    // Truy vấn cơ sở dữ liệu
    const khachHang = await prisma.khachhang.findFirst({
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
          },
        },
      },
    });

    // Kiểm tra xem khách hàng có tồn tại không
    if (!khachHang) {
      return NextResponse.json(
        { error: "Không tìm thấy khách hàng" },
        { status: 404 }
      );
    }

    // Trả về dữ liệu khách hàng
    return NextResponse.json(khachHang, { status: 200 });
  } catch (error) {
    console.error("GET /api/khachhang/[email] lỗi:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// Cập nhật thông tin khách hàng
export async function PUT(
  req: NextRequest,
  context: { params: { email: string } } | { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await context.params;
    const body = await req.json();

    const { tenKhachHang, ngaySinh, gioiTinh, diaChi, soDienThoai } = body;

    // Kiểm tra thiếu trường
    if (
      !tenKhachHang?.trim() ||
      !ngaySinh ||
      !gioiTinh?.trim() ||
      !diaChi?.trim() ||
      !soDienThoai?.trim()
    ) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc hoặc dữ liệu rỗng" },
        { status: 400 }
      );
    }

    // Kiểm tra ngày sinh hợp lệ
    const parsedDate = new Date(ngaySinh);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Ngày sinh không hợp lệ" },
        { status: 400 }
      );
    }

    // Kiểm tra giới tính hợp lệ
    const validGioiTinh = ["Nam", "Nữ", "Khác"];
    if (!validGioiTinh.includes(gioiTinh)) {
      return NextResponse.json(
        { error: "Giới tính không hợp lệ" },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng số điện thoại (chỉ chứa số, độ dài từ 9-15 ký tự)
    const digitsOnlyRegex = /^[0-9]+$/;

    if (!digitsOnlyRegex.test(soDienThoai)) {
      return NextResponse.json(
        { error: "Số điện thoại chỉ được chứa chữ số" },
        { status: 400 }
      );
    }

    if (soDienThoai.length !== 10) {
      return NextResponse.json(
        { error: "Số điện thoại phải có đúng 10 chữ số" },
        { status: 400 }
      );
    }

    // Kiểm tra khách hàng tồn tại
    const khachHang = await prisma.khachhang.findFirst({
      where: { maUser: email },
    });

    if (!khachHang) {
      return NextResponse.json(
        { error: "Không tìm thấy khách hàng" },
        { status: 404 }
      );
    }

    // Cập nhật thông tin
    await prisma.khachhang.updateMany({
      where: { maUser: email },
      data: {
        tenKhachHang: tenKhachHang.trim(),
        ngaySinh: parsedDate,
        gioiTinh,
        diaChi: diaChi.trim(),
        soDienThoai: soDienThoai.trim(),
      },
    });

    // Trả về dữ liệu cập nhật
    const updated = await prisma.khachhang.findFirst({
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
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Cập nhật thành công", data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/khachhang/:email error:", error);
    return NextResponse.json({ error: "Cập nhật thất bại" }, { status: 500 });
  }
}

