'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Users, Bed, DollarSign, Home, Plus, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react"
import { RoomTypeDialog } from "../compoents/RoomTypeDialog"
import Image from "next/image"
import { toast } from "sonner"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Define TypeScript interfaces
interface Room {
  maPhong: string
  tenPhong: string
}

interface RoomType {
  maLoaiPhong: string
  tenLoaiPhong: string
  soNguoi: number
  soGiuong: number
  gia_min: number
  gia_max: number
  hinhAnh?: string
  phong?: Room[]
}

interface Stats {
  totalRooms: number
  totalBeds: number
  avgCapacity: number
  maxPrice: number
}

interface DataState {
  roomTypes: RoomType[]
  stats: Stats
}

export default function RoomTypesPage() {
  const [data, setData] = useState<DataState>({
    roomTypes: [],
    stats: {
      totalRooms: 0,
      totalBeds: 0,
      avgCapacity: 0,
      maxPrice: 0
    }
  })
  
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchRoomTypes = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/admin/api/room-types`, {
       cache: 'no-store',
        headers: {
          'Cache-Control': 'max-age=3600'
        }
      })
      if (!res.ok) throw new Error("Lỗi khi tải loại phòng")
      const roomTypes: RoomType[] = await res.json()

      const stats: Stats = {
        totalRooms: roomTypes.length,
        totalBeds: roomTypes.reduce((total: number, rt: RoomType) => total + (rt.phong?.length || 0), 0),
        avgCapacity: roomTypes.length > 0 
          ? Math.round(roomTypes.reduce((total: number, rt: RoomType) => total + rt.soNguoi, 0) / roomTypes.length)
          : 0,
        maxPrice: roomTypes.length > 0 
          ? Math.max(...roomTypes.map((rt: RoomType) => rt.gia_max || 0))
          : 0
      }

      setData({ roomTypes, stats })
    } catch (err: any) {
      setError(err.message)
      toast.error("Lỗi khi tải dữ liệu", {
        description: err.message,
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (maLoaiPhong: string) => {
    const confirmDelete = window.confirm("Bạn có chắc muốn xoá loại phòng này?")
    if (!confirmDelete) return

    setDeleting(maLoaiPhong)

    try {
      const res = await fetch(`${BASE_URL}/admin/api/room-types/${maLoaiPhong}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Không thể xoá loại phòng")
      }

      // Show success toast
      toast.success("Xoá loại phòng thành công!", {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        duration: 3000
      })

      // Refresh the list by fetching fresh data
      await fetchRoomTypes()

    } catch (error) {
      console.error("Lỗi khi xoá:", error)
      toast.error("Lỗi khi xoá loại phòng", {
        description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000
      })
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    fetchRoomTypes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Đang tải...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quản lý loại phòng
            </h1>
            <p className="text-gray-600 text-lg">Quản lý và cấu hình các loại phòng trong hệ thống</p>
          </div>
          <RoomTypeDialog mode="create">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Thêm loại phòng mới
            </Button>
          </RoomTypeDialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng loại phòng</p>
                  <p className="text-3xl font-bold">{data.stats.totalRooms}</p>
                </div>
                <Home className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Tổng phòng</p>
                  <p className="text-3xl font-bold">{data.stats.totalBeds}</p>
                </div>
                <Bed className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Sức chứa trung bình</p>
                  <p className="text-3xl font-bold">{data.stats.avgCapacity}</p>
                </div>
                <Users className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Giá cao nhất</p>
                  <p className="text-2xl font-bold">{data.stats.maxPrice.toLocaleString()}đ</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Danh sách loại phòng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                    <TableHead className="font-semibold text-gray-700 py-4">Mã loại</TableHead>
                    <TableHead className="font-semibold text-gray-700">Hình ảnh</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tên loại phòng</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Số người
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        Số giường
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Giá (VNĐ)
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Số phòng</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.roomTypes.map((roomType: RoomType, index: number) => (
                    <TableRow
                      key={roomType.maLoaiPhong}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <TableCell className="font-mono font-medium text-blue-600 py-4">{roomType.maLoaiPhong}</TableCell>
                      <TableCell>
                        <div className="relative w-20 h-20">
                          {roomType.hinhAnh ? (
                            <Image
                              src={`/img/${roomType.hinhAnh}`}
                              alt={roomType.tenLoaiPhong}
                              fill
                              className="object-cover rounded-md border border-gray-200"
                              sizes="80px"
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mN8/A1AAgAB1AcgAAAAAElFTkSuQmCC"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">{roomType.tenLoaiPhong}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-600 hover:bg-blue-200">
                          {roomType.soNguoi} người
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-600 hover:bg-emerald-200">
                          {roomType.soGiuong} giường
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-800">
                            {roomType.gia_min?.toLocaleString()}đ - {roomType.gia_max?.toLocaleString()}đ
                          </div>
                          <div className="text-xs text-gray-500">
                            Trung bình: {Math.round((roomType.gia_min + roomType.gia_max) / 2).toLocaleString()}đ
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${(roomType.phong?.length || 0) > 0
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                            : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                            } font-semibold px-3 py-1`}
                        >
                          {roomType.phong?.length || 0} phòng
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <RoomTypeDialog mode="edit" roomType={roomType}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              Sửa
                            </Button>
                          </RoomTypeDialog>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(roomType.maLoaiPhong)}
                            disabled={deleting === roomType.maLoaiPhong}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === roomType.maLoaiPhong ? (
                              <>
                                <div className="w-4 h-4 mr-1 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                                Đang xoá...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Xóa
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {data.roomTypes.length === 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Home className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Chưa có loại phòng nào</h3>
                <p className="text-gray-600">Hãy thêm loại phòng đầu tiên để bắt đầu quản lý</p>
                <RoomTypeDialog mode="create">
                  <Button className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-3 mt-4">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm loại phòng đầu tiên
                  </Button>
                </RoomTypeDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}