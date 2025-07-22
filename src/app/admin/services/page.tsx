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
import { Trash2, DollarSign, Package, Plus, ImageIcon, CheckCircle, XCircle, Search, Activity, Pencil } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { ServiceDialog } from "../components/ServicesDialog"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Define TypeScript interfaces
interface Service {
    maDV: string
    tenDV: string
    moTaDV: string
    giaDV: number
    anhDV?: string
}

interface Stats {
    totalServices: number
    activeServices: number
    maxPrice: number
}

interface DataState {
    services: Service[]
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
                        Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.
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

// Format currency to VND
const formatVND = (amount: number | string): string => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount
    if (isNaN(value)) return "0 VND"
    return value.toLocaleString("vi-VN") + " VND"
}

export default function ServicesPage() {
    const [data, setData] = useState<DataState>({
        services: [],
        stats: {
            totalServices: 0,
            activeServices: 0,
            maxPrice: 0,
        },
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Filter services based on search term
    const filteredServices = useMemo(() => {
        if (!searchTerm.trim()) return data.services

        const searchLower = searchTerm.toLowerCase().trim()
        return data.services.filter(
            (service) =>
                service.maDV.toLowerCase().includes(searchLower) || service.tenDV.toLowerCase().includes(searchLower),
        )
    }, [data.services, searchTerm])

    const fetchServices = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${BASE_URL}/admin/api/services`, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "max-age=3600",
                },
            })
            if (!res.ok) throw new Error("Lỗi khi tải dịch vụ")
            const services: Service[] = await res.json()

            const stats: Stats = {
                totalServices: services.length,
                activeServices: services.length, // Assuming all services are active, you can modify this logic
                maxPrice: services.length > 0 ? Math.max(...services.map((s: Service) => s.giaDV || 0)) : 0,
            }

            setData({ services, stats })
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
            const res = await fetch(`${BASE_URL}/admin/api/services/${confirmDeleteId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Không thể xóa dịch vụ")
            }
            toast.success("Xóa dịch vụ thành công!", {
                icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })
            await fetchServices()
        } catch (error) {
            toast.error("Lỗi khi xóa dịch vụ", {
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
        fetchServices()
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
                            Quản lý dịch vụ
                        </h1>
                        <p className="text-gray-600 text-lg">Quản lý và cấu hình các dịch vụ trong hệ thống</p>
                    </div>
                    <ServiceDialog mode="create">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
                            <Plus className="w-5 h-5 mr-2" />
                            Thêm dịch vụ mới
                        </Button>
                    </ServiceDialog>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Tổng dịch vụ</p>
                                    <p className="text-3xl font-bold">{data.stats.totalServices}</p>
                                </div>
                                <Package className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">Dịch vụ hoạt động</p>
                                    <p className="text-3xl font-bold">{data.stats.activeServices}</p>
                                </div>
                                <Activity className="w-8 h-8 text-emerald-200" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Giá cao nhất</p>
                                    <p className="text-3xl font-bold">{formatVND(data.stats.maxPrice)}</p>
                                </div>
                                <DollarSign className="w-8 h-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Section */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Tìm kiếm theo mã dịch vụ hoặc tên dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                            />
                        </div>
                        {searchTerm && (
                            <div className="mt-3 text-sm text-gray-600">
                                Tìm thấy <span className="font-semibold text-blue-600">{filteredServices.length}</span> kết quả cho "
                                {searchTerm}"
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            Danh sách dịch vụ
                            {searchTerm && (
                                <Badge variant="secondary" className="ml-2">
                                    {filteredServices.length} kết quả
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                                        <TableHead className="font-semibold text-gray-700 py-4">Mã dịch vụ</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Hình ảnh</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Tên dịch vụ</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="w-4 h-4" />
                                                Giá
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service: Service, index: number) => (
                                        <TableRow
                                            key={service.maDV}
                                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                                        >
                                            <TableCell className="font-mono font-medium text-blue-600 py-4">{service.maDV}</TableCell>
                                            <TableCell>
                                                <div className="relative w-20 h-20">
                                                    {service.anhDV ? (
                                                        <Image
                                                            src={`/img/services/${service.anhDV}`}
                                                            alt={service.tenDV}
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
                                            <TableCell className="font-semibold text-gray-800">{service.tenDV}</TableCell>
                                            <TableCell className="text-gray-600">
                                                {service.moTaDV.length > 20 ? `${service.moTaDV.substring(0, 20)}...` : service.moTaDV}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-600 hover:bg-emerald-200">
                                                    {formatVND(service.giaDV)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center space-x-2">
                                                    <ServiceDialog mode="edit" service={service}>
                                                        <Button
                                                            size="sm"
                                                            className="bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                                        >
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Sửa
                                                        </Button>
                                                    </ServiceDialog>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setConfirmDeleteId(service.maDV)}
                                                        disabled={deleting === service.maDV}
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

                {/* Empty State */}
                {filteredServices.length === 0 && !searchTerm && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <Package className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Chưa có dịch vụ nào</h3>
                                <p className="text-gray-600">Hãy thêm dịch vụ đầu tiên để bắt đầu quản lý</p>
                                <ServiceDialog mode="create">
                                    <Button className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-3 mt-4">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Thêm dịch vụ đầu tiên
                                    </Button>
                                </ServiceDialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Search Results */}
                {filteredServices.length === 0 && searchTerm && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <Search className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy kết quả</h3>
                                <p className="text-gray-600">Không có dịch vụ nào phù hợp với từ khóa "{searchTerm}"</p>
                                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                                    Xóa bộ lọc
                                </Button>
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
