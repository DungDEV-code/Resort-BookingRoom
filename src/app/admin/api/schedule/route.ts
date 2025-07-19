import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

// Schema validation cho POST request
const createScheduleSchema = z.object({
  maPhong: z.string().min(1, "Mã phòng là bắt buộc").max(20, "Mã phòng không được vượt quá 20 ký tự"),
  maNhanVien: z.string().min(1, "Mã nhân viên là bắt buộc").max(20, "Mã nhân viên không được vượt quá 20 ký tự"),
  ngayLam: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày làm phải có định dạng YYYY-MM-DD"),
  loaiCongViec: z.enum(["DonDep", "SuaChua"], {
    errorMap: () => ({ message: "Loại công việc phải là 'DonDep' hoặc 'SuaChua'" }),
  }),
});

export async function GET() {
  try {
    const schedules = await prisma.lichlamviec.findMany({
      select: {
        malichLamViec: true,
        maPhong: true,
        maNhanVien: true,
        ngayLam: true,
        loaiCV: true,
        trangThaiCV: true,
        nhanvien: {
          select: {
            tenNhanVien: true,
          },
        },
        phong: {
          select: {
            tenPhong: true,
          },
        },
      },
      orderBy: {
        ngayLam: "desc",
      },
    });

    const formatted = schedules.map((s) => ({
      maLichLamViec: s.malichLamViec,
      maPhong: s.maPhong,
      tenPhong: s.phong?.tenPhong || "",
      maNhanVien: s.maNhanVien,
      tenNhanVien: s.nhanvien?.tenNhanVien || "",
      ngayLam: s.ngayLam.toISOString().split("T")[0], // Chỉ lấy YYYY-MM-DD
      loaiCV: s.loaiCV,
      trangThaiCV: s.trangThaiCV,
    }));

    return NextResponse.json(formatted, { status: 200 });
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
    const ngayLam = new Date(parsed.ngayLam); // Chuyển chuỗi YYYY-MM-DD thành Date
    if (isNaN(ngayLam.getTime())) {
      return NextResponse.json({ error: "Ngày làm không hợp lệ" }, { status: 400 });
    }

    // Kiểm tra phòng tồn tại
    const phong = await prisma.phong.findUnique({
      where: { maPhong: parsed.maPhong },
    });
    if (!phong) {
      return NextResponse.json({ error: "Phòng không tồn tại" }, { status: 400 });
    }

    // Kiểm tra nhân viên tồn tại
    const nhanvien = await prisma.nhanvien.findUnique({
      where: { maNhanVien: parsed.maNhanVien },
    });
    if (!nhanvien) {
      return NextResponse.json({ error: "Nhân viên không tồn tại" }, { status: 400 });
    }

    // Kiểm tra phòng có bị đặt trong ngày đó không
    const trungBooking = await prisma.datphong.findFirst({
      where: {
        maPhong: parsed.maPhong,
        check_in: { lte: ngayLam },
        check_out: { gte: ngayLam },
      },
    });
    if (trungBooking) {
      return NextResponse.json({ error: "Phòng đang được đặt trong thời gian này" }, { status: 409 });
    }

    // Kiểm tra lịch làm việc trùng phòng + ngày
    const trungLich = await prisma.lichlamviec.findFirst({
      where: {
        maPhong: parsed.maPhong,
        ngayLam: { equals: ngayLam },
      },
    });
    if (trungLich) {
      return NextResponse.json({ error: "Đã có lịch làm việc trong ngày này cho phòng này" }, { status: 409 });
    }

    // Tạo mã lịch làm việc
    const maLichLamViec = randomUUID().slice(0, 20);

    // Tạo lịch làm việc
    const lichLam = await prisma.lichlamviec.create({
      data: {
        malichLamViec: maLichLamViec,
        maPhong: parsed.maPhong,
        maNhanVien: parsed.maNhanVien,
        ngayLam: ngayLam, // Sử dụng đối tượng Date
        loaiCV: parsed.loaiCongViec,
        trangThaiCV: "ChuaHoanThanh",
      },
      select: {
        malichLamViec: true,
        maPhong: true,
        maNhanVien: true,
        ngayLam: true,
        loaiCV: true,
        trangThaiCV: true,
      },
    });

    console.log("Bản ghi vừa tạo:", lichLam);
    return NextResponse.json(lichLam, { status: 201 });
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

    const deleted = await prisma.lichlamviec.delete({
      where: { malichLamViec: maLichLamViec },
      select: {
        malichLamViec: true,
      },
    });

    return NextResponse.json(deleted, { status: 200 });
  } catch (error) {
    console.error("Lỗi xóa lịch làm việc:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}