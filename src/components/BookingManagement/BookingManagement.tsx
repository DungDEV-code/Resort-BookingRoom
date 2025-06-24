"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Home,
  Eye,
  User,
  Phone,
  Mail,
  Banknote,
  Receipt,
  Package,
  X
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ServiceDetail {
  ma: string;
  tenDichVuLucDat: string;
  donGiaLucDat: number;
  soLuong: number;
  thanhTien: number;
}

interface Invoice {
  maHD: string;
  phuongThucThanhToan: string;
  trangThaiHD: "ChuaThanhToan" | "DaThanhToan" | null;
  tongTien: number;
  ngayTaoHD: string;
}

interface Booking {
  maDatPhong: string;
  check_in: string;
  check_out: string;
  trangThai: "Check_in" | "Check_out" | null;
  tongTien: number;
  thoiGianDat: string;
  phong: {
    maPhong: string;
    tenPhong: string;
    gia: number;
    hinhAnh: string;
    loaiphong: {
      tenLoaiPhong: string;
      soNguoi: number;
      soGiuong: number;
    };
  };
  dichvudatphong: ServiceDetail[];
  hoadon: Invoice[];
}

interface BookingManagementProps {
  open: boolean;
  onClose: () => void;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [newBookings, setNewBookings] = useState<Booking[]>([]);
  const [oldBookings, setOldBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (user && open) {
      const fetchBookings = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch("/api/bookings");
          if (!response.ok) {
            throw new Error("Không thể tải dữ liệu đặt phòng");
          }
          const data = await response.json();
          setNewBookings(data.new);
          setOldBookings(data.old);
        } catch (err) {
          setError("Đã xảy ra lỗi khi tải lịch sử đặt phòng");
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
    }
  }, [user, open]);

  // Format tiền tệ VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Check_in":
        return "bg-green-100 text-green-800 border-green-200";
      case "Check_out":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-orange-100 text-orange-800 border-orange-200";
  };

  const calculateStayDuration = (checkIn: string, checkOut: string) => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Kiểm tra xem có check-in và check-out không
  const hasCheckInOut = (booking: Booking) => {
    return booking.check_in && booking.check_out;
  };

  // Render thông tin thời gian dựa trên check-in/check-out hoặc thời gian đặt
  const renderTimeInfo = (booking: Booking) => {
    if (hasCheckInOut(booking)) {
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Check-in</p>
              <p className="font-semibold text-gray-900 text-sm">
                {format(new Date(booking.check_in), "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Check-out</p>
              <p className="font-semibold text-gray-900 text-sm">
                {format(new Date(booking.check_out), "dd/MM/yyyy", { locale: vi })}
              </p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Thời gian đặt</p>
            <p className="font-semibold text-gray-900">
              {format(new Date(booking.thoiGianDat), "dd/MM/yyyy HH:mm", { locale: vi })}
            </p>
          </div>
        </div>
      );
    }
  };

  const renderBookingDetail = () => {
    if (!selectedBooking) return null;

    const isPaid = selectedBooking.hoadon?.[0]?.trangThaiHD === "DaThanhToan";
    const stayDuration = selectedBooking.check_in && selectedBooking.check_out
      ? calculateStayDuration(selectedBooking.check_in, selectedBooking.check_out)
      : 1;
    const roomPrice = selectedBooking.phong?.gia ? selectedBooking.phong.gia * stayDuration : 0;
    const serviceTotal = selectedBooking.dichvudatphong?.reduce((sum, service) => sum + service.thanhTien, 0) || 0;

    return (
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-white pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              <span>Chi tiết đặt phòng #{selectedBooking.maDatPhong}</span>
            </DialogTitle>
            <DialogClose />
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Room Info */}
            {selectedBooking.phong && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-green-600" />
                  Thông tin phòng
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <img
                      src={selectedBooking.phong.hinhAnh ? `/img/rooms/${selectedBooking.phong.hinhAnh}` : "/img/room/placeholder-room.jpg"}
                      alt={selectedBooking.phong.tenPhong || "Phòng"}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedBooking.phong.tenPhong || "N/A"}</h4>
                      <p className="text-blue-600 font-semibold">{selectedBooking.phong.loaiphong?.tenLoaiPhong || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Sức chứa</p>
                        <p className="font-semibold">{selectedBooking.phong.loaiphong?.soNguoi || 0} người</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Số giường</p>
                        <p className="font-semibold">{selectedBooking.phong.loaiphong?.soGiuong || 0} giường</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Giá phòng/đêm</p>
                        <p className="font-semibold text-green-600">{formatCurrency(selectedBooking.phong.gia || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Số đêm</p>
                        <p className="font-semibold">{stayDuration} đêm</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Details */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Chi tiết đặt phòng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {selectedBooking.check_in && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-bold text-green-600">
                      {format(new Date(selectedBooking.check_in), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                )}
                {selectedBooking.check_out && (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-bold text-red-600">
                      {format(new Date(selectedBooking.check_out), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                )}
                {selectedBooking.thoiGianDat && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Thời gian đặt</p>
                    <p className="font-bold text-blue-600">
                      {format(new Date(selectedBooking.thoiGianDat), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Services */}
            {selectedBooking.dichvudatphong && selectedBooking.dichvudatphong.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-orange-600" />
                  Dịch vụ đã sử dụng
                </h3>
                <div className="space-y-3">
                  {selectedBooking.dichvudatphong.map((service, index) => (
                    <div key={service.ma || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{service.tenDichVuLucDat || "N/A"}</p>
                        <p className="text-sm text-gray-600">
                          {service.soLuong || 0} x {formatCurrency(service.donGiaLucDat || 0)}
                        </p>
                      </div>
                      <p className="font-bold text-orange-600">{formatCurrency(service.thanhTien || 0)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between p-3 items-center bg-gray-100 rounded-lg mt-4">
                    <div>
                      <p className="font-semibold">Tổng các dịch vụ</p>
                      <p className="text-sm text-gray-600">
                        (Gồm {selectedBooking.dichvudatphong.length} dịch vụ)
                      </p>
                    </div>
                    <p className="font-bold text-orange-600">{formatCurrency(serviceTotal)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Tóm tắt thanh toán
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiền phòng ({stayDuration} đêm)</span>
                  <span className="font-semibold">{formatCurrency(roomPrice)}</span>
                </div>
                {serviceTotal > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tiền dịch vụ</span>
                    <span className="font-semibold">{formatCurrency(serviceTotal)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Tổng cộng</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedBooking.hoadon?.[0]?.tongTien || selectedBooking.tongTien)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600">Phương thức thanh toán</span>
                  <span className="font-semibold">{selectedBooking.hoadon[0]?.phuongThucThanhToan || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trạng thái thanh toán</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(isPaid)}`}>
                    {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderBookingItem = (booking: Booking) => {
    const isPaid = booking.hoadon?.[0]?.trangThaiHD === "DaThanhToan";

    return (
      <div key={booking.maDatPhong} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">#{booking.maDatPhong || "N/A"}</h4>
              <p className="text-sm text-gray-500">Mã đặt phòng</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(isPaid)}`}>
              {isPaid ? "Đã Thanh Toán" : "Chưa Thanh Toán"}
            </span>
          </div>
        </div>

        {/* Room Info */}
        {booking.phong && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-900">{booking.phong.tenPhong || "N/A"}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 ml-6">{booking.phong.loaiphong?.tenLoaiPhong || "N/A"}</p>
          </div>
        )}

        {/* Time Info */}
        <div className="mb-4">
          {renderTimeInfo(booking)}
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div>
              <p className="text-sm text-gray-600">Tổng tiền</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(booking.hoadon?.[0]?.tongTien || booking.tongTien || 0)}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setSelectedBooking(booking)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 opacity-0 group-hover:opacity-100">
            <Eye className="w-4 h-4" />
            <span>Xem chi tiết</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quản Lý Đặt Phòng
            </DialogTitle>
            <DialogClose />
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
                <p className="text-gray-600">Đang tải dữ liệu...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-red-600">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-lg font-semibold mb-2">Oops! Có lỗi xảy ra</p>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : (
              <Tabs defaultValue="new" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                  <TabsTrigger value="new" className="flex items-center space-x-2 text-base">
                    <Clock className="w-4 h-4" />
                    <span>Lịch sử mới ({newBookings.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="old" className="flex items-center space-x-2 text-base">
                    <CheckCircle className="w-4 h-4" />
                    <span>Lịch sử cũ ({oldBookings.length})</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="flex-1">
                  <div className="space-y-1 max-h-[calc(90vh-250px)] overflow-y-auto pr-2">
                    {newBookings.length > 0 ? (
                      <div className="grid gap-4">
                        {newBookings.map(renderBookingItem)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Clock className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có đặt phòng mới</h3>
                        <p className="text-gray-500 text-center">Lịch sử đặt phòng mới sẽ xuất hiện ở đây</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="old" className="flex-1 overflow-auto">
                  <div className="space-y-1 max-h-[calc(90vh-250px)] overflow-y-auto pr-2">
                    {oldBookings.length > 0 ? (
                      <div className="grid gap-4">
                        {oldBookings.map(renderBookingItem)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có lịch sử cũ</h3>
                        <p className="text-gray-500 text-center">Các đặt phòng đã hoàn thành sẽ hiển thị ở đây</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Modal */}
      {renderBookingDetail()}
    </>
  );
};

export default BookingManagement;