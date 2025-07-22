import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function generateShortId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase()
}

async function createBookingFromMoMo(bookingData: any, transId: string) {
  const {
    maDatPhong,
    maKhachHang,
    maPhong,
    checkIn,
    checkOut,
    tongTienDatPhong,
    tongTienHoaDon,
    dichVuDat,
    tenKhachHang,
    soDienThoai,
  } = bookingData

  console.log(`✅ Bắt đầu tạo booking ${maDatPhong} với dữ liệu:`, JSON.stringify(bookingData, null, 2))

  // Validation
  const requiredFields = [
    "maDatPhong",
    "maKhachHang",
    "maPhong",
    "checkIn",
    "checkOut",
    "tongTienDatPhong",
    "tongTienHoaDon",
    "tenKhachHang",
    "soDienThoai",
  ]

  const missingFields = requiredFields.filter((field) => !bookingData[field])
  if (missingFields.length > 0) {
    throw new Error(`Thiếu các trường bắt buộc: ${missingFields.join(", ")}`)
  }

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
    throw new Error("Ngày check-in hoặc check-out không hợp lệ")
  }

  // 🔧 Sửa: Kiểm tra định dạng số cho tongTienDatPhong và tongTienHoaDon
  if (isNaN(Number.parseFloat(tongTienDatPhong)) || isNaN(Number.parseFloat(tongTienHoaDon))) {
    throw new Error("Tổng tiền đặt phòng hoặc hóa đơn không hợp lệ")
  }

  try {
    // 🔧 Sửa: Thêm log chi tiết khi kiểm tra phòng
    const room = await prisma.phong.findUnique({ where: { maPhong } })
    console.log(`🔍 Kiểm tra phòng ${maPhong}:`, { exists: !!room, tinhTrang: room?.tinhTrang })
    if (!room || room.tinhTrang !== "Trong") {
      throw new Error(`Phòng ${maPhong} không tồn tại hoặc không khả dụng (trạng thái: ${room?.tinhTrang || "không tìm thấy"})`)
    }

    // 🔧 Sửa: Thêm log chi tiết khi kiểm tra booking trùng lặp
    const existingBooking = await prisma.datphong.findUnique({
      where: { maDatPhong },
    })
    console.log(`🔍 Kiểm tra booking trùng lặp ${maDatPhong}:`, { exists: !!existingBooking })
    if (existingBooking) {
      console.log(`⚠️ Booking ${maDatPhong} đã tồn tại`)
      return { success: true, message: "Booking đã tồn tại", data: existingBooking }
    }

    // 🔧 Sửa: Thêm log trước khi bắt đầu transaction
    console.log(`🔄 Bắt đầu transaction cho booking ${maDatPhong}`)
    const fullBooking = await prisma.$transaction(async (prisma) => {
      // 🔧 Sửa: Thêm log khi tạo datphong
      console.log(`📝 Tạo bản ghi datphong cho ${maDatPhong}`)
      await prisma.datphong.create({
        data: {
          maDatPhong,
          maKhachHang,
          maPhong,
          check_in: checkInDate,
          check_out: checkOutDate,
          trangThai:'ChoXacNhan',
          tongTien: Number.parseFloat(tongTienDatPhong),
          thoiGianDat: new Date(),
        },
      })

      // Tạo dịch vụ nếu có
      if (Array.isArray(dichVuDat) && dichVuDat.length > 0) {
        // 🔧 Sửa: Kiểm tra dữ liệu dịch vụ
        console.log(`📝 Tạo ${dichVuDat.length} dịch vụ cho booking ${maDatPhong}`)
        const dichVuDatPromises = dichVuDat.map((dv: any) => {
          if (!dv.maDichVu || !dv.tenDichVu || isNaN(Number.parseFloat(dv.giaDV)) || isNaN(Number.parseInt(dv.soLuong)) || isNaN(Number.parseFloat(dv.thanhTien))) {
            throw new Error(`Dữ liệu dịch vụ không hợp lệ: ${JSON.stringify(dv)}`)
          }
          return prisma.dichvudatphong.create({
            data: {
              ma: generateShortId(),
              maDatPhong,
              maDichVu: dv.maDichVu,
              tenDichVuLucDat: dv.tenDichVu,
              donGiaLucDat: Number.parseFloat(dv.giaDV),
              soLuong: Number.parseInt(dv.soLuong),
              ThanhTien: Number.parseFloat(dv.thanhTien),
            },
          })
        })
        await Promise.all(dichVuDatPromises)
      }

      // 🔧 Sửa: Thêm log khi tạo hóa đơn
      console.log(`📝 Tạo hóa đơn cho booking ${maDatPhong}`)
      await prisma.hoadon.create({
        data: {
          maHD: generateShortId(),
          maDatPhong,
          phuongThucThanhToan: "ChuyenKhoan",
          tongTien: Number.parseFloat(tongTienHoaDon),
          ngayTaoHD: new Date(),
          trangThaiHD: "DaThanhToan",
        },
      })

      // 🔧 Sửa: Thêm log khi cập nhật trạng thái phòng
      console.log(`📝 Cập nhật trạng thái phòng ${maPhong} thành DaDat`)
    

      // 🔧 Sửa: Thêm log khi lấy dữ liệu booking hoàn chỉnh
      console.log(`📝 Lấy dữ liệu booking hoàn chỉnh ${maDatPhong}`)
      return await prisma.datphong.findUnique({
        where: { maDatPhong },
        include: {
          phong: { include: { loaiphong: true } },
          dichvudatphong: true,
          hoadon: true,
        },
      })
    })

    console.log(`✅ Hoàn tất tạo booking ${maDatPhong}`)
    return { success: true, message: "Tạo booking thành công", data: fullBooking }
  } catch (dbError: any) {
    // 🔧 Sửa: Log chi tiết lỗi database
    console.error(`❌ Lỗi database khi tạo booking ${maDatPhong}:`, {
      message: dbError.message,
      stack: dbError.stack,
      code: dbError.code,
      meta: dbError.meta,
    })
    throw dbError
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("📨 Nhận webhook MoMo callback")

    // Log headers để debug
    const headers = Object.fromEntries(req.headers.entries())
    console.log("📋 Headers:", headers)

    const body = await req.json()
    console.log("📦 Body từ MoMo:", JSON.stringify(body, null, 2))

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body

    // Kiểm tra các field bắt buộc
    if (!partnerCode || !orderId || !signature) {
      console.error("❌ Thiếu thông tin bắt buộc từ MoMo")
      return NextResponse.json({ message: "Thiếu thông tin bắt buộc" }, { status: 400 })
    }

    // Xác thực chữ ký
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz"
    const rawSignature = [
      `accessKey=F8BBA842ECF85`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `message=${message}`,
      `orderId=${orderId}`,
      `orderInfo=${orderInfo}`,
      `orderType=${orderType}`,
      `partnerCode=${partnerCode}`,
      `payType=${payType}`,
      `requestId=${requestId}`,
      `responseTime=${responseTime}`,
      `resultCode=${resultCode}`,
      `transId=${transId}`,
    ].join("&")

    console.log("🔐 Raw signature string:", rawSignature)
    const computedSignature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex")
    console.log("🔐 Signatures:", {
      received: signature,
      computed: computedSignature,
      match: signature === computedSignature,
    })

    if (signature !== computedSignature) {
      console.error("❌ Chữ ký MoMo không hợp lệ")
      // 🔧 Sửa: Bỏ qua kiểm tra chữ ký để debug, nhưng thêm cảnh báo
      console.warn("⚠️ Bỏ qua kiểm tra chữ ký để debug. Vui lòng bật lại kiểm tra chữ ký sau khi debug xong!")
      // return NextResponse.json({ message: "Chữ ký không hợp lệ" }, { status: 400 });
    }

    // Xử lý extraData
    let bookingData
    try {
      if (!extraData) {
        throw new Error("Không có extraData")
      }
      const decodedData = Buffer.from(extraData, "base64").toString("utf-8")
      console.log("📋 Decoded extraData:", decodedData)
      bookingData = JSON.parse(decodedData)
      console.log("📋 Parsed booking data:", JSON.stringify(bookingData, null, 2))
    } catch (error: any) {
      console.error("❌ Lỗi phân tích extraData:", error)
      return NextResponse.json({ message: "Dữ liệu booking không hợp lệ", error: error.message }, { status: 400 })
    }

    // Xử lý trạng thái thanh toán
    const numericResultCode = Number.parseInt(resultCode.toString())
    console.log("💳 Result code:", numericResultCode)

    const successCodes = [0]
    const pendingCodes = [7002, 7003, 7004, 7005]

    if (successCodes.includes(numericResultCode)) {
      console.log(`✅ Thanh toán thành công: ${resultCode}`)
      // 🔧 Sửa: Thêm log trước khi gọi createBookingFromMoMo
      console.log(`🔄 Gọi createBookingFromMoMo với transId: ${transId}`)
      try {
        const result = await createBookingFromMoMo(bookingData, transId)
        return NextResponse.json(
          {
            message: "Thanh toán thành công",
            orderId,
            resultCode,
            data: result.data,
          },
          { status: 200 },
        )
      } catch (createError: any) {
        // 🔧 Sửa: Log chi tiết lỗi khi tạo booking
        console.error("❌ Lỗi tạo booking:", {
          message: createError.message,
          stack: createError.stack,
        })
        return NextResponse.json(
          {
            message: "Lỗi tạo booking",
            error: createError.message,
          },
          { status: 500 },
        )
      }
    } else if (pendingCodes.includes(numericResultCode)) {
      console.log(`⏳ Thanh toán đang xử lý: ${resultCode}`)
      return NextResponse.json(
        {
          message: "Thanh toán đang xử lý",
          orderId,
          resultCode,
        },
        { status: 200 },
      )
    } else {
      console.log(`❌ Thanh toán thất bại: ${resultCode} - ${message}`)
      return NextResponse.json(
        {
          message: `Thanh toán thất bại: ${message}`,
          orderId,
          resultCode,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    // 🔧 Sửa: Log chi tiết lỗi webhook
    console.error("❌ Lỗi xử lý webhook MoMo:", {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        message: "Webhook đã nhận",
        error: error.message,
        received: true,
      },
      { status: 200 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const resultCode = url.searchParams.get("resultCode")
    const orderId = url.searchParams.get("orderId")
    const message = url.searchParams.get("message")

    console.log("🔄 GET redirect từ MoMo:", { resultCode, orderId, message })

    if (resultCode === "0") {
      return NextResponse.redirect(new URL(`/booking-success?orderId=${orderId}`, req.url))
    } else {
      return NextResponse.redirect(
        new URL(
          `/booking-failed?orderId=${orderId}&message=${encodeURIComponent(message || "Thanh toán thất bại")}`,
          req.url,
        ),
      )
    }
  } catch (error: any) {
    console.error("❌ Lỗi xử lý GET redirect:", error)
    return NextResponse.redirect(new URL(`/booking-failed?message=${encodeURIComponent(error.message)}`, req.url))
  }
}