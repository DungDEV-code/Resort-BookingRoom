"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Search, Pencil, Phone, Calendar, MapPin, Mail, XCircle, Crown } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Define TypeScript interfaces
interface Customer {
    maKhachHang: string
    maUser: string
    tenKhachHang: string
    ngaySinh: string | Date
    gioiTinh: string
    diaChi: string
    soDienThoai: string
    maMembership?: string | null
    membershipLevel?: string | null
    membershipDescription?: string | null
    minSpending?: number | null
}

function MembershipBadge({ level }: { level?: string | null }) {
    if (!level) {
        return (
            <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                Chưa có hạng
            </Badge>
        )
    }

    const config: { [key: string]: { label: string; className: string; icon: React.ReactNode } } = {
        Bronze: {
            label: "Đồng",
            className: "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-amber-300",
            icon: <Crown className="w-3 h-3" />,
        },
        Silver: {
            label: "Bạc",
            className: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300",
            icon: <Crown className="w-3 h-3" />,
        },
        Gold: {
            label: "Vàng",
            className: "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border-yellow-300",
            icon: <Crown className="w-3 h-3" />,
        },
        Diamond: {
            label: "Kim Cương",
            className: "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border-blue-300",
            icon: <Crown className="w-3 h-3" />,
        },
    }

    const membershipConfig = config[level] || config.Bronze
    return (
        <Badge
            variant="outline"
            className={`${membershipConfig.className} font-medium px-3 py-1 flex items-center gap-1.5 shadow-sm`}
        >
            {membershipConfig.icon}
            {membershipConfig.label}
        </Badge>
    )
}

function GenderBadge({ gender }: { gender: string }) {
    const config: { [key: string]: { className: string } } = {
        Nam: { className: "bg-blue-100 text-blue-600 border-blue-300" },
        Nữ: { className: "bg-pink-100 text-pink-600 border-pink-300" },
        Khác: { className: "bg-purple-100 text-purple-600 border-purple-300" },
    }

    const genderConfig = config[gender] || config.Khác
    return (
        <Badge variant="outline" className={`${genderConfig.className} font-medium`}>
            {gender}
        </Badge>
    )
}

export default function CustomerManagement() {
    const [data, setData] = useState<{ customers: Customer[] }>({
        customers: [],
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Filter customers based on search term
    const filteredCustomers = useMemo(() => {
        if (!searchTerm.trim()) return data.customers
        const searchLower = searchTerm.toLowerCase().trim()
        return data.customers.filter(
            (customer) =>
                customer.maKhachHang.toLowerCase().includes(searchLower) ||
                customer.tenKhachHang.toLowerCase().includes(searchLower) ||
                customer.soDienThoai.includes(searchLower) ||
                customer.diaChi.toLowerCase().includes(searchLower) ||
                customer.maUser.toLowerCase().includes(searchLower),
        )
    }, [data.customers, searchTerm])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            const res = await fetch(`${BASE_URL}/admin/api/customers`, {
                cache: "no-store",
                headers: {
                    "Cache-Control": "max-age=3600",
                },
            })
            if (!res.ok) throw new Error("Lỗi khi tải danh sách khách hàng")
            const customers: Customer[] = await res.json()

            setData({ customers })
        } catch (err: any) {
            setError(err.message)
            toast.error("Lỗi khi tải dữ liệu", {
                description: err.message,
                icon: <XCircle className="w-4 h-4 text-red-600" />,
                duration: 5000,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h3>
                    <p className="text-gray-600">{error}</p>
                    <Button
                        onClick={fetchCustomers}
                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                        Thử lại
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Quản lý khách hàng
                        </h1>
                        <p className="text-gray-600 text-lg">Quản lý và theo dõi thông tin khách hàng trong hệ thống</p>
                    </div>
                </div>

                {/* Search Section */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Tìm kiếm theo mã KH, tên, SĐT, địa chỉ hoặc email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                            />
                        </div>
                        {searchTerm && (
                            <div className="mt-3 text-sm text-gray-600">
                                Tìm thấy <span className="font-semibold text-blue-600">{filteredCustomers.length}</span> kết quả cho "
                                {searchTerm}"
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Table */}
                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Danh sách khách hàng
                            {searchTerm && (
                                <Badge variant="secondary" className="ml-2">
                                    {filteredCustomers.length} kết quả
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                                        <TableHead className="font-semibold text-gray-700 py-4">Mã KH</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Tên khách hàng</TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-4 h-4" />
                                                Email
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-4 h-4" />
                                                SĐT
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">Giới tính</TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Ngày sinh
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                Địa chỉ
                                            </div>
                                        </TableHead>
                                        <TableHead className="font-semibold text-gray-700">Hạng thành viên</TableHead>
                                        
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomers.map((customer: Customer, index: number) => (
                                        <TableRow
                                            key={customer.maKhachHang}
                                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                                }`}
                                        >
                                            <TableCell className="font-mono font-medium text-blue-600 py-4">{customer.maKhachHang}</TableCell>
                                            <TableCell className="font-semibold text-gray-800">{customer.tenKhachHang}</TableCell>
                                            <TableCell className="text-gray-600 text-sm">{customer.maUser}</TableCell>
                                            <TableCell className="text-gray-600">{customer.soDienThoai}</TableCell>
                                            <TableCell>
                                                <GenderBadge gender={customer.gioiTinh} />
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {new Date(customer.ngaySinh).toLocaleDateString("vi-VN")}
                                            </TableCell>
                                            <TableCell className="text-gray-600 max-w-[200px] truncate" title={customer.diaChi}>
                                                {customer.diaChi}
                                            </TableCell>
                                            <TableCell>
                                                <MembershipBadge level={customer.membershipLevel} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Empty State */}
                {filteredCustomers.length === 0 && !searchTerm && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <Users className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Chưa có khách hàng nào</h3>
                                <p className="text-gray-600">Hãy thêm khách hàng đầu tiên để bắt đầu quản lý</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* No Search Results */}
                {filteredCustomers.length === 0 && searchTerm && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                                    <Search className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy kết quả</h3>
                                <p className="text-gray-600">Không có khách hàng nào phù hợp với từ khóa "{searchTerm}"</p>
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