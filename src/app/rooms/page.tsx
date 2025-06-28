
"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import {
  Search,
  Users,
  Bed,
  Filter,
  X,
  Star,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Sparkles,
  Calendar,
  User,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/Header/Header"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

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

interface Service {
  maDV: string
  tenDV: string
  moTaDV: string
  giaDV: number
  anhDV: string
}

interface BookedService {
  maDichVu: string
  tenDichVu: string
  giaDV: number
  soLuong: number
  thanhTien: number
}

interface FilterState {
  soNguoi: string
  loaiPhong: string
  giaMin: string
  giaMax: string
  ratingMin: string
  tienNghi: string[]
  sortBy: string
}

interface BookingForm {
  tenKhachHang: string
  ngaySinh: string
  diaChi: string
  soDienThoai: string
  email: string
  checkIn: string
  checkOut: string
  phuongThucThanhToan: string
  dichVuDat: BookedService[]
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    tenKhachHang: "",
    ngaySinh: "",
    diaChi: "",
    soDienThoai: "",
    email: "",
    checkIn: "",
    checkOut: "",
    phuongThucThanhToan: "",
    dichVuDat: [],
  })
  const [services, setServices] = useState<Service[]>([])
  const [filters, setFilters] = useState<FilterState>({
    soNguoi: "",
    loaiPhong: "",
    giaMin: "",
    giaMax: "",
    ratingMin: "",
    tienNghi: [],
    sortBy: "gia-tang",
  })

  const availableAmenities = [
    { id: "wifi", label: "Wi-Fi miễn phí", icon: Wifi },
    { id: "parking", label: "Chỗ đậu xe", icon: Car },
    { id: "gym", label: "Phòng gym", icon: Dumbbell },
    { id: "pool", label: "Hồ bơi", icon: Waves },
  ]

  const generateRandomAmenities = () => {
    const shuffled = [...availableAmenities].sort(() => 0.5 - Math.random())
    const numAmenities = Math.floor(Math.random() * 3) + 2
    return shuffled.slice(0, numAmenities).map((amenity) => amenity.id)
  }

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((response) => {
        if (response.success && Array.isArray(response.data)) {
          const enhancedData = response.data.map((room: Room) => ({
            ...room,
            rating: room.rating || Number((Math.random() * 2 + 3).toFixed(1)),
            tienNghi: room.tienNghi || generateRandomAmenities(),
          }))
          setRooms(enhancedData)
        } else {
          console.error("Invalid response format or no data:", response)
          setRooms([])
        }
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err)
        setRooms([])
      })
  }, [])

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data)
        } else {
          console.error("Invalid services response format:", data)
          setServices([])
        }
      })
      .catch((err) => {
        console.error("Error fetching services:", err)
        setServices([])
      })
  }, [])

  const uniqueRoomTypes = useMemo(() => {
    return [...new Set(rooms.map((room) => room.loaiphong?.tenLoaiPhong).filter(Boolean))]
  }, [rooms])

  const filteredAndSortedRooms = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const search = searchTerm.toLowerCase()
      const matchSearch = search ? room.tenPhong?.toLowerCase().includes(search) : true

      const matchSoNguoi = filters.soNguoi
        ? filters.soNguoi === "4"
          ? room.loaiphong.soNguoi >= 4
          : room.loaiphong.soNguoi.toString() === filters.soNguoi
        : true

      const matchLoaiPhong = filters.loaiPhong ? room.loaiphong?.tenLoaiPhong === filters.loaiPhong : true

      const matchGiaMin = filters.giaMin ? room.gia >= Number.parseInt(filters.giaMin) : true

      const matchGiaMax = filters.giaMax ? room.gia <= Number.parseInt(filters.giaMax) : true

      const matchRating = (() => {
        const rating = Number.parseFloat(String(room.rating || "0"))
        switch (filters.ratingMin) {
          case "3":
            return rating >= 0 && rating < 3.9
          case "4":
            return rating >= 4 && rating < 4.5
          case "4.5":
            return rating >= 4.5 && rating <= 5
          default:
            return true
        }
      })()

      const matchTienNghi =
        filters.tienNghi.length === 0 || filters.tienNghi.every((amenity) => room.tienNghi?.includes(amenity))

      return matchSearch && matchSoNguoi && matchLoaiPhong && matchGiaMin && matchGiaMax && matchRating && matchTienNghi
    })

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "gia-tang":
          return a.gia - b.gia
        case "gia-giam":
          return b.gia - a.gia
        case "rating-cao":
          return Number.parseFloat(String(b.rating || "0")) - Number.parseFloat(String(a.rating || "0"))
        default:
          return 0
      }
    })

    return filtered
  }, [rooms, searchTerm, filters])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      tienNghi: checked ? [...prev.tienNghi, amenityId] : prev.tienNghi.filter((id) => id !== amenityId),
    }))
  }

  const clearFilters = () => {
    setFilters({
      soNguoi: "",
      loaiPhong: "",
      giaMin: "",
      giaMax: "",
      ratingMin: "",
      tienNghi: [],
      sortBy: "gia-tang",
    })
    setSearchTerm("")
  }

  const getAmenityIcon = (amenityId: string) => {
    const amenity = availableAmenities.find((a) => a.id === amenityId)
    return amenity?.icon || Wifi
  }

  const activeFiltersCount =
    Object.values(filters).filter((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value) && value !== "gia-tang",
    ).length + (searchTerm ? 1 : 0)

  const handleBookingFormChange = (field: keyof BookingForm, value: string) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBookNow = (room: Room) => {
    setSelectedRoom(room)
    setIsBookingModalOpen(true)
  }

  const calculateTotalPrice = () => {
    if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut) return 0

    const checkIn = new Date(bookingForm.checkIn)
    const checkOut = new Date(bookingForm.checkOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    const roomTotal = nights > 0 ? nights * selectedRoom.gia : 0
    const servicesTotal = bookingForm.dichVuDat.reduce((total, service) => total + service.thanhTien, 0)

    return roomTotal + servicesTotal
  }

  const addService = (service: Service) => {
    const existingService = bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV)

    if (existingService) {
      const updatedServices = bookingForm.dichVuDat.map((s) =>
        s.maDichVu === service.maDV ? { ...s, soLuong: s.soLuong + 1, thanhTien: (s.soLuong + 1) * s.giaDV } : s,
      )
      setBookingForm((prev) => ({ ...prev, dichVuDat: updatedServices }))
    } else {
      const newService: BookedService = {
        maDichVu: service.maDV,
        tenDichVu: service.tenDV,
        giaDV: service.giaDV,
        soLuong: 1,
        thanhTien: service.giaDV,
      }
      setBookingForm((prev) => ({ ...prev, dichVuDat: [...prev.dichVuDat, newService] }))
    }
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId)
      return
    }

    const updatedServices = bookingForm.dichVuDat.map((s) =>
      s.maDichVu === serviceId ? { ...s, soLuong: quantity, thanhTien: quantity * s.giaDV } : s,
    )
    setBookingForm((prev) => ({ ...prev, dichVuDat: updatedServices }))
  }

  const removeService = (serviceId: string) => {
    const updatedServices = bookingForm.dichVuDat.filter((s) => s.maDichVu !== serviceId)
    setBookingForm((prev) => ({ ...prev, dichVuDat: updatedServices }))
  }

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault()

    if (!bookingForm.tenKhachHang || !bookingForm.soDienThoai || !bookingForm.checkIn || !bookingForm.checkOut) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!")
      return
    }

    const checkIn = new Date(bookingForm.checkIn)
    const checkOut = new Date(bookingForm.checkOut)
    if (checkOut <= checkIn) {
      alert("Ngày trả phòng phải sau ngày nhận phòng!")
      return
    }

    console.log("Booking data:", {
      room: selectedRoom,
      customer: bookingForm,
      totalPrice: calculateTotalPrice(),
    })
    alert("Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.")
    setIsBookingModalOpen(false)
    setBookingForm({
      tenKhachHang: "",
      ngaySinh: "",
      diaChi: "",
      soDienThoai: "",
      email: "",
      checkIn: "",
      checkOut: "",
      phuongThucThanhToan: "",
      dichVuDat: [],
    })
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return tomorrow.toISOString().split("T")[0]
  }

  const getDayAfterTomorrowDate = () => {
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    return dayAfter.toISOString().split("T")[0]
  }

  const truncateDescription = (text: string, wordLimit = 15) => {
    const words = text.split(" ")
    if (words.length <= wordLimit) return text
    return words.slice(0, wordLimit).join(" ") + "..."
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 text-gray-800 py-8 md:py-16 border-b border-sky-200">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-sky-700 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Danh Sách Phòng
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Tìm phòng phù hợp với nhu cầu của bạn - Trải nghiệm nghỉ dưỡng tuyệt vời
            </p>
          </div>
        </section>

        <section className="py-4 md:py-8">
          <div className="container mx-auto px-4">
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-gray-200"
              >
                <Filter className="h-4 w-4" />
                Bộ lọc & Tìm kiếm
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex gap-4 lg:gap-8">
              <aside
                className={`
                  ${showFilters ? "block" : "hidden"} lg:block
                  w-full lg:w-80 lg:flex-shrink-0
                  fixed lg:static top-0 left-0 right-0 bottom-0 z-50 lg:z-auto
                  bg-white lg:bg-transparent
                  p-4 lg:p-0
                  overflow-y-auto lg:overflow-visible
                `}
              >
                <div className="lg:hidden flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Bộ lọc & Tìm kiếm</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 lg:p-6 lg:sticky lg:top-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-base lg:text-lg font-semibold mb-3 text-gray-800">Tìm kiếm</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Tìm theo tên phòng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border-gray-200 focus:border-sky-500 focus:ring-sky-500 rounded-2xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Sắp xếp theo</h3>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    >
                      <option value="gia-tang">Giá: Thấp đến cao</option>
                      <option value="gia-giam">Giá: Cao đến thấp</option>
                      <option value="rating-cao">Đánh giá cao nhất</option>
                    </select>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Số khách</h3>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                        value={filters.soNguoi}
                        onChange={(e) => handleFilterChange("soNguoi", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="1">1 khách</option>
                        <option value="2">2 khách</option>
                        <option value="3">3 khách</option>
                        <option value="4">4+ khách</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Loại phòng</h3>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                        value={filters.loaiPhong}
                        onChange={(e) => handleFilterChange("loaiPhong", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        {uniqueRoomTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Đánh giá tối thiểu</h3>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                        value={filters.ratingMin}
                        onChange={(e) => handleFilterChange("ratingMin", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="3">3 sao</option>
                        <option value="4">4+ sao</option>
                        <option value="4.5">4.5+ sao</option>
                      </select>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Khoảng giá (VNĐ)</h3>
                      <div className="mb-2">
                        <Slider
                          min={0}
                          max={10000000}
                          step={50000}
                          value={[Number(filters.giaMin) || 0, Number(filters.giaMax) || 10000000]}
                          onValueChange={([min, max]) => {
                            handleFilterChange("giaMin", String(min))
                            handleFilterChange("giaMax", String(max))
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{formatPrice(Number(filters.giaMin) || 0)}</span>
                        <span>{formatPrice(Number(filters.giaMax) || 10000000)}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tiện nghi</h3>
                      <div className="space-y-2">
                        {availableAmenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={amenity.id}
                              checked={filters.tienNghi.includes(amenity.id)}
                              onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                            />
                            <label htmlFor={amenity.id} className="text-sm flex items-center gap-2 cursor-pointer">
                              <amenity.icon className="h-4 w-4" />
                              {amenity.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {activeFiltersCount > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full flex items-center justify-center gap-1 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                        Xóa bộ lọc ({activeFiltersCount})
                      </Button>
                    </div>
                  )}

                  <div className="lg:hidden mt-6 pt-4 border-t">
                    <Button
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-2xl"
                    >
                      Áp dụng bộ lọc
                    </Button>
                  </div>
                </div>
              </aside>

              {showFilters && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)} />
              )}

              <div className="flex-1 min-w-0">
                <div className="mb-4 lg:mb-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Tìm thấy <span className="font-semibold text-sky-600">{filteredAndSortedRooms.length}</span> phòng
                  </div>
                </div>

                {filteredAndSortedRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 lg:h-16 w-12 lg:w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl lg:text-2xl font-semibold text-gray-600 mb-2">Không tìm thấy phòng</h3>
                    <p className="text-gray-500 mb-4 text-sm lg:text-base">
                      Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      Xóa bộ lọc
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                    {filteredAndSortedRooms.map((room) => (
                      <Card
                        key={room.maPhong}
                        className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 border border-gray-100 p-0"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-200 via-blue-200 to-sky-200 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                        <div className="relative w-full h-56 overflow-hidden">
                          <Link href={`/rooms/${room.maPhong}`} className="block w-full h-full">
                            <Image
                              src={
                                room.hinhAnh ? `/img/rooms/${room.hinhAnh}` : "/placeholder.svg?height=256&width=400"
                              }
                              alt={room.loaiphong?.tenLoaiPhong || "Phòng"}
                              fill
                              className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              priority={false}
                            />
                          </Link>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />

                          <div className="absolute top-4 right-4 backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-2 rounded-2xl text-xs font-bold shadow-2xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            {room.maPhong}
                          </div>

                          <div className="absolute top-4 left-4 backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300 drop-shadow-lg" />
                            {room.rating}
                          </div>

                          <div className="absolute bottom-4 left-4 backdrop-blur-md border border-white/30 px-3 py-2 rounded-2xl text-xs font-bold shadow-2xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <div
                              className={`${room.tinhTrang === "Còn trống" || room.tinhTrang === "Trống"
                                  ? "bg-emerald-500/90 text-white"
                                  : "bg-red-500/90 text-white"
                                } px-3 py-1 rounded-xl`}
                            >
                              {room.tinhTrang}
                            </div>
                          </div>

                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div
                              className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping"
                              style={{ animationDelay: "0s" }}
                            />
                            <div
                              className="absolute top-3/4 right-1/3 w-1 h-1 bg-white/60 rounded-full animate-ping"
                              style={{ animationDelay: "1s" }}
                            />
                            <div
                              className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping"
                              style={{ animationDelay: "2s" }}
                            />
                          </div>
                        </div>

                        <CardContent className="p-6 relative z-10">
                          <div className="mb-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors duration-300">
                              {room.tenPhong || room.loaiphong?.tenLoaiPhong || "Phòng"}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-4">{room.moTa}</p>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-2 bg-sky-50 px-3 py-2 rounded-xl">
                              <Users className="h-4 w-4 text-sky-600" />
                              <span className="font-medium">{room.loaiphong?.soNguoi} khách</span>
                            </div>

                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl">
                              <Bed className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium">{room.loaiphong?.soGiuong} giường</span>
                            </div>
                          </div>

                          <div className="mb-6">
                            {room.tienNghi && room.tienNghi.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {room.tienNghi.slice(0, 4).map((amenityId) => {
                                  const Icon = getAmenityIcon(amenityId)
                                  const amenity = availableAmenities.find((a) => a.id === amenityId)
                                  return (
                                    <div
                                      key={amenityId}
                                      className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 p-3 rounded-2xl flex items-center gap-2 hover:from-sky-100 hover:to-blue-100 transition-colors duration-300 shadow-sm"
                                      title={amenity?.label}
                                    >
                                      <Icon className="h-4 w-4 text-sky-600" />
                                      <span className="text-xs font-medium text-sky-700">
                                        {amenity?.label.split(" ")[0]}
                                      </span>
                                    </div>
                                  )
                                })}
                                {room.tienNghi.length > 4 && (
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 px-4 py-3 rounded-2xl text-xs text-purple-700 font-bold shadow-sm">
                                    +{room.tienNghi.length - 4} tiện nghi
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div>
                              <div className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                {formatPrice(room.gia)}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">/ đêm</div>
                            </div>

                            <Button
                              size="lg"
                              disabled={room.tinhTrang !== "Trống" && room.tinhTrang !== "Còn trống"}
                              onClick={() => handleBookNow(room)}
                              className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center gap-2 group/btn border-0"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                              <Sparkles className="h-5 w-5 group-hover/btn:rotate-180 transition-transform duration-500 relative z-10" />
                              <span className="relative z-10 text-sm">
                                {room.tinhTrang === "Trống" || room.tinhTrang === "Còn trống"
                                  ? "Đặt ngay"
                                  : "Hết phòng"}
                              </span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-bold text-sky-700 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Đặt phòng - {selectedRoom?.tenPhong || selectedRoom?.loaiphong?.tenLoaiPhong}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitBooking} className="space-y-6">
              <div className="bg-sky-50 p-5 rounded-2xl border border-sky-200">
                <div className="flex items-center gap-5">
                  {selectedRoom && (
                    <Image
                      src={
                        selectedRoom.hinhAnh
                          ? `/img/rooms/${selectedRoom.hinhAnh}`
                          : "/placeholder.svg?height=100&width=150"
                      }
                      alt={selectedRoom.tenPhong}
                      width={150}
                      height={100}
                      className="rounded-xl object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-sky-800 mb-1">{selectedRoom?.tenPhong}</h3>
                    <p className="text-sky-600 text-base mb-2">{selectedRoom?.loaiphong?.tenLoaiPhong}</p>
                    <p className="text-3xl font-bold text-sky-700">
                      {selectedRoom && formatPrice(selectedRoom.gia)}/đêm
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-5">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <User className="h-5 w-5" />
                      Thông tin khách hàng
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tenKhachHang" className="text-sm font-medium text-gray-700">
                          Họ và tên <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="tenKhachHang"
                          type="text"
                          value={bookingForm.tenKhachHang}
                          onChange={(e) => handleBookingFormChange("tenKhachHang", e.target.value)}
                          placeholder="Nhập họ và tên"
                          className="mt-1 h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="soDienThoai" className="text-sm font-medium text-gray-700">
                          Số điện thoại <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="soDienThoai"
                          type="tel"
                          value={bookingForm.soDienThoai}
                          onChange={(e) => handleBookingFormChange("soDienThoai", e.target.value)}
                          placeholder="Nhập số điện thoại"
                          className="mt-1 h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingForm.email}
                          onChange={(e) => handleBookingFormChange("email", e.target.value)}
                          placeholder="Nhập email"
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ngaySinh" className="text-sm font-medium text-gray-700">
                          Ngày sinh
                        </Label>
                        <Input
                          id="ngaySinh"
                          type="date"
                          value={bookingForm.ngaySinh}
                          onChange={(e) => handleBookingFormChange("ngaySinh", e.target.value)}
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="diaChi" className="text-sm font-medium text-gray-700">
                          Địa chỉ
                        </Label>
                        <Input
                          id="diaChi"
                          type="text"
                          value={bookingForm.diaChi}
                          onChange={(e) => handleBookingFormChange("diaChi", e.target.value)}
                          placeholder="Nhập địa chỉ"
                          className="mt-1 h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <Calendar className="h-5 w-5" />
                      Thông tin đặt phòng
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="checkIn" className="text-sm font-medium text-gray-700">
                          Ngày nhận phòng <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="checkIn"
                          type="date"
                          value={bookingForm.checkIn}
                          onChange={(e) => handleBookingFormChange("checkIn", e.target.value)}
                          min={getTomorrowDate()}
                          className="mt-1 h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkOut" className="text-sm font-medium text-gray-700">
                          Ngày trả phòng <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="checkOut"
                          type="date"
                          value={bookingForm.checkOut}
                          onChange={(e) => handleBookingFormChange("checkOut", e.target.value)}
                          min={bookingForm.checkIn || getDayAfterTomorrowDate()}
                          className="mt-1 h-11"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <CreditCard className="h-5 w-5" />
                      Phương thức thanh toán
                    </h3>
                    <div>
                      <Label htmlFor="phuongThucThanhToan" className="text-sm font-medium text-gray-700">
                        Chọn phương thức thanh toán <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bookingForm.phuongThucThanhToan}
                        onValueChange={(value) => handleBookingFormChange("phuongThucThanhToan", value)}
                      >
                        <SelectTrigger className="mt-1 h-11">
                          <SelectValue placeholder="Chọn phương thức thanh toán" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TienMat">
                            <div className="flex items-center gap-2">
                              <span>💵</span>
                              <div>
                                <div className="font-medium">Tiền mặt</div>
                                <div className="text-xs text-gray-500">Thanh toán khi nhận phòng</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="ChuyenKhoan">
                            <div className="flex items-center gap-2">
                              <span>🏦</span>
                              <div>
                                <div className="font-medium">Chuyển khoản</div>
                                <div className="text-xs text-gray-500">Thanh toán online</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="TheATM">
                            <div className="flex items-center gap-2">
                              <span>💳</span>
                              <div>
                                <div className="font-medium">Thẻ ATM/Visa</div>
                                <div className="text-xs text-gray-500">Thanh toán bằng thẻ</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                      <Sparkles className="h-5 w-5" />
                      Dịch vụ bổ sung
                    </h3>

                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-2xl p-4 bg-gray-50">
                      <div className="space-y-3">
                        {services.map((service) => (
                          <div
                            key={service.maDV}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-sky-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start gap-4">
                              <Image
                                src={`/img/services/${service.anhDV}`}
                                alt={service.tenDV}
                                width={60}
                                height={60}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 text-base mb-2">{service.tenDV}</h4>
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.moTaDV}</p>
                                <p className="text-lg font-bold text-sky-600">{formatPrice(service.giaDV)}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV) ? (
                                  <div className="flex items-center gap-2 bg-sky-50 rounded-xl p-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const currentService = bookingForm.dichVuDat.find(
                                          (s) => s.maDichVu === service.maDV,
                                        )
                                        if (currentService) {
                                          updateServiceQuantity(service.maDV, currentService.soLuong - 1)
                                        }
                                      }}
                                      className="w-8 h-8 p-0 rounded-lg border-sky-200 hover:bg-sky-100"
                                    >
                                      -
                                    </Button>
                                    <span className="text-base font-semibold min-w-[30px] text-center text-sky-700">
                                      {bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV)?.soLuong || 0}
                                    </span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const currentService = bookingForm.dichVuDat.find(
                                          (s) => s.maDichVu === service.maDV,
                                        )
                                        if (currentService) {
                                          updateServiceQuantity(service.maDV, currentService.soLuong + 1)
                                        }
                                      }}
                                      className="w-8 h-8 p-0 rounded-lg border-sky-200 hover:bg-sky-100"
                                    >
                                      +
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => addService(service)}
                                    className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium"
                                  >
                                    Thêm dịch vụ
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {bookingForm.dichVuDat.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-purple-800 text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Dịch vụ đã chọn ({bookingForm.dichVuDat.length})
                        </h4>
                        <span className="text-lg font-bold text-purple-800 bg-white px-3 py-2 rounded-lg">
                          {formatPrice(bookingForm.dichVuDat.reduce((total, service) => total + service.thanhTien, 0))}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {bookingForm.dichVuDat.map((service) => (
                          <div
                            key={service.maDichVu}
                            className="flex justify-between items-center bg-white/70 rounded-xl px-4 py-3 border border-purple-100"
                          >
                            <div className="flex-1">
                              <span className="text-purple-800 font-medium text-base block">{service.tenDichVu}</span>
                              <span className="text-purple-600 text-sm">
                                {formatPrice(service.giaDV)} x {service.soLuong}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-purple-800 text-lg">
                                {formatPrice(service.thanhTien)}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeService(service.maDichVu)}
                                className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bookingForm.checkIn && bookingForm.checkOut && (
                    <div className="bg-gradient-to-r from-sky-50 to-blue-50 p-5 rounded-2xl border border-sky-200">
                      <h3 className="text-lg font-semibold text-sky-800 mb-4">Tổng kết đặt phòng</h3>
                      <div className="space-y-3 text-base">
                        <div className="flex justify-between">
                          <span>Số đêm:</span>
                          <span className="font-medium">
                            {Math.ceil(
                              (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
                              (1000 * 60 * 60 * 24),
                            )}{" "}
                            đêm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giá phòng/đêm:</span>
                          <span className="font-medium">{selectedRoom && formatPrice(selectedRoom.gia)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tổng tiền phòng:</span>
                          <span className="font-medium">
                            {selectedRoom &&
                              formatPrice(
                                Math.ceil(
                                  (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
                                  (1000 * 60 * 60 * 24),
                                ) * selectedRoom.gia,
                              )}
                          </span>
                        </div>
                        {bookingForm.dichVuDat.length > 0 && (
                          <div className="flex justify-between font-medium text-purple-700">
                            <span>Dịch vụ bổ sung:</span>
                            <span>
                              {formatPrice(
                                bookingForm.dichVuDat.reduce((total, service) => total + service.thanhTien, 0),
                              )}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-sky-200 pt-3 flex justify-between text-xl font-bold text-sky-700">
                          <span>Tổng tiền:</span>
                          <span>{formatPrice(calculateTotalPrice())}</span>
                        </div>
                        {bookingForm.phuongThucThanhToan && (
                          <div className="flex justify-between text-sm text-sky-600 bg-white/50 p-3 rounded-lg">
                            <span>Phương thức thanh toán:</span>
                            <span className="font-medium">
                              {bookingForm.phuongThucThanhToan === "TienMat"
                                ? "Tiền mặt"
                                : bookingForm.phuongThucThanhToan === "ChuyenKhoan"
                                  ? "Chuyển khoản"
                                  : "Thẻ ATM/Visa"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 h-12 text-base"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 text-base bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white"
                >
                  Xác nhận đặt phòng
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
