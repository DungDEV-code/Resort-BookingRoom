import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { LoaiCongViec, lichlamviec_trangThaiCV, nhanvien_chucVu } from "@/generated/prisma";
import { startOfDay } from "date-fns";

// Schema validation cho PUT request
const updateScheduleSchema = z.object({
  maPhong: z.string().min(1, "Mã phòng là bắt buộc").max(20, "Mã phòng không được vượt quá 20 ký tự"),
  maNhanVien: z.string().min(1, "Mã nhân viên là bắt buộc").max(20, "Mã nhân viên không được vượt quá 20 ký tự"),
  ngayLam: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày làm phải có định dạng YYYY-MM-DD"),
  loaiCongViec: z.enum([LoaiCongViec.DonDep, LoaiCongViec.SuaChua], {
    errorMap: () => ({ message: "Loại công việc phải là 'DonDep' hoặc 'SuaChua'" }),
  }),
  trangThaiCV: z
    .enum([lichlamviec_trangThaiCV.ChuaHoanThanh, lichlamviec_trangThaiCV.DaHoanThanh])
    .optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const maLichLamViec = pathname.split("/").pop();
    if (!maLichLamViec) {
      return NextResponse.json({ error: "Mã lịch làm việc không hợp lệ" }, { status: 400 });
    }

    const body = await req.json();
    console.log("Dữ liệu PUT:", body);

    const parsed = updateScheduleSchema.parse(body);
    const ngayLam = new Date(parsed.ngayLam);
    if (isNaN(ngayLam.getTime())) {
      return NextResponse.json({ error: "Ngày làm không hợp lệ" }, { status: 400 });
    }

    // Kiểm tra ngày làm không được là quá khứ
    const today = startOfDay(new Date(2025, 6, 29)); // 29/7/2025
    const existingSchedule = await prisma.lichlamviec.findUnique({
      where: { malichLamViec: maLichLamViec },
    });
    if (!existingSchedule) {
      return NextResponse.json({ error: "Lịch làm việc không tồn tại" }, { status: 404 });
    }
    const originalDate = startOfDay(new Date(existingSchedule.ngayLam));
    if (ngayLam < today && ngayLam.getTime() !== originalDate.getTime()) {
      return NextResponse.json(
        { error: "Ngày làm việc phải là hôm nay hoặc trong tương lai" },
        { status: 400 }
      );
    }

    // Kiểm tra phòng tồn tại
    const phong = await prisma.phong.findUnique({
      where: { maPhong: parsed.maPhong },
      select: { maPhong: true, tenPhong: true },
    });
    if (!phong) {
      return NextResponse.json({ error: "Phòng không tồn tại" }, { status: 404 });
    }

    // Kiểm tra nhân viên tồn tại và chức vụ
    const nhanvien = await prisma.nhanvien.findUnique({
      where: { maNhanVien: parsed.maNhanVien },
      select: { maNhanVien: true, tenNhanVien: true, chucVu: true },
    });
    if (!nhanvien) {
      return NextResponse.json({ error: "Nhân viên không tồn tại" }, { status: 404 });
    }

    // Kiểm tra chức vụ phù hợp với loại công việc
    if (
      (parsed.loaiCongViec === LoaiCongViec.DonDep && nhanvien.chucVu !== nhanvien_chucVu.DonDep) ||
      (parsed.loaiCongViec === LoaiCongViec.SuaChua && nhanvien.chucVu !== nhanvien_chucVu.SuaChua)
    ) {
      return NextResponse.json(
        { error: `Nhân viên với chức vụ ${nhanvien.chucVu} không thể thực hiện công việc ${parsed.loaiCongViec}` },
        { status: 400 }
      );
    }

    // Kiểm tra phòng có bị đặt trong ngày đó không
    const trungBooking = await prisma.datphong.findFirst({
      where: {
        maPhong: parsed.maPhong,
        check_in: { lte: ngayLam },
        check_out: { gte: ngayLam },
        trangThai: { not: "DaHuy" },
      },
    });
    if (trungBooking) {
      return NextResponse.json({ error: "Phòng đang được đặt trong thời gian này" }, { status: 409 });
    }

    // Kiểm tra lịch làm việc trùng phòng + ngày (ngoại trừ lịch hiện tại)
    const trungLich = await prisma.chitiet_lichlamviec.findFirst({
      where: {
        maPhong: parsed.maPhong,
        malichLamViec: { not: maLichLamViec },
        lichlamviec: {
          ngayLam: { equals: ngayLam },
        },
      },
    });
    if (trungLich) {
      return NextResponse.json({ error: "Đã có lịch làm việc trong ngày này cho phòng này" }, { status: 409 });
    }

    // Kiểm tra lịch làm việc trùng nhân viên + ngày (ngoại trừ lịch hiện tại)
    const trungNhanVien = await prisma.lichlamviec.findFirst({
      where: {
        maNhanVien: parsed.maNhanVien,
        ngayLam: { equals: ngayLam },
        malichLamViec: { not: maLichLamViec },
      },
    });
    if (trungNhanVien) {
      return NextResponse.json({ error: "Nhân viên đã có lịch làm việc trong ngày này" }, { status: 409 });
    }

    // Cập nhật lịch làm việc và chi tiết lịch làm việc trong một giao dịch
    const updated = await prisma.$transaction([
      prisma.lichlamviec.update({
        where: { malichLamViec: maLichLamViec },
        data: {
          maNhanVien: parsed.maNhanVien,
          ngayLam: ngayLam,
          loaiCV: parsed.loaiCongViec,
          trangThaiCV: parsed.trangThaiCV || lichlamviec_trangThaiCV.ChuaHoanThanh,
        },
      }),
      prisma.chitiet_lichlamviec.updateMany({
        where: { malichLamViec: maLichLamViec },
        data: { maPhong: parsed.maPhong },
      }),
    ]);

    const response = {
      maLichLamViec: updated[0].malichLamViec,
      maPhong: parsed.maPhong,
      tenPhong: phong.tenPhong,
      maNhanVien: updated[0].maNhanVien,
      tenNhanVien: nhanvien.tenNhanVien,
      chucVu: nhanvien.chucVu,
      ngayLam: updated[0].ngayLam.toISOString().split("T")[0],
      loaiCV: updated[0].loaiCV,
      trangThaiCV: updated[0].trangThaiCV,
    };

    console.log("Bản ghi vừa cập nhật:", response);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Lỗi cập nhật lịch làm việc:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Lỗi máy chủ", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { pathname } = new URL(req.url);
    const maLichLamViec = pathname.split("/").pop();
    if (!maLichLamViec) {
      return NextResponse.json({ error: "Mã lịch làm việc không hợp lệ" }, { status: 400 });
    }

    // Xóa lịch làm việc và chi tiết lịch làm việc trong một giao dịch
    await prisma.$transaction([
      prisma.chitiet_lichlamviec.deleteMany({
        where: { malichLamViec: maLichLamViec },
      }),
      prisma.lichlamviec.delete({
        where: { malichLamViec: maLichLamViec },
      }),
    ]);

    return NextResponse.json({ message: "Xóa lịch làm việc thành công" }, { status: 200 });
  } catch (error) {
    console.error("Lỗi xóa lịch làm việc:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}