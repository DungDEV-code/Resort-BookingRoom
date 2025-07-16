"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Room {
  maPhong?: string
  tenPhong?: string
  maLoaiPhong?: string
  loaiphong?: { tenLoaiPhong: string }
  moTa?: string
  tinhTrang?: string | null
  gia?: number
  hinhAnh?: string | File
  bookingCount?: number
}

interface LoaiPhong {
  maLoaiPhong: string
  tenLoaiPhong: string
}

interface Props {
  mode: "create" | "edit"
  room?: Room
  children?: React.ReactNode
  onSuccess?: () => void
}

export function RoomDialog({ mode, room, children, onSuccess }: Props) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const [open, setOpen] = useState(false)

  const [form, setForm] = useState<Room>({
    maPhong: room?.maPhong ?? (mode === "create" ? generateRandomCode() : ""),
    tenPhong: room?.tenPhong ?? "",
    maLoaiPhong: room?.maLoaiPhong ?? "",
    moTa: room?.moTa ?? "",
    tinhTrang: room?.tinhTrang ?? "Trong",
    gia: room?.gia ?? 0,
    hinhAnh: room?.hinhAnh ?? "",
  })

  const [loaiPhongs, setLoaiPhongs] = useState<LoaiPhong[]>([])
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const statusOptions = [
    { value: "Trong", label: "Trống" },
    { value: "DaDat", label: "Đã Đặt" },
    { value: "DangDonDep", label: "Đang dọn dẹp" },
    { value: "DangSuaChua", label: "Đang sửa chữa" },

  ]

  useEffect(() => {
    if (mode === "edit") setOpen(true)
  }, [mode, room])

  useEffect(() => {
    const fetchLoaiPhongs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/admin/api/room-types`, { cache: "no-store" })
        if (!res.ok) throw new Error("Lỗi khi tải loại phòng")
        const data = await res.json()
        setLoaiPhongs(data)
      } catch (error) {
        toast.error("Lỗi khi tải loại phòng", {
          description: error instanceof Error ? error.message : "Lỗi kết nối tới server",
          duration: 5000,
        })
      }
    }

    fetchLoaiPhongs()
  }, [])

  function generateRandomCode(prefix = "PH"): string {
    return `${prefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "gia" ? Number(value) : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({ ...prev, hinhAnh: file }))
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, hinhAnh: "" }))
    setPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.tenPhong || !form.maLoaiPhong || !form.moTa || form.gia! <= 0) {
      toast.error("Vui lòng nhập đầy đủ thông tin hợp lệ (giá không được âm hoặc rỗng).")
      return
    }

    setLoading(true)

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === "hinhAnh") {
        if (value instanceof File) {
          formData.append("hinhAnh", value)
        } else if (typeof value === "string" && mode === "edit" && value) {
          formData.append("hinhAnh", value)
        }
      } else if (key === "tinhTrang" && value === "") {
        formData.append(key, "")
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString())
      }
    })

    const method = mode === "create" ? "POST" : "PUT"
    const url = mode === "create"
      ? `${BASE_URL}/admin/api/rooms`
      : `${BASE_URL}/admin/api/rooms/${room?.maPhong}`

    try {
      const res = await fetch(url, { method, body: formData })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || "Đã xảy ra lỗi.")
        return
      }

      toast.success(mode === "create" ? "Tạo phòng thành công!" : "Cập nhật phòng thành công!")
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      console.error("Lỗi fetch:", err)
      toast.error("Không thể kết nối đến máy chủ.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm phòng" : "Chỉnh sửa phòng"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">


          <div>
            <Label>Tên phòng</Label>
            <Input name="tenPhong" value={form.tenPhong} onChange={handleChange} required />
          </div>

          <div>
            <Label>Loại phòng</Label>
            <Select
              value={form.maLoaiPhong}
              onValueChange={(value) => setForm((prev) => ({ ...prev, maLoaiPhong: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại phòng" />
              </SelectTrigger>
              <SelectContent>
                {loaiPhongs.map((lp) => (
                  <SelectItem key={lp.maLoaiPhong} value={lp.maLoaiPhong}>
                    {lp.tenLoaiPhong}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea name="moTa" value={form.moTa} onChange={handleChange} required />
          </div>

          <div>
            <Label>Tình trạng</Label>
            <Select
              value={form.tinhTrang ?? ""}
              onValueChange={(value) => setForm((prev) => ({ ...prev, tinhTrang: value || null }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn tình trạng" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value || "null"} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Giá (VND)</Label>
            <Input
              name="gia"
              type="number"
              value={form.gia}
              onChange={handleChange}
              required
              min={0}
              className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div>
            <Label>Hình ảnh</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required={mode === "create" && !form.hinhAnh}
                className="flex-1"
              />
              {mode === "edit" && form.hinhAnh && (
                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 max-w-full h-32 object-contain rounded border"
              />
            ) : mode === "edit" && typeof form.hinhAnh === "string" && form.hinhAnh ? (
              <Image
                src={`/img/rooms/${form.hinhAnh}`}
                alt="Current room"
                width={128}
                height={128}
                className="mt-2 max-w-full h-32 object-contain rounded border"
              />
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
                ? "Thêm phòng"
                : "Lưu thay đổi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
