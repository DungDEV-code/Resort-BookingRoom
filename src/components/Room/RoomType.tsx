"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles, Star } from "lucide-react"
import { Card, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface RoomTypeProps {
  maLoaiPhong: string
  tenLoaiPhong: string
  moTa: string
  hinhAnh: string
  priceRange: { min: number; max: number }
  amenities?: string[]
  rating?: number
  isPopular?: boolean
}

function RoomType({
  maLoaiPhong,
  tenLoaiPhong,
  moTa,
  hinhAnh,
  priceRange,
  amenities,
  rating,
  isPopular,
}: RoomTypeProps) {
  // Format a single price value with Vietnamese number format (dots as separators)
  const formatPrice = (value: number, includeCurrency: boolean = false) => {
    const formatter = new Intl.NumberFormat("vi-VN", {
      useGrouping: true,
    })
    return `${formatter.format(value)}${includeCurrency ? " VND" : ""}`
  }
  
  // Format the price range: min without VND, max with VND
  const formatPriceRange = (range: { min: number; max: number }) =>
    `${formatPrice(range.min)} - ${formatPrice(range.max, true)}`

  return (
    <Card className="w-full h-full overflow-hidden transition-all hover:shadow-xl group p-0 border-0 rounded-xl">
      {/* Ảnh loại phòng */}
      <div className="relative h-64 w-full overflow-hidden rounded-t-xl">
        <Image
          src={`/img/${hinhAnh || "placeholder.svg"}`}
          alt={tenLoaiPhong}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        {isPopular && <Badge className="absolute top-4 left-4 bg-orange-500 hover:bg-orange-600">Phổ Biến</Badge>}
        {rating && (
          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{rating}</span>
          </div>
        )}
      </div>

      {/* Thông tin */}
      <div className="p-6 bg-white rounded-b-xl">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">{tenLoaiPhong}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{moTa}</p>
        </div>

        {/* Tiện ích */}
        <div className="space-y-4">
          {amenities && amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          )}

          {/* Giá */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-sky-600">{formatPriceRange(priceRange)}</span>
              <span className="block text-sm text-muted-foreground">/ đêm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nút xem chi tiết */}
      <CardFooter className="p-6 pt-0">
        <Button
          asChild
          variant="default"
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 w-full px-8 py-4 text-lg rounded-xl shadow-xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ring-2 ring-purple-400/40 hover:ring-purple-500/70 group"
        >
          <Link
            href={`/rooms/RoomType/${maLoaiPhong}`}
            className="flex items-center justify-center gap-2 relative z-10"
          >
            <span className="relative z-10">Xem Chi Tiết</span>
            <Sparkles className="h-5 w-5 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default RoomType