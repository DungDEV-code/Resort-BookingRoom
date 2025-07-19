import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Lấy danh sách nhân viên (chỉ role: NhanVien)
export async function GET() {
  try {
    const nhanViens = await prisma.nhanvien.findMany({
      where: {
        roleadminuser: {
          role: "NhanVien", // Chỉ lấy nhân viên
        },
      },
      include: {
        roleadminuser: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(nhanViens);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhân viên:", error);
    return NextResponse.json(
      { message: "Lỗi khi lấy danh sách nhân viên thường" },
      { status: 500 }
    );
  }
}
