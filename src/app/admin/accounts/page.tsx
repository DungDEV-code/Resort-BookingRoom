"use client"
import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, User, Lock, Unlock, Plus } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Define TypeScript interfaces
interface User {
    email: string
    userName: string
    passWord: string
    trangThaiTk: "DangHoatDong" | "BiKhoa"
    role?: "KhachHang" | "NhanVien" | "Admin"
}

interface Stats {
    totalAccounts: number
    activeAccounts: number
    lockedAccounts: number
}

interface DataState {
    users: User[]
    stats: Stats
}

// Map role values to display names
const roleDisplayNames: Record<string, string> = {
    KhachHang: "Khách Hàng",
    NhanVien: "Nhân Viên",
    Admin: "Quản Trị Viên",
}

export default function AccountsPage() {
    const [data, setData] = useState<DataState>({
        users: [],
        stats: { totalAccounts: 0, activeAccounts: 0, lockedAccounts: 0 },
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newUser, setNewUser] = useState({
        email: "",
        userName: "",
        passWord: "",
        role: "NhanVien" as "NhanVien" | "Admin",
    })
    // Filter users based on search term
    const filteredUsers = useMemo(() => {
        let filtered = data.users

        // Apply search term filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim()
            filtered = filtered.filter(
                (user) =>
                    user.email.toLowerCase().includes(searchLower) ||
                    user.userName.toLowerCase().includes(searchLower) ||
                    user.passWord.toLowerCase().includes(searchLower) ||
                    (user.role && roleDisplayNames[user.role]?.toLowerCase().includes(searchLower))
            )
        }

        // Apply role filter
        if (roleFilter !== "all") {
            filtered = filtered.filter((user) => user.role === roleFilter)
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((user) => user.trangThaiTk === statusFilter)
        }

        return filtered
    }, [data.users, searchTerm, roleFilter, statusFilter])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${BASE_URL}/admin/api/users`, {
                cache: "no-store",
                headers: { "Cache-Control": "no-store" },
            })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(`HTTP error ${res.status}: ${text || "Unknown error"}`)
            }

            const contentType = res.headers.get("content-type")
            if (!contentType?.includes("application/json")) {
                throw new Error("Invalid response format: Expected JSON")
            }

            const users: User[] = await res.json()
            const stats: Stats = {
                totalAccounts: users.length,
                activeAccounts: users.filter((u) => u.trangThaiTk === "DangHoatDong").length,
                lockedAccounts: users.filter((u) => u.trangThaiTk === "BiKhoa").length,
            }

            setData({ users, stats })
        } catch (err: any) {
            const errorMessage = err.message || "Lỗi không xác định khi tải tài khoản"
            console.error("Fetch users error:", err)
            setError(errorMessage)
            toast.error("Lỗi khi tải dữ liệu", {
                description: errorMessage,
                icon: <Lock className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-600 text-lg">Đang tải...</p>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-600 text-lg">{error}</p>
            </div>
        )
    }
    const handleToggleStatus = async (email: string, currentStatus: "DangHoatDong" | "BiKhoa") => {
        setUpdating(email)
        try {
            const newStatus = currentStatus === "DangHoatDong" ? "BiKhoa" : "DangHoatDong"
            const res = await fetch(`${BASE_URL}/admin/api/users/${email}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trangThaiTk: newStatus }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Không thể cập nhật trạng thái")
            }
            toast.success(`Cập nhật trạng thái thành công! Tài khoản ${newStatus === "DangHoatDong" ? "mở khóa" : "bị khóa"}`, {
                icon: <Unlock className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })
            await fetchUsers()
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái", {
                description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                icon: <Lock className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setUpdating(null)
        }
    }
    const handleAddUser = async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newUser,
                    trangThaiTk: "DangHoatDong", // Default status for new account
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Không thể thêm tài khoản")
            }
            toast.success("Thêm tài khoản thành công!", {
                icon: <User className="w-4 h-4 text-green-600" />,
                duration: 3000,
            })
            setIsAddDialogOpen(false)
            setNewUser({ email: "", userName: "", passWord: "", role: "NhanVien" })
            await fetchUsers()
        } catch (error) {
            toast.error("Lỗi khi thêm tài khoản", {
                description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
                icon: <Lock className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        }
    }
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Quản lý tài khoản
                        </h1>
                        <p className="text-gray-600 text-lg">Quản lý trạng thái và thông tin tài khoản trong hệ thống</p>
                    </div>
                    <Button
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm tài khoản
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Tổng tài khoản</p>
                                    <p className="text-3xl font-bold">{data.stats.totalAccounts}</p>
                                </div>
                                <User className="w-8 h-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm font-medium">Tài khoản hoạt động</p>
                                    <p className="text-3xl font-bold">{data.stats.activeAccounts}</p>
                                </div>
                                <Unlock className="w-8 h-8 text-emerald-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-100 text-sm font-medium">Tài khoản bị khóa</p>
                                    <p className="text-3xl font-bold">{data.stats.lockedAccounts}</p>
                                </div>
                                <Lock className="w-8 h-8 text-red-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Filter Section */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    placeholder="Tìm kiếm theo email, tên người dùng, mật khẩu hoặc vai trò..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                />
                            </div>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                                    <SelectValue placeholder="Lọc theo vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                                    <SelectItem value="KhachHang">Khách Hàng</SelectItem>
                                    <SelectItem value="NhanVien">Nhân Viên</SelectItem>
                                    <SelectItem value="Admin">Quản Trị Viên</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                                    <SelectValue placeholder="Lọc theo trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                    <SelectItem value="DangHoatDong">Đang Hoạt Động</SelectItem>
                                    <SelectItem value="BiKhoa">Bị Khóa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
                            <div className="mt-3 text-sm text-gray-600">
                                Tìm thấy <span className="font-semibold text-blue-600">{filteredUsers.length}</span> kết quả
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Danh sách tài khoản
                            {searchTerm && (
                                <Badge variant="secondary" className="ml-2">
                                    {filteredUsers.length} kết quả
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                                        <TableHead className="font-semibold text-gray-700 py-4">Email</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Tên người dùng</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Mật khẩu</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Vai trò</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                                        <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user: User, index: number) => (
                                        <TableRow
                                            key={user.email}
                                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                }`}
                                        >
                                            <TableCell className="font-mono font-medium text-blue-600 py-4">{user.email}</TableCell>
                                            <TableCell className="font-semibold text-gray-800">{user.userName}</TableCell>
                                            <TableCell className="font-mono text-gray-600">{user.passWord}</TableCell>
                                            <TableCell className="text-gray-600">
                                                <Badge
                                                    variant="secondary"
                                                    className={`${user.role === "Admin"
                                                        ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                                                        : user.role === "NhanVien"
                                                            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {user.role ? roleDisplayNames[user.role] : "Không xác định"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`${user.trangThaiTk === "DangHoatDong"
                                                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                                        : "bg-red-100 text-red-600 hover:bg-red-200"
                                                        }`}
                                                >
                                                    {user.trangThaiTk === "DangHoatDong" ? "Đang Hoạt Động" : "Bị Khóa"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(user.email, user.trangThaiTk)}
                                                        disabled={updating === user.email}
                                                        className={`${user.trangThaiTk === "DangHoatDong"
                                                            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                                            : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                                                            } text-white shadow-md hover:shadow-lg transition-all duration-200`}
                                                    >
                                                        {user.trangThaiTk === "DangHoatDong" ? (
                                                            <>
                                                                <Lock className="w-4 h-4 mr-1" />
                                                                Khóa
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock className="w-4 h-4 mr-1" />
                                                                Mở khóa
                                                            </>
                                                        )}
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
                {/* Add User Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Thêm tài khoản mới</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userName" className="text-right">
                                    Tên người dùng
                                </Label>
                                <Input
                                    id="userName"
                                    value={newUser.userName}
                                    onChange={(e) => setNewUser({ ...newUser, userName: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="passWord" className="text-right">
                                    Mật khẩu
                                </Label>
                                <Input
                                    id="passWord"
                                    type="password"
                                    value={newUser.passWord}
                                    onChange={(e) => setNewUser({ ...newUser, passWord: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                    Vai trò
                                </Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(value) => setNewUser({ ...newUser, role: value as "NhanVien" | "Admin" })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NhanVien">Nhân Viên</SelectItem>
                                        <SelectItem value="Admin">Quản Trị Viên</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsAddDialogOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleAddUser}
                                disabled={!newUser.email || !newUser.userName || !newUser.passWord}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            >
                                Thêm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Empty State */}
                {filteredUsers.length === 0 && !searchTerm && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <User className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Chưa có tài khoản nào</h3>
                                <p className="text-gray-600">Hiện tại không có tài khoản nào trong hệ thống</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Search Results */}
                {filteredUsers.length === 0 && searchTerm && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <Search className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy kết quả</h3>
                                <p className="text-gray-600">Không có tài khoản nào phù hợp với từ khóa "{searchTerm}"</p>
                                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}