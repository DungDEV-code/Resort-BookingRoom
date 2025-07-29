"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { nhanvien_chucVu, nhanvien_trangThaiLamViec } from "@/generated/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

interface Employee {
    maNhanVien: string
    maUser: string
    tenNhanVien: string
    soDienThoai: string
    trangThaiLamViec: nhanvien_trangThaiLamViec
    ngayVaoLam: string | Date
    chucVu: nhanvien_chucVu
    roleadminuser?: {
        email: string
        userName: string
        trangThaiTk: string
        role: string
    }
}

interface RoleAdminUser {
    email: string
    userName: string
    role: "NhanVien" | "Admin" | "KhachHang"
}

interface EmployeeDialogProps {
    mode: "create" | "edit"
    employee?: Employee
    children: React.ReactNode
    onSuccess?: () => Promise<void>
}

export default function EmployeeDialog({ mode, employee, children, onSuccess }: EmployeeDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<RoleAdminUser[]>([])
    const [existingEmployees, setExistingEmployees] = useState<Employee[]>([])
    const [formData, setFormData] = useState({
        maUser: employee?.maUser || "",
        tenNhanVien: employee?.tenNhanVien || "",
        soDienThoai: employee?.soDienThoai || "",
        chucVu: employee?.chucVu || nhanvien_chucVu.DonDep,
        trangThaiLamViec: employee?.trangThaiLamViec || nhanvien_trangThaiLamViec.DangLam,
        ngayVaoLam: employee?.ngayVaoLam
            ? new Date(employee.ngayVaoLam).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
    })

    const chucVuOptions = [
        { value: nhanvien_chucVu.DonDep, label: "Nhân viên dọn dẹp" },
        { value: nhanvien_chucVu.SuaChua, label: "Nhân viên sửa chữa" },
        { value: nhanvien_chucVu.LeTan, label: "Lễ tân" },
        { value: nhanvien_chucVu.BaoVe, label: "Bảo vệ" },
        { value: nhanvien_chucVu.QuanLy, label: "Quản lý" },
    ]

    const workStatusOptions = [
        { value: nhanvien_trangThaiLamViec.DangLam, label: "Đang Làm" },
        { value: nhanvien_trangThaiLamViec.Nghi, label: "Nghỉ" },
    ]

    // Fetch available roleadminuser records and existing employees
    useEffect(() => {
        if (open) {
            const fetchUsersAndEmployees = async () => {
                try {
                    // Fetch users
                    const userRes = await fetch(`${BASE_URL}/admin/api/users`, {
                        headers: { "Content-Type": "application/json" },
                        cache: "no-store",
                    })
                    if (!userRes.ok) throw new Error("Lỗi khi tải danh sách tài khoản")
                    const userData: RoleAdminUser[] = await userRes.json()

                    // Fetch existing employees
                    const employeeRes = await fetch(`${BASE_URL}/admin/api/employees`, {
                        headers: { "Content-Type": "application/json" },
                        cache: "no-store",
                    })
                    if (!employeeRes.ok) throw new Error("Lỗi khi tải danh sách nhân viên")
                    const employeeData: Employee[] = await employeeRes.json()
                    setExistingEmployees(employeeData)

                    // Filter users to exclude those already associated with employees
                    const assignedUserEmails = employeeData
                        .filter(emp => emp.maUser !== (mode === "edit" ? employee?.maUser : ""))
                        .map(emp => emp.maUser)
                    const availableUsers = userData
                        .filter(user => (user.role === "NhanVien" || user.role === "Admin") && !assignedUserEmails.includes(user.email))
                    setUsers(availableUsers)
                } catch (error) {
                    toast.error("Lỗi khi tải dữ liệu", {
                        description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                        icon: <XCircle className="w-4 h-4 text-red-600" />,
                        duration: 5000,
                    })
                }
            }
            fetchUsersAndEmployees()
        }
    }, [open, mode, employee?.maUser])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validate phone number (10 digits, starts with 0)
        const phoneRegex = /^0[1-9]\d{8}$/
        if (!phoneRegex.test(formData.soDienThoai)) {
            toast.error("Số điện thoại không hợp lệ (phải có 10 số, bắt đầu bằng 0)", {
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
            setLoading(false)
            return
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.ngayVaoLam)) {
            toast.error("Định dạng ngày vào làm không hợp lệ (YYYY-MM-DD)", {
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
            setLoading(false)
            return
        }

        // Validate maUser
        if (!formData.maUser) {
            toast.error("Vui lòng chọn tài khoản", {
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
            setLoading(false)
            return
        }

        try {
            const url =
                mode === "create"
                    ? `${BASE_URL}/admin/api/employees`
                    : `${BASE_URL}/admin/api/employees/${employee?.maNhanVien}`
            const method = mode === "create" ? "POST" : "PUT"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || `Không thể ${mode === "create" ? "thêm" : "cập nhật"} nhân viên`)
            }

            toast.success(`${mode === "create" ? "Thêm" : "Cập nhật"} nhân viên thành công!`, {
                icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })

            setOpen(false)
            if (onSuccess) {
                await onSuccess() // Call onSuccess to refresh data
            }
        } catch (error) {
            toast.error(`Lỗi khi ${mode === "create" ? "thêm" : "cập nhật"} nhân viên`, {
                description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div onClick={() => setOpen(true)}>{children}</div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {mode === "create" ? "Thêm nhân viên mới" : "Chỉnh sửa nhân viên"}
                        </DialogTitle>
                        <DialogDescription>
                            {mode === "create" ? "Nhập thông tin nhân viên mới" : "Cập nhật thông tin nhân viên"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="maUser">Tài khoản</Label>
                            <Select
                                value={formData.maUser}
                                onValueChange={(value) => setFormData({ ...formData, maUser: value })}
                                disabled={mode === "edit"} // Prevent changing maUser when editing
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tài khoản" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user) => (
                                        <SelectItem key={user.email} value={user.email}>
                                            {user.userName} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tenNhanVien">Tên nhân viên</Label>
                            <Input
                                id="tenNhanVien"
                                value={formData.tenNhanVien}
                                onChange={(e) => setFormData({ ...formData, tenNhanVien: e.target.value })}
                                placeholder="Nhập tên nhân viên"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="soDienThoai">Số điện thoại</Label>
                            <Input
                                id="soDienThoai"
                                value={formData.soDienThoai}
                                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                                placeholder="Nhập số điện thoại (10 số)"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chucVu">Chức vụ</Label>
                            <Select
                                value={formData.chucVu}
                                onValueChange={(value: nhanvien_chucVu) =>
                                    setFormData({ ...formData, chucVu: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn chức vụ" />
                                </SelectTrigger>
                                <SelectContent>
                                    {chucVuOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="trangThaiLamViec">Trạng thái làm việc</Label>
                            <Select
                                value={formData.trangThaiLamViec}
                                onValueChange={(value: nhanvien_trangThaiLamViec) =>
                                    setFormData({ ...formData, trangThaiLamViec: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn trạng thái làm việc" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workStatusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ngayVaoLam">Ngày vào làm</Label>
                            <Input
                                id="ngayVaoLam"
                                type="date"
                                value={formData.ngayVaoLam}
                                onChange={(e) => setFormData({ ...formData, ngayVaoLam: e.target.value })}
                                required
                            />
                        </div>
                        <DialogFooter className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                                {loading ? "Đang xử lý..." : mode === "create" ? "Thêm nhân viên" : "Cập nhật"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}