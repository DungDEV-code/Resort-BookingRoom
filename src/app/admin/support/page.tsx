"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Hash,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  User,
  Phone,
  Clock,
  Filter,
} from "lucide-react"

interface SupportContact {
  maLienHeHotro: string
  maKhachHang: string
  tieuDe: string
  noiDung: string
  trangThai: string
  ngayTao: string
  ngayCapNhat: string | null
  khachhang: {
    tenKhachHang: string
    soDienThoai: string
  }
}

const SupportManagementPage = () => {
  const [contacts, setContacts] = useState<SupportContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalContacts, setTotalContacts] = useState(0)
  const [selectedContact, setSelectedContact] = useState<SupportContact | null>(null)
  const [limit] = useState(7)

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  // Hàm lấy danh sách liên hệ hỗ trợ
  const fetchContacts = async (page = 1, tenKhachHang = "", status = "") => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(`${BASE_URL}/admin/api/contact`)
      url.searchParams.set("page", page.toString())
      url.searchParams.set("pageSize", limit.toString())
      if (tenKhachHang) {
        url.searchParams.set("tenKhachHang", tenKhachHang)
      }
      if (status) {
        url.searchParams.set("trangThai", status)
      }

      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-store",
        },
      })

      const result = await response.json()

      if (response.ok && Array.isArray(result.data)) {
        setContacts(result.data)
        setTotalContacts(result.total)
        setTotalPages(Math.ceil(result.total / limit))
        setCurrentPage(result.page)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err: any) {
      console.error("Error fetching contacts:", err)
      setError("Không thể tải danh sách liên hệ hỗ trợ")
      setContacts([])
      toast.error("Lỗi hệ thống khi tải dữ liệu!")
    } finally {
      setLoading(false)
    }
  }

  // Tải dữ liệu khi trang hoặc bộ lọc thay đổi
  useEffect(() => {
    fetchContacts(currentPage, searchTerm, statusFilter)
  }, [currentPage, searchTerm, statusFilter])

  const handleRefresh = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCurrentPage(1)
    fetchContacts(1, "", "")
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value)
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
  }

  const renderStatus = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      Moi: {
        label: "Mới",
        className: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200",
      },
      DangXuLy: {
        label: "Đang xử lý",
        className: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200",
      },
      DaXuLy: {
        label: "Đã xử lý",
        className: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200",
      },
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

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/api/contact/${contactId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trangThai: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(`Cập nhật thất bại: ${errorData.message || "Lỗi không xác định"}`)
        return
      }

      toast.success(`✅ Đã cập nhật trạng thái liên hệ ${contactId}`)
      fetchContacts(currentPage, searchTerm, statusFilter)
    } catch (error: any) {
      console.error("Error updating contact status:", error)
      toast.error("⚠️ Lỗi hệ thống khi cập nhật trạng thái!")
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
            <div key={i} className="grid grid-cols-6 gap-4 items-center">
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
          Hiển thị {contacts.length} / {totalContacts} liên hệ trên trang {currentPage} / {totalPages}
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
              <MessageSquare className="h-8 w-8 text-blue-600" />
              Quản Lý Liên Hệ Hỗ Trợ
            </h1>
            <p className="text-gray-600 text-lg">Quản lý và xử lý các yêu cầu hỗ trợ từ khách hàng</p>
          </div>
          <Button
            onClick={handleRefresh}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Bộ lọc và tìm kiếm */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên khách hàng..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Lọc trạng thái" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Moi">Mới</SelectItem>
                <SelectItem value="DangXuLy">Đang xử lý</SelectItem>
                <SelectItem value="DaXuLy">Đã xử lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

        {/* Bảng dữ liệu */}
        {!loading && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Danh sách liên hệ hỗ trợ
                <Badge variant="secondary" className="ml-2">
                  {contacts.length} liên hệ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {contacts.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có dữ liệu</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Không tìm thấy liên hệ hỗ trợ phù hợp với tìm kiếm của bạn.
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
                              Mã Liên Hệ
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Khách Hàng
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 text-left min-w-[250px]">
                            Tiêu Đề
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[120px]">
                            <div className="flex items-center justify-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Trạng Thái
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[140px]">
                            <div className="flex items-center justify-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Ngày Tạo
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-700 py-4 px-4 text-center min-w-[150px]">
                            Hành Động
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact, index) => (
                          <TableRow
                            key={contact.maLienHeHotro}
                            className={`hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                              }`}
                          >
                            <TableCell className="py-4 px-4">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs"
                              >
                                {contact.maLienHeHotro}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">{contact.khachhang.tenKhachHang}</div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  {contact.khachhang.soDienThoai}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <div className="max-w-xs">
                                <p className="text-sm font-medium text-gray-900 truncate">{contact.tieuDe}</p>
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {contact.noiDung.substring(0, 50)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">{renderStatus(contact.trangThai)}</TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-600 font-medium">{formatDate(contact.ngayTao)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedContact(contact)}
                                      className="text-xs hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Xem
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Chi tiết liên hệ hỗ trợ
                                      </DialogTitle>
                                    </DialogHeader>
                                    {selectedContact && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Mã liên hệ:</label>
                                            <p className="text-sm text-gray-900">{selectedContact.maLienHeHotro}</p>
                                          </div>
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Trạng thái:</label>
                                            <div className="mt-1">{renderStatus(selectedContact.trangThai)}</div>
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Khách hàng:</label>
                                          <p className="text-sm text-gray-900">
                                            {selectedContact.khachhang.tenKhachHang}
                                          </p>
                                          <p className="text-sm text-gray-500">
                                            {selectedContact.khachhang.soDienThoai}
                                          </p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Tiêu đề:</label>
                                          <p className="text-sm text-gray-900">{selectedContact.tieuDe}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-gray-700">Nội dung:</label>
                                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                              {selectedContact.noiDung}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="text-sm font-medium text-gray-700">Ngày tạo:</label>
                                            <p className="text-sm text-gray-900">
                                              {formatDate(selectedContact.ngayTao)}
                                            </p>
                                          </div>
                                          {selectedContact.ngayCapNhat && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-700">
                                                Ngày cập nhật:
                                              </label>
                                              <p className="text-sm text-gray-900">
                                                {formatDate(selectedContact.ngayCapNhat)}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex gap-2 pt-4 border-t">
                                          {selectedContact.trangThai === "Moi" && (
                                            <Button
                                              onClick={() =>
                                                updateContactStatus(selectedContact.maLienHeHotro, "DangXuLy")
                                              }
                                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                            >
                                              Đang xử lý
                                            </Button>
                                          )}
                                          {selectedContact.trangThai === "DangXuLy" && (
                                            <Button
                                              onClick={() =>
                                                updateContactStatus(selectedContact.maLienHeHotro, "DaXuLy")
                                              }
                                              className="bg-green-500 hover:bg-green-600 text-white"
                                            >
                                              Đã xử lý
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                               {contact.trangThai !== "DaXuLy" && (
                                  <Select
                                    value={contact.trangThai}
                                    onValueChange={(value) => updateContactStatus(contact.maLienHeHotro, value)}
                                  >
                                    <SelectTrigger className="w-24 h-8 text-xs">
                                      <Edit className="h-3 w-3" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {contact.trangThai === "Moi" && (
                                        <SelectItem value="DangXuLy">Đang xử lý</SelectItem>
                                      )}
                                      {contact.trangThai === "DangXuLy" && (
                                        <SelectItem value="DaXuLy">Đã xử lý</SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
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

export default SupportManagementPage