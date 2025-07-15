"use client"

import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Trash2,
    DollarSign,
    Home,
    Plus,
    ImageIcon,
    CheckCircle,
    XCircle,
    Search,
    Activity,
    Filter,
    MoreHorizontal,
    Eye,
    Edit3,
    Bed,
    Users,
    TrendingUp,
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { RoomDialog } from "../compoents/RoomDialog"

interface Room {
    maPhong: string
    tenPhong: string
    maLoaiPhong: string
    loaiphong: { tenLoaiPhong: string }
    moTa: string
    tinhTrang?: string | null
    gia: number
    hinhAnh?: string
    bookingCount?: number // Thêm trường này
}

interface Stats {
    totalRooms: number
    availableRooms: number
    maxPrice: number
}

interface DataState {
    rooms: Room[]
    stats: Stats
}

interface DeleteConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
}

const formatVND = (amount: number | string): string => {
    const value = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(value)) return "0 VND"
    return value.toLocaleString("vi-VN") + " VND"
}

function StatusBadge({ status }: { status?: string | null }) {
    const getStatusConfig = (status?: string | null) => {
        switch (status) {
            case "Trong":
                return {
                    label: "Trống",
                    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                    icon: <CheckCircle className="w-3 h-3" />,
                }
            case "DaDat":
                return {
                    label: "Đã Đặt",
                    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
                    icon: <XCircle className="w-3 h-3" />,
                }
            case "DangDonDep":
                return {
                    label: "Đang dọn dẹp",
                    className: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
                    icon: <Activity className="w-3 h-3" />,
                }
            case "DangSuaChua":
                return {
                    label: "Đang sửa chữa",
                    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                    icon: <Activity className="w-3 h-3" />,
                }
            default:
                return {
                    label: "Không xác định",
                    className: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
                    icon: <Activity className="w-3 h-3" />,
                }
        }
    }

    const config = getStatusConfig(status?.trim())

    return (
        <Badge variant="outline" className={`${config.className} font-medium px-3 py-1 flex items-center gap-1.5`}>
            {config.icon}
            {config.label}
        </Badge>
    )
}

function DeleteConfirmDialog({ open, onClose, onConfirm }: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">Xác nhận xóa phòng</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                        Bạn có chắc chắn muốn xóa phòng này không? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-11 bg-transparent">
                        Hủy bỏ
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} className="flex-1 h-11 bg-red-600 hover:bg-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa phòng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ViewDetailsDialog({
    open,
    onClose,
    room,
}: {
    open: boolean
    onClose: () => void
    room: Room | null
}) {
    if (!room) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Chi tiết phòng: {room.tenPhong}</DialogTitle>
                    <DialogDescription>Thông tin chi tiết về phòng {room.maPhong}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                            {room.hinhAnh ? (
                                <Image
                                    src={`/img/rooms/${room.hinhAnh}`}
                                    alt={room.tenPhong}
                                    fill
                                    className="object-cover"
                                    sizes="128px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Mã phòng: {room.maPhong}</p>
                            <p className="text-gray-600">Loại phòng: {room.loaiphong.tenLoaiPhong}</p>
                        </div>
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">Mô tả:</p>
                        <p className="text-gray-600">{room.moTa}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">Tình trạng:</p>
                        <StatusBadge status={room.tinhTrang} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">Giá phòng:</p>
                        <p className="text-gray-600">{formatVND(room.gia)}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-700">Số lượng đơn đặt phòng:</p>
                        <p className="text-gray-600">{room.bookingCount ?? 0} đơn</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="w-full">
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function RoomsPage() {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const [data, setData] = useState<DataState>({
        rooms: [],
        stats: {
            totalRooms: 0,
            availableRooms: 0,
            maxPrice: 0,
        },
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [editRoom, setEditRoom] = useState<Room | undefined>(undefined)
    const [viewRoom, setViewRoom] = useState<Room | null>(null)

    const filteredRooms = useMemo(() => {
        if (!searchTerm.trim()) return data.rooms
        const searchLower = searchTerm.toLowerCase().trim()
        return data.rooms.filter(
            (room) =>
                room.maPhong.toLowerCase().includes(searchLower) ||
                room.tenPhong.toLowerCase().includes(searchLower) ||
                room.loaiphong.tenLoaiPhong.toLowerCase().includes(searchLower)
        )
    }, [data.rooms, searchTerm])

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${BASE_URL}/admin/api/rooms`, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-store",
                },
            })
            if (!res.ok) throw new Error("Lỗi khi tải danh sách phòng")
            const rooms: Room[] = await res.json()
            const stats: Stats = {
                totalRooms: rooms.length,
                availableRooms: rooms.filter((room) => room.tinhTrang === "Trong").length,
                maxPrice: rooms.length > 0 ? Math.max(...rooms.map((r: Room) => r.gia || 0)) : 0,
            }
            setData({ rooms, stats })
        } catch (err: any) {
            setError(err.message)
            toast.error("Lỗi khi tải dữ liệu", {
                description: err.message,
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmDelete = async () => {
        if (!confirmDeleteId) return
        setDeleting(confirmDeleteId)
        try {
            const res = await fetch(`${BASE_URL}/admin/api/rooms/${confirmDeleteId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Không thể xóa phòng")
            }
            toast.success("Xóa phòng thành công!", {
                icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })
            await fetchRooms()
        } catch (error) {
            toast.error("Lỗi khi xóa phòng", {
                description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setDeleting(null)
            setConfirmDeleteId(null)
        }
    }

    const handleViewDetails = async (maPhong: string) => {
        try {
            const res = await fetch(`${BASE_URL}/admin/api/rooms/${maPhong}`, {
                cache: "no-store",
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Lỗi khi tải chi tiết phòng")
            }
            const room: Room = await res.json()
            console.log("Room details:", room) // Debug log
            setViewRoom(room)
        } catch (error) {
            toast.error("Lỗi khi tải chi tiết phòng", {
                description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        }
    }

    const handleEditRoom = (room: Room) => {
        console.log("Editing room:", room) // Debug log
        setEditRoom(room)
    }

    useEffect(() => {
        fetchRooms()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h3>
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={fetchRooms} className="mt-4">
                        Thử lại
                    </Button>
                </div>
            </div>
        )
    }

    const occupancyRate =
        data.stats.totalRooms > 0
            ? (((data.stats.totalRooms - data.stats.availableRooms) / data.stats.totalRooms) * 100).toFixed(1)
            : 0

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Home className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng</h1>
                                    <p className="text-gray-600 mt-1">Quản lý và theo dõi tình trạng các phòng</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="h-10 bg-transparent">
                                <Filter className="w-4 h-4 mr-2" />
                                Bộ lọc
                            </Button>
                            <RoomDialog mode="create" onSuccess={fetchRooms}>
                                <Button className="h-10 bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Thêm phòng
                                </Button>
                            </RoomDialog>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-600">Tổng số phòng</p>
                                    <p className="text-3xl font-bold text-gray-900">{data.stats.totalRooms}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Tất cả phòng
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Home className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-600">Phòng trống</p>
                                    <p className="text-3xl font-bold text-emerald-600">{data.stats.availableRooms}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Sẵn sàng đón khách
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Bed className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-600">Tỷ lệ lấp đầy</p>
                                    <p className="text-3xl font-bold text-amber-600">{occupancyRate}%</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Phòng đã đặt
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-600">Giá cao nhất</p>
                                    <p className="text-2xl font-bold text-purple-600">{formatVND(data.stats.maxPrice)}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Phòng VIP
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Tìm kiếm theo mã phòng, tên phòng hoặc loại phòng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {searchTerm && (
                                    <Badge variant="secondary" className="px-3 py-1">
                                        {filteredRooms.length} kết quả
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Home className="w-5 h-5 text-blue-600" />
                                Danh sách phòng
                                {searchTerm && (
                                    <Badge variant="outline" className="ml-2 font-normal">
                                        {filteredRooms.length} kết quả
                                    </Badge>
                                )}
                            </CardTitle>
                            <div className="text-sm text-gray-500">Tổng cộng {data.stats.totalRooms} phòng</div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredRooms.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Phòng</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Loại phòng</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Tình trạng</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Giá phòng</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-center w-24">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRooms.map((room: Room, index: number) => (
                                            <TableRow key={room.maPhong} className="hover:bg-gray-50/50 transition-colors duration-150">
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            {room.hinhAnh ? (
                                                                <Image
                                                                    src={`/img/rooms/${room.hinhAnh}`}
                                                                    alt={room.tenPhong}
                                                                    fill
                                                                    className="object-cover"
                                                                    sizes="64px"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 truncate">{room.tenPhong}</p>
                                                            <p className="text-sm text-gray-500 font-mono">{room.maPhong}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-medium">
                                                        {room.loaiphong.tenLoaiPhong}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <p className="text-gray-600 truncate" title={room.moTa}>
                                                        {room.moTa.length > 50 ? `${room.moTa.substring(0, 50)}...` : room.moTa}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="min-w-[120px]">
                                                    <StatusBadge status={room.tinhTrang} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-gray-900">{formatVND(room.gia)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => handleViewDetails(room.maPhong)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Xem chi tiết
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => handleEditRoom(room)}
                                                            >
                                                                <Edit3 className="w-4 h-4 mr-2" />
                                                                Chỉnh sửa
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                                onClick={() => setConfirmDeleteId(room.maPhong)}
                                                                disabled={deleting === room.maPhong}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Xóa phòng
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        {searchTerm ? (
                                            <Search className="w-8 h-8 text-gray-400" />
                                        ) : (
                                            <Home className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {searchTerm ? "Không tìm thấy kết quả" : "Chưa có phòng nào"}
                                        </h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            {searchTerm
                                                ? `Không có phòng nào phù hợp với từ khóa "${searchTerm}"`
                                                : "Hãy thêm phòng đầu tiên để bắt đầu quản lý khách sạn của bạn"}
                                        </p>
                                    </div>
                                    {searchTerm ? (
                                        <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                                            Xóa bộ lọc
                                        </Button>
                                    ) : (
                                        <RoomDialog mode="create" onSuccess={fetchRooms}>
                                            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Thêm phòng đầu tiên
                                            </Button>
                                        </RoomDialog>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmDialog
                open={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleConfirmDelete}
            />

            <ViewDetailsDialog
                open={!!viewRoom}
                onClose={() => setViewRoom(null)}
                room={viewRoom}
            />

            {editRoom && (
                <RoomDialog
                    mode="edit"
                    room={editRoom}
                    onSuccess={() => {
                        fetchRooms()
                        setEditRoom(undefined)
                    }}
                />
            )}
        </div>
    )
}