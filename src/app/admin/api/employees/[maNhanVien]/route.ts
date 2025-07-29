import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nhanvien_chucVu, nhanvien_trangThaiLamViec } from "@/generated/prisma";

export async function PUT(req: Request, { params }: { params: { maNhanVien: string } }) {
  try {
    const body = await req.json();
    const {
      tenNhanVien,
      soDienThoai,
      ngayVaoLam,
      chucVu, // Sửa từ viTri thành chucVu để khớp với schema
      trangThaiLamViec,
    } = body;

    // Validation input
    if (!tenNhanVien || !soDienThoai || !ngayVaoLam || !chucVu) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ thông tin: tenNhanVien, soDienThoai, ngayVaoLam, chucVu" },
        { status: 400 }
      );
    }

    // Validate phone number format (VD: 10-11 số)
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(soDienThoai)) {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ" },
        { status: 400 }
      );
    }

    // Validate chucVu
    const validChucVu = Object.values(nhanvien_chucVu);
    if (!validChucVu.includes(chucVu)) {
      return NextResponse.json(
        { error: `Chức vụ không hợp lệ. Chức vụ phải là một trong: ${validChucVu.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate trangThaiLamViec if provided
    if (trangThaiLamViec) {
      const validTrangThai = Object.values(nhanvien_trangThaiLamViec);
      if (!validTrangThai.includes(trangThaiLamViec)) {
        return NextResponse.json(
          { error: `Trạng thái làm việc không hợp lệ. Trạng thái phải là một trong: ${validTrangThai.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Kiểm tra nhân viên có tồn tại không
    const existingNhanVien = await prisma.nhanvien.findUnique({
      where: { maNhanVien: params.maNhanVien },
    });

    if (!existingNhanVien) {
      return NextResponse.json(
        { error: "Nhân viên không tồn tại" },
        { status: 404 }
      );
    }

    const updated = await prisma.nhanvien.update({
      where: { maNhanVien: params.maNhanVien },
      data: {
        tenNhanVien,
        soDienThoai,
        ngayVaoLam: new Date(ngayVaoLam),
        chucVu,
        trangThaiLamViec: trangThaiLamViec || existingNhanVien.trangThaiLamViec,
      },
      include: {
        roleadminuser: {
          select: {
            email: true,
            userName: true,
            trangThaiTk: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Lỗi khi cập nhật nhân viên:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật nhân viên. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}