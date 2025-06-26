'use client'
import React from 'react'
import Image from "next/image"
import { ArrowRight, ChevronRight, Eye, Sparkles, Star } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export interface RoomTypeProps {
  maLoaiPhong: string // Thêm để dùng cho URL chi tiết
  tenLoaiPhong: string
  moTa: string
  hinhAnh: string
  price?: number
  originalPrice?: number
  priceRange?: { min: number; max: number } // Thêm để hiển thị khoảng giá
  amenities?: string[]
  rating?: number
  isPopular?: boolean
}

function RoomType({
  maLoaiPhong,
  tenLoaiPhong,
  moTa,
  hinhAnh,
  price,
  originalPrice,
  priceRange,
  amenities,
  rating,
  isPopular,
}: RoomTypeProps) {

  // Hàm định dạng giá
  const formatPrice = (value: number) => value.toLocaleString("vi-VN") + " VND"
  const formatPriceRange = (range: { min: number; max: number }) =>
    `từ ${formatPrice(range.min)} đến ${formatPrice(range.max)}`

  return (
    <Card className="w-full h-full overflow-hidden transition-all hover:shadow-xl group p-0 border-0 rounded-xl">
      <div className="relative h-64 w-full overflow-hidden rounded-t-xl">
        <Image
          src={`/img/${hinhAnh || "placeholder.svg"}`}
          alt={tenLoaiPhong}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        {isPopular && (
          <Badge className="absolute top-4 left-4 bg-orange-500 hover:bg-orange-600">
            Phổ Biến
          </Badge>
        )}
        {rating && (
          <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{rating}</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-white rounded-b-xl">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">{tenLoaiPhong}</h3>
          <p className="text-gray-600 text-sm">{moTa}</p>
        </div>

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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                {priceRange ? (
                  <span className="text-2xl font-bold text-sky-600">
                    {formatPriceRange(priceRange)}
                  </span>
                ) : (
                  <>
                    <span className="text-2xl font-bold text-sky-600">
                      {price ? formatPrice(price) : "Liên hệ"}
                    </span>
                    {originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </>
                )}
              </div>
              <span className="text-sm text-muted-foreground">/ đêm</span>
            </div>
          </div>
        </div>
      </div>


      <CardFooter className="p-6 pt-0">
        <Button
          asChild
          variant="default"
          className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 w-full px-8 py-4 text-lg rounded-xl shadow-xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl ring-2 ring-purple-400/40 hover:ring-purple-500/70 group"
        >
          <Link href={`/rooms/RoomType/${maLoaiPhong}`} className="flex items-center justify-center gap-2 relative z-10">
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