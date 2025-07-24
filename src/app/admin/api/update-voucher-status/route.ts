// app/api/update-voucher-status/route.ts

import { NextResponse } from "next/server"
import { updateVoucherStatusJob } from "@/lib/cron/updateVoucherStatus"

export async function POST() {
  try {
    await updateVoucherStatusJob()

    return NextResponse.json({
      success: true,
      message: "Đã cập nhật trạng thái voucher thành công.",
    })
  } catch (error) {
    console.error("Lỗi cập nhật voucher:", error)

    return NextResponse.json(
      { success: false, message: "Đã xảy ra lỗi khi cập nhật trạng thái voucher." },
      { status: 500 }
    )
  }
}
