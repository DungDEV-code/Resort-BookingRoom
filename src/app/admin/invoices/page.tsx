"use client"

import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
    RefreshCw,
    AlertCircle,
    Receipt,
    Hash,
    DollarSign,
    Calendar,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Edit,
    RotateCcw,
} from "lucide-react"

// Hàm chuẩn hóa chuỗi tiếng Việt
function removeDiacritics(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
}

interface Invoice {
    maHD: string
    phuongThucThanhToan: string
    trangThaiHD: string
    tongTien: number
    ngayTaoHD: string
    maDatPhong: string
}

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalInvoices, setTotalInvoices] = useState(0)
    const [limit] = useState(7)
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    // Hàm lấy danh sách hóa đơn
    const fetchInvoices = async (page: number = 1, search: string = "") => {
        setLoading(true)
        setError(null)
        try {
            const url = new URL(`${BASE_URL}/admin/api/invoices`)
            url.searchParams.set("page", page.toString())
            url.searchParams.set("limit", limit.toString())
            if (search) {
                url.searchParams.set("search", search)
            }

            const response = await fetch(url, {
                headers: {
                    "Cache-Control": "no-store",
                },
            })
            const data = await response.json()

            if (response.ok && data.success && Array.isArray(data.data)) {
                setInvoices(data.data)
                setTotalPages(data.pagination.totalPages)
                setCurrentPage(data.pagination.currentPage)
                setTotalInvoices(data.pagination.totalInvoices)
            } else {
                throw new Error("Invalid invoices response")
            }
        } catch (err: any) {
            console.error("Error fetching invoices:", err)
            setError("Không thể tải danh sách hóa đơn")
            setInvoices([])
            toast.error("Lỗi hệ thống khi tải hóa đơn!")
        } finally {
            setLoading(false)
        }
    }

    // Tải dữ liệu khi trang hoặc tìm kiếm thay đổi
    useEffect(() => {
        fetchInvoices(currentPage, searchTerm)
    }, [currentPage, searchTerm])

    const handleRefresh = () => {
        setSearchTerm("")
        setCurrentPage(1)
        fetchInvoices(1, "")
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setCurrentPage(1) // Reset về trang 1 khi tìm kiếm
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return isNaN(date.getTime())
            ? "N/A"
            : date.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            })
    }

    const formatCurrency = (amount: number) => new Intl.NumberFormat("vi-VN").format(amount)

    const renderStatus = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            DaThanhToan: {
                label: "Đã thanh toán",
                className: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200",
            },
            ChuaThanhToan: {
                label: "Chưa thanh toán",
                className: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200",
            },
            Huy: {
                label: "Đã hủy",
                className: "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200",
            },
              DaHoanTien: {
              
                className: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700",
                label: "Đã hoàn tiền",
            }
        }

        const config = statusConfig[status] || {
            label: status,
            className: "bg-gray-100 text-gray-700 border-gray-200",
        }

        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        )
    }

    const renderPaymentMethod = (method: string) => {
        const methodConfig: Record<
            string,
            { icon: React.ReactNode; className: string; label: string }
        > = {
            TienMat: {
                icon: <DollarSign className="h-3 w-3" />,
                className: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700",
                label: "Tiền mặt",
            },
            ChuyenKhoan: {
                icon: <CreditCard className="h-3 w-3" />,
                className: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700",
                label: "Chuyển khoản",
            },
          
        }

        const config = methodConfig[method] || {
            icon: null,
            className: "bg-gray-100 text-gray-700",
            label: method,
        }

        return (
            <Badge variant="secondary" className={config.className}>
                <div className="flex items-center gap-1">
                    {config.icon}
                    {config.label}
                </div>
            </Badge>
        )
    }

    const updateInvoiceStatus = async (invoiceId: string, currentStatus: string) => {
        try {
            if (currentStatus !== "ChuaThanhToan") {
                toast.warning("Hóa đơn đã thanh toán hoặc bị hủy, không thể cập nhật.")
                return
            }

            const newStatus = "DaThanhToan"

            const response = await fetch(`${BASE_URL}/admin/api/invoices/${invoiceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ trangThaiHD: newStatus }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                toast.error(`Cập nhật thất bại: ${errorData.message || "Lỗi không xác định"}`)
                return
            }

            toast.success(`✅ Đã cập nhật trạng thái hóa đơn ${invoiceId} thành ĐÃ THANH TOÁN`)
            fetchInvoices(currentPage, searchTerm)
        } catch (error: any) {
            console.error("Error updating invoice status:", error)
            toast.error("⚠️ Lỗi hệ thống khi cập nhật trạng thái hóa đơn!")
        }
    }

    // Component skeleton khi loading
    const LoadingSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid grid-cols-7 gap-4 items-center">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-8 w-20 mx-auto" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )

    // Component phân trang
    const Pagination = () => {
        const maxVisiblePages = 5
        const pages: number[] = []
        const halfRange = Math.floor(maxVisiblePages / 2)
        let startPage = Math.max(1, currentPage - halfRange)
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Hiển thị {invoices.length} / {totalInvoices} hóa đơn trên trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Trước
                    </Button>
                    {pages.map((page) => (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={
                                page === currentPage
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                    : "bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                            }
                        >
                            {page}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                    >
                        Sau
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                            <Receipt className="h-8 w-8 text-blue-600" />
                            Quản Lý Hóa Đơn
                        </h1>
                        <p className="text-gray-600 text-lg">Quản lý và theo dõi tất cả các hóa đơn trong hệ thống</p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                </div>

                {/* Thanh tìm kiếm */}
                <div className="w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Tìm theo mã hóa đơn hoặc mã đặt phòng"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Thông báo lỗi */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {/* Trạng thái loading */}
                {loading && <LoadingSkeleton />}

                {/* Bảng dữ liệu hoặc trạng thái không có dữ liệu */}
                {!loading && (
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-blue-600" />
                                Danh sách hóa đơn
                                <Badge variant="secondary" className="ml-2">
                                    {invoices.length} hóa đơn
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {invoices.length === 0 ? (
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Receipt className="h-8 w-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có dữ liệu</h3>
                                    <p className="text-gray-600 text-center max-w-md">
                                        Không tìm thấy hóa đơn phù hợp với tìm kiếm của bạn.
                                    </p>
                                </CardContent>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50 border-b">
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[140px]">
                                                        <div className="flex items-center gap-2">
                                                            <Hash className="h-4 w-4" />
                                                            Mã Hóa Đơn
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[130px]">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="h-4 w-4" />
                                                            Phương Thức
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[120px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Trạng Thái
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-right min-w-[140px]">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            Tổng Tiền
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[110px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Ngày Tạo
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[140px]">
                                                        <div className="flex items-center gap-2">
                                                            <Hash className="h-4 w-4" />
                                                            Mã Đặt Phòng
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[100px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Edit className="h-4 w-4" />
                                                            Hành Động
                                                        </div>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.map((invoice, index) => (
                                                    <TableRow
                                                        key={invoice.maHD}
                                                        className={`hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                                                            }`}
                                                    >
                                                        <TableCell className="py-4 px-4">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs"
                                                            >
                                                                {invoice.maHD}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4">
                                                            {renderPaymentMethod(invoice.phuongThucThanhToan)}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            {renderStatus(invoice.trangThaiHD)}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="font-mono text-sm font-semibold text-gray-900">
                                                                    {formatCurrency(invoice.tongTien)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">VND</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                <span className="text-sm text-gray-600 font-medium">
                                                                    {formatDate(invoice.ngayTaoHD)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-purple-50 text-purple-700 border-purple-200 font-mono text-xs"
                                                            >
                                                                {invoice.maDatPhong}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => updateInvoiceStatus(invoice.maHD, invoice.trangThaiHD)}
                                                                disabled={invoice.trangThaiHD === "Huy"}
                                                                className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors duration-150 min-w-[80px]"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Cập nhật
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <Pagination />
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default InvoicesPage