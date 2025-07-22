"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

interface RoomType {
  maLoaiPhong?: string
  tenLoaiPhong?: string
  moTa?: string
  soNguoi?: number
  soGiuong?: number
  gia_min?: number
  gia_max?: number
  hinhAnh?: string | File
}

interface Props {
  mode: "create" | "edit"
  roomType?: RoomType
  children?: React.ReactNode
  onSuccess?: () => void
}

export function RoomTypeDialog({ mode, roomType, children, onSuccess }: Props) {
  const [form, setForm] = useState<RoomType>({
    maLoaiPhong: roomType?.maLoaiPhong ?? (mode === "create" ? generateRandomCode() : ""),
    tenLoaiPhong: roomType?.tenLoaiPhong ?? "",
    moTa: roomType?.moTa ?? "",
    soNguoi: roomType?.soNguoi ?? 2,
    soGiuong: roomType?.soGiuong ?? 1,
    gia_min: roomType?.gia_min ?? 0,
    gia_max: roomType?.gia_max ?? 0,
    hinhAnh: roomType?.hinhAnh ?? "",
  })

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name.includes("gia") || name.includes("so") ? Number(value) : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({
        ...prev,
        hinhAnh: file,
      }))
      setPreview(URL.createObjectURL(file))
    }
  }

  function generateRandomCode(prefix = "LP"): string {
    return `${prefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Validate dữ liệu trước khi gửi
    if (
      !form.tenLoaiPhong ||
      !form.moTa ||
      form.soNguoi! <= 0 ||
      form.soGiuong! <= 0 ||
      form.gia_min! <= 0 ||
      form.gia_max! <= 0
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin hợp lệ (không được âm hoặc rỗng).")
      return
    }

    if (form.gia_min! > form.gia_max!) {
      toast.error("Giá tối thiểu không được lớn hơn giá tối đa.")
      return
    }

    setLoading(true)

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === "hinhAnh") {
        if (value instanceof File) {
          formData.append("hinhAnh", value) // chọn ảnh mới
        } else if (typeof value === "string" && mode === "edit") {
          formData.append("hinhAnh", value) // giữ lại tên ảnh cũ khi không chọn mới
        }
      } else {
        formData.append(key, value.toString())
      }
    })

    const method = mode === "create" ? "POST" : "PUT"
    const url =
      mode === "create"
        ? "/admin/api/room-types"
        : `/admin/api/room-types/${roomType?.maLoaiPhong}`

    try {
      const res = await fetch(url, {
        method,
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result?.error || "Đã xảy ra lỗi.")
        return
      }

      toast.success(
        mode === "create" ? "Tạo loại phòng thành công!" : "Cập nhật thành công!"
      )

      onSuccess?.() // 👈 Gọi callback nếu có
      window.location.reload() // hoặc dùng onSuccess để fetch lại thay vì reload
    } catch (err) {
      console.error("Lỗi fetch:", err)
      toast.error("Không thể kết nối đến máy chủ.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          mode === "create" ? (
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Thêm loại phòng
            </Button>
          ) : (
            <Button size="sm" variant="outline">
              <Pencil className="w-4 h-4 mr-2" />
              Sửa
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Thêm loại phòng" : "Chỉnh sửa loại phòng"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label>Tên loại phòng</Label>
            <Input name="tenLoaiPhong" value={form.tenLoaiPhong} onChange={handleChange} required />
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea name="moTa" value={form.moTa} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Số người</Label>
              <Input
                name="soNguoi"
                type="number"
                value={form.soNguoi}
                onChange={handleChange}
                required
                className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div>
              <Label>Số giường</Label>
              <Input
                name="soGiuong"
                type="number"
                value={form.soGiuong}
                onChange={handleChange}
                required
                className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Giá tối thiểu</Label>
              <Input
                name="gia_min"
                type="number"
                value={form.gia_min}
                onChange={handleChange}
                required
                className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div>
              <Label>Giá tối đa</Label>
              <Input
                name="gia_max"
                type="number"
                value={form.gia_max}
                onChange={handleChange}
                required
                className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>

          <div>
            <Label>Hình ảnh</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} required={mode === "create"} />
            {preview ? (
              <img src={preview} alt="Preview" className="mt-2 max-w-full h-32 object-contain rounded border" />
            ) : mode === "edit" && typeof form.hinhAnh === "string" ? (
              <img src={`/img/${form.hinhAnh}`} alt="Current room type" className="mt-2 max-w-full h-32 object-contain rounded border" />
            ) : null}
          </div>
          <Button
            type="submit"
            className="w-full h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={loading}
          >
            {loading
              ? "Đang xử lý..."
              : mode === "create"
                ? "Thêm loại phòng"
                : "Lưu thay đổi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
