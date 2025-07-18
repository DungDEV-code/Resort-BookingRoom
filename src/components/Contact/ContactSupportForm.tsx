"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"


interface ContactSupportFormProps {
  open: boolean
  onClose: () => void
}

interface LienHeHoTro {
  maLienHeHotro: string
  tieuDe: string
  noiDung: string
  trangThai: "Moi" | "DangXuLy" | "DaXuLy"
  ngayTao: string
  ngayCapNhat?: string
  khachhang: {
    tenKhachHang: string
    soDienThoai: string
  }
}

interface ApiResponse {
  data: LienHeHoTro[]
  totalCount: number
  currentPage: number
  totalPages: number
}

const trangThaiLabels = {
  Moi: "Mới",
  DangXuLy: "Đang xử lý",
  DaXuLy: "Đã xử lý",
}

const trangThaiColors = {
  Moi: "bg-blue-100 text-blue-700 border-blue-500",
  DangXuLy: "bg-orange-100 text-orange-700 border-orange-400",
  DaXuLy: "bg-emerald-100 text-emerald-700 border-emerald-500",
}

export default function ContactSupportForm({ open, onClose }: ContactSupportFormProps) {
  const { user } = useAuth()


  // Form states
  const [email, setEmail] = useState("")
  const [tieuDe, setTieuDe] = useState("")
  const [noiDung, setNoiDung] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // History states
  const [viewMode, setViewMode] = useState<"form" | "history">("form")
  const [lienHeList, setLienHeList] = useState<LienHeHoTro[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")

  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email)
    }
  }, [user])

  // Load lịch sử khi chuyển sang tab history
  useEffect(() => {
    if (viewMode === "history" && open) {
      loadLienHeHistory()
    }
  }, [viewMode, open, currentPage, searchTerm, filterStatus])

  const loadLienHeHistory = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
      })

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim())
      }

      if (filterStatus) {
        params.append("trangThai", filterStatus)
      }

      const response = await fetch(`/api/contact?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Không thể tải lịch sử liên hệ")
      }

      const data: ApiResponse = await response.json()
      setLienHeList(data.data)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalCount)
    } catch (error) {
      console.error("Lỗi khi tải lịch sử:", error)
      toast.error("Lỗi khi tải dữ liệu", {
        description: "Không thể tải lịch sử liên hệ. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tieuDe.trim() || !noiDung.trim()) {
      toast.error("Lỗi", {
        description: "Vui lòng nhập đầy đủ tiêu đề và nội dung.",
      });
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tieuDe: tieuDe.trim(),
          noiDung: noiDung.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Có lỗi xảy ra")
      }
      toast.success("Thành công", {
        description: result.message || "Gửi liên hệ thành công!",
      });

      // Reset form
      setTieuDe("")
      setNoiDung("")

      // Refresh history if on history tab
      if (viewMode === "history") {
        loadLienHeHistory()
      }

      onClose()
    } catch (error: any) {
      console.error("Lỗi khi gửi liên hệ:", error)
      toast.error("Lỗi", {
        description: error.message || "Không thể gửi liên hệ. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadLienHeHistory()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Liên hệ hỗ trợ</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        {/* Tabs */}
        <div className="mb-4 flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setViewMode("form")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${viewMode === "form"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-gray-500 hover:text-sky-600"
              }`}
          >
            Gửi yêu cầu
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${viewMode === "history"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-gray-500 hover:text-sky-600"
              }`}
          >
            Lịch sử hỗ trợ ({totalCount})
          </button>
        </div>

        {viewMode === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email của bạn</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <Label htmlFor="tieuDe">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tieuDe"
                type="text"
                required
                placeholder="Nhập tiêu đề yêu cầu hỗ trợ..."
                value={tieuDe}
                onChange={(e) => setTieuDe(e.target.value)}
                maxLength={150}
              />
              <div className="text-xs text-gray-500 mt-1">{tieuDe.length}/150 ký tự</div>
            </div>

            <div>
              <Label htmlFor="noiDung">
                Nội dung cần hỗ trợ <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="noiDung"
                required
                placeholder="Vui lòng mô tả chi tiết vấn đề bạn đang gặp phải..."
                rows={6}
                value={noiDung}
                onChange={(e) => setNoiDung(e.target.value)}
                className="resize-y"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="flex">
                  <Input
                    placeholder="Tìm theo mã liên hệ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button type="button" variant="outline" onClick={handleSearch} className="ml-2 bg-transparent">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Moi">Mới</option>
                <option value="DangXuLy">Đang xử lý</option>
                <option value="DaXuLy">Đã xử lý</option>
              </select>
            </div>

            {/* History List */}
            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : lienHeList.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  {searchTerm || filterStatus ? "Không tìm thấy kết quả nào." : "Bạn chưa có yêu cầu nào trước đây."}
                </p>
              ) : (
                lienHeList.map((item) => (
                  <div
                    key={item.maLienHeHotro}
                    className={`p-4 border-l-4 rounded-md shadow-sm bg-white border ${trangThaiColors[item.trangThai]}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-800 mb-1">{item.tieuDe}</div>
                        <div className="text-xs text-gray-500">Mã: {item.maLienHeHotro}</div>
                      </div>
                      <span className={`text-xs font-bold rounded-full px-3 py-1 ${trangThaiColors[item.trangThai]}`}>
                        {trangThaiLabels[item.trangThai]}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 line-clamp-3">{item.noiDung}</p>

                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>🕒 Tạo: {formatDate(item.ngayTao)}</span>
                      {item.ngayCapNhat && <span>📝 Cập nhật: {formatDate(item.ngayCapNhat)}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Trang {currentPage} / {totalPages} (Tổng: {totalCount})
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
