import { prisma } from "@/lib/prisma"

export async function updateVoucherStatusJob() {
  const today = new Date()

  // Cập nhật các voucher đã hết hạn
  await prisma.voucher.updateMany({
    where: {
      ngayKetThuc: { lt: today },
      trangThai: { not: "HetHan" },
    },
    data: { trangThai: "HetHan" },
  })

  // Cập nhật các voucher còn hiệu lực
  await prisma.voucher.updateMany({
    where: {
      ngayBatDau: { lte: today },
      ngayKetThuc: { gte: today },
      trangThai: { not: "ConHieuLuc" },
    },
    data: { trangThai: "ConHieuLuc" },
  })
}
