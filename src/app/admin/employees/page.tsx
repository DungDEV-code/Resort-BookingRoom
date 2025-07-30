"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Plus, XCircle, Search, Pencil, Phone, Calendar, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import EmployeeDialog from "../components/EmployeeDialog"
import { nhanvien_chucVu, nhanvien_trangThaiLamViec } from "@/generated/prisma"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

// Define TypeScript interfaces
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

interface Stats {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
}

interface DataState {
  employees: Employee[]
  stats: Stats
}

function StatusBadge({ status }: { status: nhanvien_trangThaiLamViec }) {
  const config = {
    [nhanvien_trangThaiLamViec.DangLam]: {
      label: "Đang làm",
      className: "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-emerald-300",
      icon: <UserCheck className="w-3 h-3" />,
    },
    [nhanvien_trangThaiLamViec.Nghi]: {
      label: "Nghỉ việc",
      className: "bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-red-300",
      icon: <UserX className="w-3 h-3" />,
    },
  }

  const statusConfig = config[status]
  return (
    <Badge
      variant="outline"
      className={`${statusConfig.className} font-medium px-3 py-1 flex items-center gap-1.5 shadow-sm`}
    >
      {statusConfig.icon}
      {statusConfig.label}
    </Badge>
  )
}

function ChucVuBadge({ chucVu }: { chucVu: nhanvien_chucVu }) {
  const config = {
    [nhanvien_chucVu.DonDep]: "Nhân viên dọn dẹp",
    [nhanvien_chucVu.SuaChua]: "Nhân viên sửa chữa",
    [nhanvien_chucVu.LeTan]: "Lễ tân",
    [nhanvien_chucVu.Admin]: "Admin",
  }

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-600 hover:bg-blue-200">
      {config[chucVu]}
    </Badge>
  )
}

export default function EmployeeManagement() {
  const [data, setData] = useState<DataState>({
    employees: [],
    stats: {
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
    },
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return data.employees
    const searchLower = searchTerm.toLowerCase().trim()
    return data.employees.filter(
      (employee) =>
        employee.maNhanVien.toLowerCase().includes(searchLower) ||
        employee.tenNhanVien.toLowerCase().includes(searchLower) ||
        employee.soDienThoai.includes(searchLower) ||
        employee.chucVu.toLowerCase().includes(searchLower) ||
        (employee.roleadminuser?.userName.toLowerCase().includes(searchLower) || false)
    )
  }, [data.employees, searchTerm])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/admin/api/employees`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Lỗi khi tải danh sách nhân viên")
      const employees: Employee[] = await res.json()

      const stats: Stats = {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((emp) => emp.trangThaiLamViec === nhanvien_trangThaiLamViec.DangLam).length,
        inactiveEmployees: employees.filter((emp) => emp.trangThaiLamViec === nhanvien_trangThaiLamViec.Nghi).length,
      }

      setData({ employees, stats })
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
    fetchEmployees()
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
            onClick={fetchEmployees}
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
              Quản lý nhân viên
            </h1>
            <p className="text-gray-600 text-lg">Quản lý và theo dõi thông tin nhân viên trong hệ thống</p>
          </div>
          <EmployeeDialog mode="create" onSuccess={fetchEmployees}>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Thêm nhân viên mới
            </Button>
          </EmployeeDialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Tổng nhân viên</p>
                  <p className="text-3xl font-bold">{data.stats.totalEmployees}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Đang làm việc</p>
                  <p className="text-3xl font-bold">{data.stats.activeEmployees}</p>
                </div>
                <UserCheck className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Nghỉ việc</p>
                  <p className="text-3xl font-bold">{data.stats.inactiveEmployees}</p>
                </div>
                <UserX className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm theo mã NV, tên, SĐT, chức vụ hoặc tên đăng nhập..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                Tìm thấy <span className="font-semibold text-blue-600">{filteredEmployees.length}</span> kết quả cho "
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
              Danh sách nhân viên
              {searchTerm && (
                <Badge variant="secondary" className="ml-2">
                  {filteredEmployees.length} kết quả
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                    <TableHead className="font-semibold text-gray-700 py-4">Mã NV</TableHead>
                    <TableHead className="font-semibold text-gray-700">Tên nhân viên</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Số điện thoại
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Chức vụ
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Ngày vào làm
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee: Employee, index: number) => (
                    <TableRow
                      key={employee.maNhanVien}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <TableCell className="font-mono font-medium text-blue-600 py-4">{employee.maNhanVien}</TableCell>
                      <TableCell className="font-semibold text-gray-800">{employee.tenNhanVien}</TableCell>
                      <TableCell className="text-gray-600">{employee.soDienThoai}</TableCell>
                      <TableCell>
                        <ChucVuBadge chucVu={employee.chucVu} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={employee.trangThaiLamViec} />
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(employee.ngayVaoLam).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <EmployeeDialog mode="edit" employee={employee} onSuccess={fetchEmployees}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Sửa
                            </Button>
                          </EmployeeDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredEmployees.length === 0 && !searchTerm && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Chưa có nhân viên nào</h3>
                <p className="text-gray-600">Hãy thêm nhân viên đầu tiên để bắt đầu quản lý</p>
                <EmployeeDialog mode="create" onSuccess={fetchEmployees}>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 mt-4">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm nhân viên đầu tiên
                  </Button>
                </EmployeeDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Search Results */}
        {filteredEmployees.length === 0 && searchTerm && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy kết quả</h3>
                <p className="text-gray-600">Không có nhân viên nào phù hợp với từ khóa "{searchTerm}"</p>
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