"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
    RefreshCw,
    AlertCircle,
    CalendarDays,
    Hash,
    User,
    Home,
    Clock,
    ChevronLeft,
    ChevronRight,
    Edit,
    CheckCircle,
    XCircle,
    Calendar,
} from "lucide-react"

// Hàm chuẩn hóa chuỗi tiếng Việt
function removeDiacritics(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
}

interface Booking {
    maDatPhong: string
    check_in: string
    check_out: string
    thoiGianDat: string
    trangThai?: string
    khachhang: {
        tenKhachHang: string
    }
    phong: {
        tenPhong: string
    }
}

const BookingsPage = () => {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalBookings, setTotalBookings] = useState(0)
    const [limit] = useState(7)
    const [updatingBookings, setUpdatingBookings] = useState<Set<string>>(new Set())

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    // Hàm lấy danh sách đặt phòng
    const fetchBookings = async (page = 1, search = "") => {
        setLoading(true)
        setError(null)
        try {
            const url = new URL(`${BASE_URL}/admin/api/booking`)
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
                // Thêm trạng thái mặc định nếu không có
                const bookingsWithStatus = data.data.map((booking: Booking) => ({
                    ...booking,
                    trangThai: booking.trangThai || "ChoXacNhan",
                }))

                setBookings(bookingsWithStatus)
                setTotalPages(data.pagination?.totalPages || Math.ceil(data.data.length / limit))
                setCurrentPage(data.pagination?.currentPage || page)
                setTotalBookings(data.pagination?.totalBookings || data.data.length)
            } else {
                throw new Error("Invalid bookings response")
            }
        } catch (err: any) {
            console.error("Error fetching bookings:", err)
            setError("Không thể tải danh sách đặt phòng")
            setBookings([])
            toast.error("Lỗi hệ thống khi tải đặt phòng!")
        } finally {
            setLoading(false)
        }
    }

    // Tải dữ liệu khi trang hoặc tìm kiếm thay đổi
    useEffect(() => {
        fetchBookings(currentPage, searchTerm)
    }, [currentPage, searchTerm])

    const handleRefresh = () => {
        setSearchTerm("")
        setCurrentPage(1)
        fetchBookings(1, "")
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

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return isNaN(date.getTime())
            ? "N/A"
            : date.toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
    }

    const calculateNights = (checkIn: string, checkOut: string) => {
        const start = new Date(checkIn)
        const end = new Date(checkOut)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const renderStatus = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
            ChoXacNhan: {
                label: "Chờ xác nhận",
                className: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200",
                icon: <Clock className="h-3 w-3" />,
            },
            Check_in: {
                label: "Đã Check-in",
                className: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200",
                icon: <Home className="h-3 w-3" />,
            },
            Check_out: {
                label: "Đã Check-out",
                className: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200",
                icon: <CalendarDays className="h-3 w-3" />,
            },
            DaHuy: {
                label: "Đã hủy",
                className: "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200",
                icon: <XCircle className="h-3 w-3" />,
            },
            YeuCauHuy: {
                label: "Yêu cầu hủy",
                className: "bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-orange-200",
                icon: <AlertCircle className="h-3 w-3" />,
            },
        }

        const config = statusConfig[status] || {
            label: status,
            className: "bg-gray-100 text-gray-700 border-gray-200",
            icon: <AlertCircle className="h-3 w-3" />,
        }

        return (
            <Badge variant="outline" className={config.className}>
                <div className="flex items-center gap-1">
                    {config.icon}
                    {config.label}
                </div>
            </Badge>
        )
    }

    const updateBookingStatus = async (bookingId: string, newStatus: string) => {
        setUpdatingBookings(prev => new Set(prev).add(bookingId));

        try {
            const response = await fetch(`${BASE_URL}/admin/api/booking/${bookingId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ trangThai: newStatus }),
            });

            const responseText = await response.text();
            console.log("Response status:", response.status);
            console.log("Response text:", responseText);

            let responseData: any = {};
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                toast.error("⚠️ Dữ liệu phản hồi từ server không hợp lệ");
                return;
            }

            if (!response.ok) {
                const errorMessage = responseData?.error || responseData?.message || `HTTP ${response.status}`;
                console.warn("API báo lỗi:", errorMessage); // dùng warn thay vì error
                toast.error(`❌ Cập nhật thất bại: ${errorMessage}`);
                return;
            }

            toast.success(`✅ Đã cập nhật trạng thái đặt phòng ${bookingId}`);
            await fetchBookings(currentPage, searchTerm);
        } catch (error: any) {
            console.error("Lỗi kết nối API:", error);
            toast.error("⚠️ Lỗi hệ thống: Không thể kết nối đến server");
        } finally {
            setUpdatingBookings(prev => {
                const newSet = new Set(prev);
                newSet.delete(bookingId);
                return newSet;
            });
        }
    };

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
                        <div key={i} className="grid grid-cols-8 gap-4 items-center">
                            <Skeleton className="h-6 w-full" />
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
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Hiển thị {bookings.length} / {totalBookings} đặt phòng trên trang {currentPage} / {totalPages}
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
                            <CalendarDays className="h-8 w-8 text-blue-600" />
                            Quản Lý Đặt Phòng
                        </h1>
                        <p className="text-gray-600 text-lg">Quản lý và theo dõi tất cả các đặt phòng trong hệ thống</p>
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
                        placeholder="Tìm theo mã đặt phòng, tên khách hàng hoặc phòng"
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
                                <CalendarDays className="w-5 h-5 text-blue-600" />
                                Danh sách đặt phòng
                                <Badge variant="secondary" className="ml-2">
                                    {bookings.length} đặt phòng
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {bookings.length === 0 ? (
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarDays className="h-8 w-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có dữ liệu</h3>
                                    <p className="text-gray-600 text-center max-w-md">
                                        Không tìm thấy đặt phòng phù hợp với tìm kiếm của bạn.
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
                                                            Mã Đặt Phòng
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[150px]">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            Khách Hàng
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[120px]">
                                                        <div className="flex items-center gap-2">
                                                            <Home className="h-4 w-4" />
                                                            Phòng
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[110px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Check-in
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[110px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Calendar className="h-4 w-4" />
                                                            Check-out
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[80px]">
                                                        Số đêm
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[140px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Clock className="h-4 w-4" />
                                                            Thời gian đặt
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[120px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Trạng thái
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[100px]">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Edit className="h-4 w-4" />
                                                            Hành động
                                                        </div>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {bookings.map((booking, index) => (
                                                    <TableRow
                                                        key={booking.maDatPhong}
                                                        className={`hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                                                            }`}
                                                    >
                                                        <TableCell className="py-4 px-4">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs"
                                                            >
                                                                {booking.maDatPhong}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-gray-400" />
                                                                <span className="font-medium text-gray-900">{booking.khachhang.tenKhachHang}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4">
                                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                {booking.phong.tenPhong}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <span className="text-sm text-gray-600 font-medium">{formatDate(booking.check_in)}</span>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <span className="text-sm text-gray-600 font-medium">{formatDate(booking.check_out)}</span>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                                                {calculateNights(booking.check_in, booking.check_out)} đêm
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <span className="text-xs text-gray-500">{formatDateTime(booking.thoiGianDat)}</span>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            {renderStatus(booking.trangThai || "ChoXacNhan")}
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <div className="flex gap-1 justify-center">
                                                                {booking.trangThai === "ChoXacNhan" && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateBookingStatus(booking.maDatPhong, "Check_in")}
                                                                            disabled={updatingBookings.has(booking.maDatPhong)}
                                                                            className="text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors duration-150"
                                                                        >
                                                                            <Home className="h-3 w-3 mr-1" />
                                                                            {updatingBookings.has(booking.maDatPhong) ? "Đang xử lý..." : "Check-in"}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateBookingStatus(booking.maDatPhong, "DaHuy")}
                                                                            disabled={updatingBookings.has(booking.maDatPhong)}
                                                                            className="text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors duration-150"
                                                                        >
                                                                            <XCircle className="h-3 w-3 mr-1" />
                                                                            {updatingBookings.has(booking.maDatPhong) ? "Đang xử lý..." : "Hủy"}
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                {booking.trangThai === "Check_in" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateBookingStatus(booking.maDatPhong, "Check_out")}
                                                                        disabled={updatingBookings.has(booking.maDatPhong)}
                                                                        className="text-xs hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-colors duration-150"
                                                                    >
                                                                        <CalendarDays className="h-3 w-3 mr-1" />
                                                                        {updatingBookings.has(booking.maDatPhong) ? "Đang xử lý..." : "Check-out"}
                                                                    </Button>
                                                                )}
                                                                {booking.trangThai === "YeuCauHuy" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateBookingStatus(booking.maDatPhong, "DaHuy")}
                                                                        disabled={updatingBookings.has(booking.maDatPhong)}
                                                                        className="text-xs hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition-colors duration-150"
                                                                    >
                                                                        <XCircle className="h-3 w-3 mr-1" />
                                                                        {updatingBookings.has(booking.maDatPhong) ? "Đang xử lý..." : "Xử lý Hủy"}
                                                                    </Button>
                                                                )}
                                                            </div>
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

export default BookingsPage