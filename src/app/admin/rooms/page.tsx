"use client"

import { useState, useEffect } from "react"
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
import { useDebounce } from "@/lib/hooks/useDebounce"
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
    MoreHorizontal,
    Eye,
    Edit3,
    Bed,
    Users,
    ArrowUpDown,
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
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
    bookingCount?: number
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
                    className:
                        "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-emerald-300 hover:from-emerald-200 hover:to-emerald-300",
                    icon: <CheckCircle className="w-3 h-3" />,
                }
            case "DaDat":
                return {
                    label: "Đã Đặt",
                    className:
                        "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300 hover:from-red-200 hover:to-red-300",
                    icon: <XCircle className="w-3 h-3" />,
                }
            case "DangDonDep":
                return {
                    label: "Đang dọn dẹp",
                    className:
                        "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-amber-300 hover:from-amber-200 hover:to-amber-300",
                    icon: <Activity className="w-3 h-3" />,
                }
            case "DangSuaChua":
                return {
                    label: "Đang sửa chữa",
                    className:
                        "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-300 hover:from-orange-200 hover:to-orange-300",
                    icon: <Activity className="w-3 h-3" />,
                }
            default:
                return {
                    label: "Không xác định",
                    className:
                        "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 hover:from-gray-200 hover:to-gray-300",
                    icon: <Activity className="w-3 h-3" />,
                }
        }
    }

    const config = getStatusConfig(status?.trim())
    return (
        <Badge
            variant="outline"
            className={`${config.className} font-medium px-3 py-1 flex items-center gap-1.5 shadow-sm`}
        >
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
                    <div className="mx-auto w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">Xác nhận xóa phòng</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                        Bạn có chắc chắn muốn xóa phòng này không? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên
                        quan.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={onClose} className="flex-1 h-11 bg-transparent">
                        Hủy bỏ
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="flex-1 h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    >
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
    if (!room) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Chi tiết phòng: {room.tenPhong}
                    </DialogTitle>
                    <DialogDescription>Thông tin chi tiết về phòng {room.maPhong}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
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
                    <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
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
    const [page, setPage] = useState<number>(1)
    const pageSize = 10
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
    const [totalCount, setTotalCount] = useState(0)
    const totalPages = Math.ceil(totalCount / pageSize)

    const debouncedSearch = useDebounce(searchTerm, 500)

    const fetchRooms = async () => {
        try {
            setLoading(true)
            const url = new URL(`${BASE_URL}/admin/api/rooms`)
            url.searchParams.append("page", page.toString())
            url.searchParams.append("pageSize", pageSize.toString())
            // ✅ Dùng debouncedSearch thay vì searchTerm
            if (debouncedSearch) {
                url.searchParams.append("search", encodeURIComponent(debouncedSearch))
            }
            if (sortOrder) {
                url.searchParams.append("sortBy", "gia")
                url.searchParams.append("sortOrder", sortOrder)
            }

            console.log("Fetching rooms with URL:", url.toString())
            const res = await fetch(url.toString(), {
                cache: "no-store",
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Lỗi khi tải danh sách phòng")
            }

            const { rooms, totalRooms }: { rooms: Room[]; totalRooms: number } = await res.json()
            console.log("Received rooms:", rooms)

            const stats: Stats = {
                totalRooms: totalRooms,
                availableRooms: rooms.filter((room) => room.tinhTrang === "Trong").length,
                maxPrice: rooms.length > 0 ? Math.max(...rooms.map((r: Room) => r.gia || 0)) : 0,
            }

            setData({ rooms, stats })
            setTotalCount(totalRooms)
        } catch (err: any) {
            console.error("Error fetching rooms:", err)
            setError(err.message)
            toast.error("Lỗi khi tải dữ liệu", {
                description: err.message,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSort = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        setPage(1)
    }

    useEffect(() => {
        setPage(1)
    }, [searchTerm])

    useEffect(() => {
        fetchRooms()
    }, [page, debouncedSearch, sortOrder])

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
        setEditRoom(room)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h3>
                    <p className="text-gray-600">{error}</p>
                    <Button
                        onClick={fetchRooms}
                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <Home className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Quản lý phòng
                                    </h1>
                                    <p className="text-gray-600 mt-1 text-lg">Quản lý và theo dõi tình trạng các phòng</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <RoomDialog mode="create" onSuccess={fetchRooms}>
                                <Button className="h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Thêm phòng mới
                                </Button>
                            </RoomDialog>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-blue-100 text-sm font-medium">Tổng số phòng</p>
                                    <p className="text-3xl font-bold">{data.stats.totalRooms}</p>
                                    <p className="text-blue-200 text-xs flex items-center gap-1">
                                        <Home className="w-3 h-3" />
                                        Tất cả phòng
                                    </p>
                                </div>
                                <Home className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-emerald-100 text-sm font-medium">Phòng trống</p>
                                    <p className="text-3xl font-bold">{data.stats.availableRooms}</p>
                                    <p className="text-emerald-200 text-xs flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Sẵn sàng đón khách
                                    </p>
                                </div>
                                <Bed className="w-8 h-8 text-emerald-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-amber-100 text-sm font-medium">Tỷ lệ lấp đầy</p>
                                    <p className="text-3xl font-bold">{occupancyRate}%</p>
                                    <p className="text-amber-200 text-xs flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Phòng đã đặt
                                    </p>
                                </div>
                                <Activity className="w-8 h-8 text-amber-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-purple-100 text-sm font-medium">Giá cao nhất</p>
                                    <p className="text-2xl font-bold">{data.stats.maxPrice.toLocaleString("vi-VN")} VND</p>
                                    <p className="text-purple-200 text-xs flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Phòng VIP
                                    </p>
                                </div>
                                <DollarSign className="w-8 h-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Card */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Tìm kiếm theo mã phòng hoặc loại phòng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className={`h-11 w-11 p-0 shadow-sm ${sortOrder ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-300" : "bg-transparent"}`}
                                    onClick={handleSort}
                                    title={sortOrder === "asc" ? "Sắp xếp giá giảm dần" : "Sắp xếp giá tăng dần"}
                                >
                                    <ArrowUpDown className={`w-5 h-5 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                                </Button>
                                {searchTerm && (
                                    <Badge
                                        variant="secondary"
                                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700"
                                    >
                                        {data.rooms.length} kết quả
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Home className="w-5 h-5 text-blue-600" />
                                Danh sách phòng
                                {searchTerm && (
                                    <Badge
                                        variant="outline"
                                        className="ml-2 font-normal bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-300"
                                    >
                                        {data.rooms.length} kết quả
                                    </Badge>
                                )}
                            </CardTitle>
                            <div className="text-sm text-gray-500">Tổng cộng {data.stats.totalRooms} phòng</div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {data.rooms.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                                            <TableHead className="font-semibold text-gray-700 py-4 px-6">Phòng</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Loại phòng</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Tình trạng</TableHead>
                                            <TableHead className="font-semibold text-gray-700">Giá phòng</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-center w-24">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.rooms.map((room: Room, index: number) => (
                                            <TableRow
                                                key={room.maPhong}
                                                className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                                            >
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 border border-gray-200">
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
                                                            <p className="text-sm text-blue-600 font-mono">{room.maPhong}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="font-medium bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                    >
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
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100"
                                                            >
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-blue-600 hover:bg-blue-50 focus:bg-blue-100"
                                                                onClick={() => handleViewDetails(room.maPhong)}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Xem chi tiết
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-amber-600 hover:bg-amber-50 focus:bg-amber-100"
                                                                onClick={() => handleEditRoom(room)}
                                                            >
                                                                <Edit3 className="w-4 h-4 mr-2" />
                                                                Chỉnh sửa
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-100"
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
                                <div className="flex justify-between items-center px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
                                    <div className="text-sm text-gray-600">
                                        Trang {page} / {totalPages} – {totalCount} phòng
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage(1)}
                                            className="shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                                        >
                                            <ChevronsLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                            className="shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                            className="shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(totalPages)}
                                            className="shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                                        >
                                            <ChevronsRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                        {searchTerm ? (
                                            <Search className="w-8 h-8 text-gray-500" />
                                        ) : (
                                            <Home className="w-8 h-8 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-semibold text-gray-700">
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
                                            <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3">
                                                <Plus className="w-5 h-5 mr-2" />
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

            <ViewDetailsDialog open={!!viewRoom} onClose={() => setViewRoom(null)} room={viewRoom} />

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
