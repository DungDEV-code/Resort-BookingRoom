"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  AlertCircle,
  Package,
  User,
  Hash,
  DollarSign,
  Calendar,
  Settings,
} from "lucide-react";

// Hàm chuẩn hóa chuỗi tiếng Việt
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Interface cho dữ liệu dịch vụ đặt phòng
interface BookingService {
  ma: string;
  maDatPhong: string;
  tenDV: string;
  soLuong: number;
  donGiaLucDat: number;
  thanhTien: number;
  tenKhachHang: string;
  dichvudatphong_trangThaiDV: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function formatTrangThaiDV(status: string): string {
  switch (status) {
    case "ChuaHoanThanh":
      return "Chưa Hoàn Thành";
    case "DaHoanThanh":
      return "Đã Hoàn Thành";
    default:
      return "Không xác định";
  }
}

export default function ServiceBookingPage() {
  const [bookingServices, setBookingServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Lấy dữ liệu từ API khi searchTerm thay đổi
  useEffect(() => {
    const fetchBookingServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${BASE_URL}/admin/api/services-booking?search=${encodeURIComponent(
            searchTerm
          )}`,
          {
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Lỗi khi lấy danh sách dịch vụ đặt phòng");
        }
        const data = await response.json();
        setBookingServices(data);
      } catch (err: any) {
        console.error("Fetch error:", err.message);
        setError("Không thể tải dữ liệu dịch vụ đặt phòng");
      } finally {
        setLoading(false);
      }
    };

    // Debounce để tránh gọi API quá nhanh
    const timeout = setTimeout(fetchBookingServices, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleRefresh = () => {
    setSearchTerm("");
    setBookingServices([]);
    setLoading(true);
  };

  const handleUpdateStatus = async (ma: string) => {
    setUpdating(ma);
    setError(null);
    try {
      const response = await fetch(
        `${BASE_URL}/admin/api/services-booking/${ma}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Cập nhật trạng thái thất bại");
      }

      const data = await response.json();
      setBookingServices((prev) =>
        prev.map((item) =>
          item.ma === ma
            ? { ...item, dichvudatphong_trangThaiDV: data.trangThaiDV }
            : item
        )
      );
    } catch (err: any) {
      console.error("Update error:", err.message);
      setError("Lỗi khi cập nhật trạng thái dịch vụ");
    } finally {
      setUpdating(null);
    }
  };

  // Lọc client-side với xử lý diacritics
  const filteredServices = useMemo(() => {
    if (!searchTerm) return bookingServices;
    const searchNormalized = removeDiacritics(searchTerm.toLowerCase());
    return bookingServices.filter((item) => {
      const maLower = item.ma ? item.ma.toLowerCase() : "";
      const tenKhachHangLower = item.tenKhachHang
        ? removeDiacritics(item.tenKhachHang.toLowerCase())
        : "";
      return (
        maLower.includes(searchNormalized) ||
        tenKhachHangLower.includes(searchNormalized)
      );
    });
  }, [bookingServices, searchTerm]);

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
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              Quản Lý Dịch Vụ Đặt Phòng
            </h1>
            <p className="text-gray-600 text-lg">
              Quản lý và theo dõi các dịch vụ đã được đặt kèm phòng
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên khách"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

        {/* Bảng dữ liệu hoặc trạng thái không có dữ liệu */}
        {!loading && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Danh sách dịch vụ đặt phòng
                <Badge variant="secondary" className="ml-2">
                  {filteredServices.length} dịch vụ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredServices.length === 0 ? (
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Không có dữ liệu
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Không tìm thấy dịch vụ đặt phòng phù hợp với tìm kiếm của bạn.
                  </p>
                </CardContent>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                        <TableHead className="font-semibold text-gray-700 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Mã
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Mã Đặt Phòng
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Tên Dịch Vụ
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Số Lượng
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DollarSign className="h-4 w-4" />
                            Đơn Giá
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DollarSign className="h-4 w-4" />
                            Thành Tiền
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Khách Hàng
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Trạng Thái Dịch Vụ
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">
                          Hành Động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service, index) => (
                        <TableRow
                          key={service.ma}
                          className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            }`}
                        >
                          <TableCell className="font-mono font-medium text-blue-600 py-4">
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-600 border-blue-200"
                            >
                              {service.ma}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-600 hover:bg-purple-200"
                            >
                              {service.maDatPhong}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-gray-800">
                            {service.tenDV}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="font-mono bg-emerald-100 text-emerald-600 border-emerald-200"
                            >
                              {service.soLuong}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="secondary"
                              className="font-mono font-semibold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 hover:from-emerald-200 hover:to-green-200"
                            >
                              {new Intl.NumberFormat("vi-VN").format(service.donGiaLucDat)} VND
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="secondary"
                              className="font-mono font-semibold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 hover:from-emerald-200 hover:to-green-200"
                            >
                              {new Intl.NumberFormat("vi-VN").format(service.thanhTien)} VND
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-gray-800">
                                {service.tenKhachHang}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold text-gray-800">
                                {formatTrangThaiDV(service.dichvudatphong_trangThaiDV)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              onClick={() => handleUpdateStatus(service.ma)}
                              disabled={updating === service.ma}
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              {updating === service.ma ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Đang cập nhật...
                                </>
                              ) : (
                                <>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Cập nhật
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}