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

interface ServiceType {
  maDV?: string
  tenDV?: string
  moTaDV?: string
  giaDV?: number
  anhDV?: string | File
}

interface Props {
  mode: "create" | "edit"
  service?: ServiceType
  children?: React.ReactNode
  onSuccess?: () => void
}

export function ServiceDialog({ mode, service, children, onSuccess }: Props) {
  const [form, setForm] = useState<ServiceType>({
    maDV: service?.maDV ?? (mode === "create" ? generateRandomCode() : ""),
    tenDV: service?.tenDV ?? "",
    moTaDV: service?.moTaDV ?? "",
    giaDV: service?.giaDV ?? 0,
    anhDV: service?.anhDV ?? "",
  })

  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === "giaDV" ? Number(value) : value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm((prev) => ({
        ...prev,
        anhDV: file,
      }))
      setPreview(URL.createObjectURL(file))
    }
  }

  function generateRandomCode(prefix = "DV"): string {
    return `${prefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate data before submission
    if (!form.tenDV || !form.moTaDV || form.giaDV! <= 0) {
      toast.error("Vui lòng nhập đầy đủ thông tin hợp lệ (giá không được âm hoặc rỗng).")
      return
    }

    setLoading(true)

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === "anhDV") {
        if (value instanceof File) {
          formData.append("anhDV", value) // New image selected
        } else if (typeof value === "string" && mode === "edit") {
          formData.append("anhDV", value) // Keep old image name if no new image
        }
      } else {
        formData.append(key, value.toString())
      }
    })

    const method = mode === "create" ? "POST" : "PUT"
    const url =
      mode === "create"
        ? "/admin/api/services"
        : `/admin/api/services/${service?.maDV}`

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
        mode === "create" ? "Tạo dịch vụ thành công!" : "Cập nhật dịch vụ thành công!"
      )

      onSuccess?.() // Call callback if provided
      window.location.reload() // Or use onSuccess to refetch data instead of reload
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
              Thêm dịch vụ
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
            {mode === "create" ? "Thêm dịch vụ" : "Chỉnh sửa dịch vụ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label>Tên dịch vụ</Label>
            <Input name="tenDV" value={form.tenDV} onChange={handleChange} required />
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea name="moTaDV" value={form.moTaDV} onChange={handleChange} required />
          </div>

          <div>
            <Label>Giá dịch vụ</Label>
            <Input
              name="giaDV"
              type="number"
              value={form.giaDV}
              onChange={handleChange}
              required
              className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div>
            <Label>Hình ảnh</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} required={mode === "create"} />
            {preview ? (
              <img src={preview} alt="Preview" className="mt-2 max-w-full h-32 object-contain rounded border" />
            ) : mode === "edit" && typeof form.anhDV === "string" ? (
              <img src={`/img/services/${form.anhDV}`} alt="Current service" className="mt-2 max-w-full h-32 object-contain rounded border" />
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
                ? "Thêm dịch vụ"
                : "Lưu thay đổi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}