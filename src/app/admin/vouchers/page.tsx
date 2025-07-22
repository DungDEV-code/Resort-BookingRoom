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
import { Trash2, Percent, Calendar, Gift, Plus, CheckCircle, XCircle, Pencil, Clock } from "lucide-react"
import { toast } from "sonner"
import { VoucherDialog } from "../components/VoucherDialog"


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Define TypeScript interfaces
interface Voucher {
    maVoucher: string
    tenVoucher: string
    moTa: string
    phanTramGiam: number
    ngayBatDau: string
    ngayKetThuc: string
    dieuKienApDung: string
    trangThai: string
}

interface Stats {
    totalVouchers: number
    activeVouchers: number
    avgDiscount: number
    expiringSoon: number
}

interface DataState {
    vouchers: Voucher[]
    stats: Stats
}

interface DeleteConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
}

function DeleteConfirmDialog({ open, onClose, onConfirm }: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận xóa</DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn xóa voucher này? Hành động này không thể hoàn tác.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white"
                    >
                        Xóa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function getStatusBadge(voucher: Voucher) {
    const now = new Date()
    const startDate = new Date(voucher.ngayBatDau)
    const endDate = new Date(voucher.ngayKetThuc)

    if (voucher.trangThai === "HetHieuLuc") {
        return <Badge className="bg-gray-500 text-white">Hết hiệu lực</Badge>
    }

    if (now < startDate) {
        return <Badge className="bg-blue-500 text-white">Chưa bắt đầu</Badge>
    }

    if (now > endDate) {
        return <Badge className="bg-red-500 text-white">Đã hết hạn</Badge>
    }

    // Check if expiring soon (within 7 days)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry <= 7) {
        return <Badge className="bg-orange-500 text-white">Sắp hết hạn</Badge>
    }

    return <Badge className="bg-green-500 text-white">Đang hoạt động</Badge>
}

export default function VouchersPage() {
    const [data, setData] = useState<DataState>({
        vouchers: [],
        stats: {
            totalVouchers: 0,
            activeVouchers: 0,
            avgDiscount: 0,
            expiringSoon: 0,
        },
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const fetchVouchers = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${BASE_URL}/admin/api/vouchers`, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache",
                },
            })

            if (!res.ok) throw new Error("Lỗi khi tải voucher")

            const response = await res.json()
            const vouchers: Voucher[] = response.success ? response.data : []

            // Calculate stats
            const now = new Date()
            const activeVouchers = vouchers.filter((v) => {
                const startDate = new Date(v.ngayBatDau)
                const endDate = new Date(v.ngayKetThuc)
                return v.trangThai === "ConHieuLuc" && now >= startDate && now <= endDate
            }).length

            const expiringSoon = vouchers.filter((v) => {
                const endDate = new Date(v.ngayKetThuc)
                const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                return v.trangThai === "ConHieuLuc" && daysUntilExpiry <= 7 && daysUntilExpiry > 0
            }).length

            const avgDiscount =
                vouchers.length > 0 ? Math.round(vouchers.reduce((total, v) => total + v.phanTramGiam, 0) / vouchers.length) : 0

            const stats: Stats = {
                totalVouchers: vouchers.length,
                activeVouchers,
                avgDiscount,
                expiringSoon,
            }

            setData({ vouchers, stats })
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
            const res = await fetch(`${BASE_URL}/admin/api/vouchers/${confirmDeleteId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.message || "Không thể xóa voucher")
            }

            toast.success("Xóa voucher thành công!", {
                icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })

            await fetchVouchers()
        } catch (error) {
            toast.error("Lỗi khi xóa voucher", {
                description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setDeleting(null)
            setConfirmDeleteId(null)
        }
    }

    useEffect(() => {
        fetchVouchers()
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
                            Quản lý ưu đãi
                        </h1>
                        <p className="text-gray-600 text-lg">Quản lý và cấu hình các voucher ưu đãi trong hệ thống</p>
                    </div>
                    <VoucherDialog mode="create" onSuccess={fetchVouchers}>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
                            <Plus className="w-5 h-5 mr-2" />
                            Thêm voucher mới
                        </Button>
                    </VoucherDialog>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Tổng voucher</p>
                                    <p className="text-3xl font-bold">{data.stats.totalVouchers}</p>
                                </div>
                                <Gift className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">Đang hoạt động</p>
                                    <p className="text-3xl font-bold">{data.stats.activeVouchers}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-emerald-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-amber-100 text-sm font-medium">Giảm giá trung bình</p>
                                    <p className="text-3xl font-bold">{data.stats.avgDiscount}%</p>
                                </div>
                                <Percent className="w-8 h-8 text-amber-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500 to-pink-500 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-sm font-medium">Sắp hết hạn</p>
                                    <p className="text-3xl font-bold">{data.stats.expiringSoon}</p>
                                </div>
                                <Clock className="w-8 h-8 text-red-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-blue-600" />
                            Danh sách voucher
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                                        <TableHead className="font-semibold text-gray-700 py-4">Mã voucher</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Tên voucher</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <Percent className="w-4 h-4" />
                                                Giảm giá
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Thời gian
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">Điều kiện</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.vouchers.map((voucher: Voucher, index: number) => (
                                        <TableRow
                                            key={voucher.maVoucher}
                                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                }`}
                                        >
                                            <TableCell className="font-mono font-medium text-blue-600 py-4">{voucher.maVoucher}</TableCell>
                                            <TableCell className="font-semibold text-gray-800">{voucher.tenVoucher}</TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="truncate text-gray-600" title={voucher.moTa}>
                                                    {voucher.moTa}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold">
                                                    {voucher.phanTramGiam}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <div className="text-gray-600">
                                                        <span className="font-medium">Từ:</span> {formatDate(voucher.ngayBatDau)}
                                                    </div>
                                                    <div className="text-gray-600">
                                                        <span className="font-medium">Đến:</span> {formatDate(voucher.ngayKetThuc)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-gray-600">
                                                    {Number(voucher.dieuKienApDung).toLocaleString("vi-VN")} VND
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(voucher)}</TableCell>
                                            <TableCell>
                                                <div className="flex justify-center space-x-2">
                                                    <VoucherDialog mode="edit" voucher={voucher} onSuccess={fetchVouchers}>
                                                        <Button
                                                            size="sm"
                                                            className="bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                                        >
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Sửa
                                                        </Button>
                                                    </VoucherDialog>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setConfirmDeleteId(voucher.maVoucher)}
                                                        disabled={deleting === voucher.maVoucher}
                                                        className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-1" />
                                                        Xóa
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

                {data.vouchers.length === 0 && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <Gift className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Chưa có voucher nào</h3>
                                <p className="text-gray-600">Hãy thêm voucher đầu tiên để bắt đầu quản lý ưu đãi</p>
                                <VoucherDialog mode="create" onSuccess={fetchVouchers}>
                                    <Button className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-3 mt-4">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Thêm voucher đầu tiên
                                    </Button>
                                </VoucherDialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <DeleteConfirmDialog
                    open={!!confirmDeleteId}
                    onClose={() => setConfirmDeleteId(null)}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </div>
    )
}
