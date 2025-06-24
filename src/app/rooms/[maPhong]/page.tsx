"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import {
  Users,
  Bed,
  Star,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Sparkles,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Heart,
  Share2,
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/Header/Header"

interface Room {
  maPhong: string
  moTa: string
  tinhTrang: string
  gia: number
  hinhAnh: string
  tenPhong: string
  loaiphong: {
    tenLoaiPhong: string
    soNguoi: number
    soGiuong: number
  }
  rating?: number
  view?: string
  tienNghi?: string[]
}

const availableAmenities = [
  { id: "wifi", label: "Wi-Fi miễn phí", icon: Wifi },
  { id: "parking", label: "Chỗ đậu xe", icon: Car },
  { id: "gym", label: "Phòng gym", icon: Dumbbell },
  { id: "pool", label: "Hồ bơi", icon: Waves },
]

export default function RoomDetail() {
  const router = useRouter()
  const { maPhong } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (maPhong) {
      fetch(`/api/rooms/${maPhong}`)
        .then((res) => res.json())
        .then((data) => {
          setRoom({
            ...data,
            rating: data.rating || (Math.random() * 2 + 3).toFixed(1),
            tienNghi: data.tienNghi || [
              "wifi",
              "parking",
              ...availableAmenities
                .sort(() => 0.5 - Math.random())
                .slice(0, 2)
                .map((a) => a.id),
            ],
          })
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    }
  }, [maPhong])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)

  const getAmenityIcon = (amenityId: string) => {
    const amenity = availableAmenities.find((a) => a.id === amenityId)
    return amenity?.icon || Wifi
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-700 font-medium">Đang tải thông tin phòng...</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy phòng</h2>
          <p className="text-gray-600 mb-6">Phòng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa</p>
          <Button
            onClick={() => router.push("/rooms")}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách phòng
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-6 md:py-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDk5LDEwMiwyNDEsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/rooms")}
            className="mb-4 flex items-center gap-2 text-indigo-700 hover:bg-white/50 rounded-lg px-3 py-2 transition-all duration-300 border border-indigo-200 backdrop-blur-sm bg-white/30 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Quay lại danh sách</span>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Room info */}
            <div className="flex-1">
              {/* Room code badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-medium mb-3 shadow-sm">
                <span>Mã phòng: {room.maPhong}</span>
              </div>

              {/* Room title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 leading-tight">
                {room.tenPhong || room.loaiphong?.tenLoaiPhong || "Phòng"}
              </h1>

              {/* Room details */}
              <div className="flex flex-wrap items-center gap-3 text-gray-600 mb-3">
                <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/40">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-700 text-sm">{room.rating}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{room.loaiphong?.tenLoaiPhong}</span>
                </div>
              </div>

              {/* Status badge */}
              <Badge
                className={`${room.tinhTrang === "Còn trống" || room.tinhTrang === "Trống"
                    ? "bg-emerald-500/20 text-emerald-700 border-emerald-400/30 hover:bg-emerald-500/30"
                    : "bg-red-500/20 text-red-700 border-red-400/30 hover:bg-red-500/30"
                  } px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border transition-colors duration-200`}
              >
                <CheckCircle className="h-3 w-3 mr-1.5" />
                {room.tinhTrang}
              </Badge>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-indigo-300 bg-white/70 backdrop-blur-sm text-indigo-700 hover:bg-white/90 hover:border-indigo-400 transition-all duration-200 px-3 py-2"
              >
                <Heart className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Yêu thích</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-indigo-300 bg-white/70 backdrop-blur-sm text-indigo-700 hover:bg-white/90 hover:border-indigo-400 transition-all duration-200 px-3 py-2"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                <span className="text-sm">Chia sẻ</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column - Room Details */}
            <div className="lg:col-span-8 space-y-8">

              {/* Image Gallery */}
              <div className="relative">
                <Card className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden group">
                  <div className="relative w-full h-64 md:h-96 lg:h-[500px]">
                    <Image
                      src={room.hinhAnh ? `/img/rooms/${room.hinhAnh}` : "/placeholder.svg?height=500&width=800"}
                      alt={room.tenPhong || "Phòng"}
                      fill
                      className={`object-cover object-center transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority
                      onLoad={() => setImageLoaded(true)}
                    />

                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </Card>
              </div>

              {/* Room Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Description */}
                <Card className="bg-white rounded-2xl shadow-lg border-0 p-6 md:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Mô tả phòng</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-base">{room.moTa}</p>
                </Card>

                {/* Room Details */}
                <Card className="bg-white rounded-2xl shadow-lg border-0 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Thông tin chi tiết</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Số khách</span>
                      </div>
                      <span className="font-bold text-blue-600 text-lg">{room.loaiphong?.soNguoi} người</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Bed className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Số giường</span>
                      </div>
                      <span className="font-bold text-purple-600 text-lg">{room.loaiphong?.soGiuong} giường</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-700">Loại phòng</span>
                      </div>
                      <span className="font-bold text-emerald-600 text-lg">{room.loaiphong?.tenLoaiPhong}</span>
                    </div>
                  </div>
                </Card>

                {/* Amenities */}
                <Card className="bg-white rounded-2xl shadow-lg border-0 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Wifi className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Tiện nghi</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {room.tienNghi?.map((amenityId) => {
                      const Icon = getAmenityIcon(amenityId)
                      const amenity = availableAmenities.find((a) => a.id === amenityId)
                      return (
                        <div
                          key={amenityId}
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-medium text-gray-700">{amenity?.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-4">
              <div className="sticky top-6">
                <Card className="bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
                  {/* Price Header */}
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
                    <div className="text-center relative z-10">
                      <div className="text-3xl md:text-4xl font-bold mb-1">
                        {formatPrice(room.gia)}
                      </div>
                      <div className="text-sm text-gray-300 font-medium">mỗi đêm</div>
                    </div>
                  </div>

                  {/* Booking Form */}
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-300">
                          <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                          <div className="text-xs text-gray-500 mb-1">Nhận phòng</div>
                          <div className="text-sm font-semibold text-gray-800">Chọn ngày</div>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-300">
                          <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                          <div className="text-xs text-gray-500 mb-1">Trả phòng</div>
                          <div className="text-sm font-semibold text-gray-800">Chọn ngày</div>
                        </div>
                      </div>

                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-md transition-all duration-300">
                        <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="text-xs text-gray-500 mb-1">Số khách</div>
                        <div className="text-sm font-semibold text-gray-800">
                          Tối đa {room.loaiphong?.soNguoi} người
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      disabled={room.tinhTrang !== "Trống" && room.tinhTrang !== "Còn trống"}
                      className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-base">
                          {room.tinhTrang === "Trống" || room.tinhTrang === "Còn trống"
                            ? "Đặt phòng ngay"
                            : "Phòng đã hết"}
                        </span>
                      </div>
                    </Button>

                    {(room.tinhTrang === "Trống" || room.tinhTrang === "Còn trống") && (
                      <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
                        <p className="text-sm text-emerald-700 font-medium">
                          ✨ Miễn phí hủy trong 24 giờ
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
                          Không cần thanh toán trước
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}