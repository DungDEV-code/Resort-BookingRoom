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
  Calendar,
  Heart,
  Share2,
  Camera,
  MessageSquare,
  Shield,
  Award,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/Header/Header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

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
  totalComments?: number
  tienNghi?: string[]
  comments?: Comment[]
}

interface Comment {
  maBinhLuan: string
  noiDung: string
  danhGia: number
  thoiGianBL: string
  trangThai: string
  tenKhachHang: string
}

const availableAmenities = [
  { id: "wifi", label: "Wi-Fi miễn phí", icon: Wifi },
  { id: "parking", label: "Chỗ đậu xe", icon: Car },
  { id: "gym", label: "Phòng gym", icon: Dumbbell },
  { id: "pool", label: "Hồ bơi", icon: Waves },
]

const TINH_TRANG_MAP: Record<string, string> = {
  Trống: "Còn trống",
  "Đã Đặt": "Đã đặt",
  "Đang dọn dẹp": "Đang dọn dẹp",
  "Đang sửa chữa": "Đang sửa chữa",
}

export default function RoomDetail() {
  const router = useRouter()
  const { maPhong } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(5)

  useEffect(() => {
    if (maPhong) {
      fetch(`/api/rooms/${maPhong}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("API Response:", data)
          setRoom({
            ...data,
            rating: data.rating || Number((Math.random() * 2 + 3).toFixed(1)),
            totalComments: data.totalComments || 0,
            comments: data.comments || [],
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
          console.error("API Error:", err)
          setLoading(false)
        })
    }
  }, [maPhong])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "decimal" }).format(price).concat(" VND")

  const getAmenityIcon = (amenityId: string) => {
    const amenity = availableAmenities.find((a) => a.id === amenityId)
    return amenity?.icon || Wifi
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Đang tải thông tin phòng...</p>
          <p className="text-slate-400 text-sm mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-red-50">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Không tìm thấy phòng</h2>
          <p className="text-slate-600 mb-6">Phòng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button
            onClick={() => router.push("/rooms")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại danh sách phòng
          </Button>
        </div>
      </div>
    )
  }

  const allComments = room.comments || []

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* Simple Header */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => router.push("/rooms")}
            className="mb-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Mã: {room.maPhong}
                </Badge>
                <Badge
                  className={`text-xs ${
                    room.tinhTrang === "Trống" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {TINH_TRANG_MAP[room.tinhTrang] || room.tinhTrang}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {room.tenPhong || room.loaiphong?.tenLoaiPhong || "Phòng"}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{room.rating}</span>
                  <span>({room.totalComments || 0} đánh giá)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Heart className="h-4 w-4" />
                Yêu thích
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="h-4 w-4" />
                Chia sẻ
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Main Image - Fixed */}
              <div className="relative group">
                <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-200 to-slate-300">
                  <Image
                    src={room.hinhAnh ? `/img/rooms/${room.hinhAnh}` : "/placeholder.svg?height=500&width=800"}
                    alt={room.tenPhong || "Phòng"}
                    fill
                    className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                    onLoad={() => setImageLoaded(true)}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse rounded-2xl" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                </div>
              </div>

              {/* Description */}
              <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Mô tả phòng</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {room.moTa ||
                      "Phòng được thiết kế hiện đại với không gian thoáng mát, nội thất cao cấp và đầy đủ tiện nghi. Đây là nơi lý tưởng để bạn nghỉ ngơi và thư giãn."}
                  </p>
                </CardContent>
              </Card>

              {/* Room Details & Amenities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Thông tin chi tiết</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-700">Số khách</span>
                        </div>
                        <span className="text-lg font-bold text-gray-800">{room.loaiphong?.soNguoi} người</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bed className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-700">Số giường</span>
                        </div>
                        <span className="text-lg font-bold text-gray-800">{room.loaiphong?.soGiuong} giường</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Award className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-700">Loại phòng</span>
                        </div>
                        <span className="text-lg font-bold text-gray-800">{room.loaiphong?.tenLoaiPhong}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Tiện nghi</h3>
                    </div>
                    <div className="space-y-2">
                      {room.tienNghi?.map((amenityId) => {
                        const Icon = getAmenityIcon(amenityId)
                        const amenity = availableAmenities.find((a) => a.id === amenityId)
                        return (
                          <div key={amenityId} className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="text-gray-700">{amenity?.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comments Section */}
              <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Đánh giá ({allComments.length})</h2>
                    </div>
                    {room.rating && (
                      <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold text-yellow-600">{room.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {allComments.length > 0 ? (
                      allComments.map((comment) => (
                        <div key={comment.maBinhLuan} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback className="bg-blue-600 text-white font-bold">
                                {comment.tenKhachHang.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-bold text-gray-800">{comment.tenKhachHang}</p>
                                  <p className="text-sm text-gray-500">
                                    {format(new Date(comment.thoiGianBL), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < comment.danhGia ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-700 leading-relaxed">{comment.noiDung}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-lg text-gray-500 font-medium">Chưa có đánh giá nào cho phòng này</p>
                        <p className="text-gray-400 mt-2">Hãy là người đầu tiên đánh giá!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                  <div className="bg-blue-600 p-6 text-white rounded-t-2xl">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-1">{formatPrice(room.gia)}</div>
                      <div className="text-blue-100 font-medium">mỗi đêm</div>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                        <Calendar className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                        <div className="text-xs text-gray-500 font-medium">Nhận phòng</div>
                        <div className="text-sm font-bold text-gray-800 mt-1">Chọn ngày</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                        <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                        <div className="text-xs text-gray-500 font-medium">Trả phòng</div>
                        <div className="text-sm font-bold text-gray-800 mt-1">Chọn ngày</div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Users className="h-6 w-6 mx-auto text-green-600 mb-2" />
                      <div className="text-xs text-gray-500 font-medium">Số khách</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">Tối đa {room.loaiphong?.soNguoi} người</div>
                    </div>

                    <Button
                      size="lg"
                      disabled={room.tinhTrang !== "Trống"}
                      className={`w-full font-bold py-4 rounded-lg text-lg shadow-md transition-all duration-200 ${
                        room.tinhTrang === "Trống"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {TINH_TRANG_MAP[room.tinhTrang] === "Còn trống" ? "Đặt phòng ngay" : "Phòng đã hết"}
                    </Button>

                    {TINH_TRANG_MAP[room.tinhTrang] === "Còn trống" && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <p className="font-bold text-green-700">Đặt phòng an toàn</p>
                        </div>
                        <p className="text-sm text-green-600 mb-1">✓ Miễn phí hủy trong 24 giờ</p>
                        <p className="text-sm text-green-600">✓ Không cần thanh toán trước</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}