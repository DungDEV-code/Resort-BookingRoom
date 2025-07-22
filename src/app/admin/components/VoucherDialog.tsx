"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

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

interface VoucherDialogProps {
    mode: "create" | "edit"
    voucher?: Voucher
    children: React.ReactNode
    onSuccess?: () => void
}

export function VoucherDialog({ mode, voucher, children, onSuccess }: VoucherDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        maVoucher: "",
        tenVoucher: "",
        moTa: "",
        phanTramGiam: 0,
        ngayBatDau: "",
        ngayKetThuc: "",
        dieuKienApDung: "",
        trangThai: "ConHieuLuc",
    })

    useEffect(() => {
        if (mode === "edit" && voucher) {
            setFormData({
                maVoucher: voucher.maVoucher,
                tenVoucher: voucher.tenVoucher,
                moTa: voucher.moTa,
                phanTramGiam: voucher.phanTramGiam,
                ngayBatDau: voucher.ngayBatDau.split("T")[0], // Format for date input
                ngayKetThuc: voucher.ngayKetThuc.split("T")[0], // Format for date input
                dieuKienApDung: voucher.dieuKienApDung,
                trangThai: voucher.trangThai,
            })
        } else {
            setFormData({
                maVoucher: "",
                tenVoucher: "",
                moTa: "",
                phanTramGiam: 0,
                ngayBatDau: "",
                ngayKetThuc: "",
                dieuKienApDung: "",
                trangThai: "ConHieuLuc",
            })
        }
    }, [mode, voucher, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.tenVoucher || !formData.ngayBatDau || !formData.ngayKetThuc) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc")
            return
        }

        if (formData.phanTramGiam <= 0 || formData.phanTramGiam > 100) {
            toast.error("Phần trăm giảm phải từ 1% đến 100%")
            return
        }

        if (new Date(formData.ngayBatDau) >= new Date(formData.ngayKetThuc)) {
            toast.error("Ngày kết thúc phải sau ngày bắt đầu")
            return
        }

        setLoading(true)

        try {
            const url =
                mode === "create" ? `${BASE_URL}/admin/api/vouchers` : `${BASE_URL}/admin/api/vouchers/${voucher?.maVoucher}`

            const method = mode === "create" ? "POST" : "PUT"

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.message || `Lỗi khi ${mode === "create" ? "thêm" : "cập nhật"} voucher`)
            }

            toast.success(`${mode === "create" ? "Thêm" : "Cập nhật"} voucher thành công!`, {
                icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })

            setOpen(false)
            onSuccess?.()
        } catch (error) {
            toast.error(`Lỗi khi ${mode === "create" ? "thêm" : "cập nhật"} voucher`, {
                description: error instanceof Error ? error.message : "Lỗi không xác định",
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {mode === "create" ? "Thêm voucher mới" : "Chỉnh sửa voucher"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Điền thông tin để tạo voucher ưu đãi mới" : "Cập nhật thông tin voucher ưu đãi"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mode === "edit" && (
                            <div className="space-y-2">
                                <Label htmlFor="maVoucher">Mã voucher *</Label>
                                <Input
                                    id="maVoucher"
                                    value={formData.maVoucher}
                                    onChange={(e) => handleInputChange("maVoucher", e.target.value)}
                                    disabled
                                    className="font-mono"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="phanTramGiam">Phần trăm giảm (%) *</Label>
                            <Input
                                id="phanTramGiam"
                                type="number"
                                min="1"
                                max="100"
                                value={formData.phanTramGiam}
                                onChange={(e) => handleInputChange("phanTramGiam", Number.parseInt(e.target.value) || 0)}
                                placeholder="10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tenVoucher">Tên voucher *</Label>
                        <Input
                            id="tenVoucher"
                            value={formData.tenVoucher}
                            onChange={(e) => handleInputChange("tenVoucher", e.target.value)}
                            placeholder="VD: Ưu đãi mùa hè 2024"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="moTa">Mô tả</Label>
                        <Textarea
                            id="moTa"
                            value={formData.moTa}
                            onChange={(e) => handleInputChange("moTa", e.target.value)}
                            placeholder="Mô tả chi tiết về voucher..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ngayBatDau">Ngày bắt đầu *</Label>
                            <Input
                                id="ngayBatDau"
                                type="date"
                                value={formData.ngayBatDau}
                                onChange={(e) => handleInputChange("ngayBatDau", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ngayKetThuc">Ngày kết thúc *</Label>
                            <Input
                                id="ngayKetThuc"
                                type="date"
                                value={formData.ngayKetThuc}
                                onChange={(e) => handleInputChange("ngayKetThuc", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dieuKienApDung">Điều kiện áp dụng</Label>
                        <Textarea
                            id="dieuKienApDung"
                            value={formData.dieuKienApDung}
                            onChange={(e) => handleInputChange("dieuKienApDung", e.target.value)}
                            placeholder="VD: Áp dụng cho đơn hàng từ 500,000 VNĐ"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trangThai">Trạng thái</Label>
                        <Select value={formData.trangThai} onValueChange={(value) => handleInputChange("trangThai", value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ConHieuLuc">Còn hiệu lực</SelectItem>
                                <SelectItem value="HetHieuLuc">Hết hiệu lực</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                            {loading ? "Đang xử lý..." : mode === "create" ? "Thêm voucher" : "Cập nhật"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
