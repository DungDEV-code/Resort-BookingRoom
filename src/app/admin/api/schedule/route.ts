import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";
import { LoaiCongViec, lichlamviec_trangThaiCV, nhanvien_chucVu } from "@/generated/prisma";

// Schema validation cho POST request
const createScheduleSchema = z.object({
  maPhong: z.string().min(1, "Mã phòng là bắt buộc").max(20, "Mã phòng không được vượt quá 20 ký tự"),
  maNhanVien: z.string().min(1, "Mã nhân viên là bắt buộc").max(20, "Mã nhân viên không được vượt quá 20 ký tự"),
  ngayLam: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày làm phải có định dạng YYYY-MM-DD"),
  loaiCongViec: z.enum([LoaiCongViec.DonDep, LoaiCongViec.SuaChua], {
    errorMap: () => ({ message: "Loại công việc phải là 'DonDep' hoặc 'SuaChua'" }),
  }),
});

export async function GET() {
  try {
    const schedules = await prisma.lichlamviec.findMany({
      include: {
        nhanvien: {
          select: {
            maNhanVien: true,
            tenNhanVien: true,
            chucVu: true,
          },
        },
        chitietPhong: {
          select: {
            maPhong: true,
            phong: {
              select: {
                tenPhong: true,
              },
            },
          },
        },
      },
      orderBy: {
        ngayLam: "desc",
      },
    });

    const formatted = schedules.map((s) => ({
      maLichLamViec: s.malichLamViec,
      maPhong: s.chitietPhong[0]?.maPhong || "",
      tenPhong: s.chitietPhong[0]?.phong?.tenPhong || "",
      maNhanVien: s.maNhanVien,
      tenNhanVien: s.nhanvien?.tenNhanVien || "",
      chucVu: s.nhanvien?.chucVu || "",
      ngayLam: s.ngayLam.toISOString().split("T")[0],
      loaiCV: s.loaiCV,
      trangThaiCV: s.trangThaiCV,
    }));

    return NextResponse.json(formatted, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Lỗi khi lấy lịch làm việc:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Dữ liệu POST:", body);

    const parsed = createScheduleSchema.parse(body);
    const ngayLam = new Date(parsed.ngayLam);
    if (isNaN(ngayLam.getTime())) {
      return NextResponse.json({ error: "Ngày làm không hợp lệ" }, { status: 400 });
    }

    // Kiểm tra phòng tồn tại
    const phong = await prisma.phong.findUnique({
      where: { maPhong: parsed.maPhong },
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

    // Kiểm tra lịch làm việc trùng phòng + ngày
    const trungLich = await prisma.chitiet_lichlamviec.findFirst({
      where: {
        maPhong: parsed.maPhong,
        lichlamviec: {
          ngayLam: { equals: ngayLam },
        },
      },
    });
    if (trungLich) {
      return NextResponse.json({ error: "Đã có lịch làm việc trong ngày này cho phòng này" }, { status: 409 });
    }

    // Tạo mã lịch làm việc và chi tiết lịch làm việc
    const maLichLamViec = randomUUID().slice(0, 20);
    const maChiTiet = randomUUID().slice(0, 20);

    // Tạo lịch làm việc và chi tiết lịch làm việc trong một giao dịch
    const lichLam = await prisma.$transaction([
      prisma.lichlamviec.create({
        data: {
          malichLamViec: maLichLamViec,
          maNhanVien: parsed.maNhanVien,
          ngayLam: ngayLam,
          loaiCV: parsed.loaiCongViec,
          trangThaiCV: lichlamviec_trangThaiCV.ChuaHoanThanh,
        },
      }),
      prisma.chitiet_lichlamviec.create({
        data: {
          id: maChiTiet,
          malichLamViec: maLichLamViec,
          maPhong: parsed.maPhong,
        },
        select: {
          id: true,
          maPhong: true,
          malichLamViec: true,
          phong: {
            select: {
              tenPhong: true,
            },
          },
        },
      }),
    ]);

    const response = {
      maLichLamViec: lichLam[0].malichLamViec,
      maPhong: lichLam[1].maPhong,
      tenPhong: lichLam[1].phong?.tenPhong || "",
      maNhanVien: lichLam[0].maNhanVien,
      tenNhanVien: nhanvien.tenNhanVien,
      chucVu: nhanvien.chucVu,
      ngayLam: lichLam[0].ngayLam.toISOString().split("T")[0],
      loaiCV: lichLam[0].loaiCV,
      trangThaiCV: lichLam[0].trangThaiCV,
    };

    console.log("Bản ghi vừa tạo:", response);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Lỗi tạo lịch làm việc:", error);
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
    const deleted = await prisma.$transaction([
      prisma.chitiet_lichlamviec.deleteMany({
        where: { malichLamViec: maLichLamViec },
      }),
      prisma.lichlamviec.delete({
        where: { malichLamViec: maLichLamViec },
        select: {
          malichLamViec: true,
        },
      }),
    ]);

    return NextResponse.json(deleted[1], { status: 200 });
  } catch (error) {
    console.error("Lỗi xóa lịch làm việc:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}