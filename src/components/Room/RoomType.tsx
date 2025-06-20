'use client'
import React from 'react'
import Image from "next/image"
import { ArrowRight, Star } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
export interface RoomTypeProps {
  // maLoaiPhong: string
  tenLoaiPhong: string
  moTa: string
  hinhAnh: string
  price?: number;
  originalPrice?: number;
  amenities?: string[];
  rating?: number;
  isPopular?: boolean;

}
function RoomType(
  {
    // maLoaiPhong,
    tenLoaiPhong,
    moTa,
    hinhAnh,
    price,
    originalPrice,
    amenities,
    rating,
    isPopular
  }: RoomTypeProps) {

  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-xl group">
      <div className="relative h-64 w-full overflow-hidden">
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
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-medium">{rating}</span>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-xl">{tenLoaiPhong}</CardTitle>
        <CardDescription>{moTa}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {amenities?.map((amenity, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-sky-600">
                  {price?.toLocaleString("vi-VN")}₫
                </span>
                {originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {originalPrice.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">/ đêm</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

  )
}

export default RoomType