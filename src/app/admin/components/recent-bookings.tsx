import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarDays, MapPin } from "lucide-react"

interface RecentBookingsProps {
  bookings: Array<{
    maDatPhong: string
    thoiGianDat: string
    check_in: string | null
    check_out: string | null
    trangThai: string | null
    tongTien: number
    khachhang: {
      tenKhachHang: string
      soDienThoai: string
    }
    phong: {
      tenPhong: string
      loaiphong: {
        tenLoaiPhong: string
      }
    }
  }>
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "ChoXacNhan":
        return "bg-yellow-100 text-yellow-800"
      case "Check_in":
        return "bg-green-100 text-green-800"
      case "Check_out":
        return "bg-blue-100 text-blue-800"
      case "DaHuy":
        return "bg-red-100 text-red-800"
      case "YeuCauHuy":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "ChoXacNhan":
        return "Chờ xác nhận"
      case "Check_in":
        return "Đã Check-in"
      case "Check_out":
        return "Đã Check-out"
      case "DaHuy":
        return "Đã hủy"
      case "YeuCauHuy":
        return "Yêu cầu hủy"
      default:
        return "Không xác định"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đặt Phòng Gần Đây</CardTitle>
        <CardDescription>5 đặt phòng mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.maDatPhong} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Avatar>
                <AvatarFallback>{booking.khachhang.tenKhachHang.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{booking.khachhang.tenKhachHang}</p>
                  <Badge className={getStatusColor(booking.trangThai)}>{getStatusText(booking.trangThai)}</Badge>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {booking.phong.tenPhong} - {booking.phong.loaiphong.tenLoaiPhong}
                    </span>
                  </div>

                  {booking.check_in && booking.check_out && (
                    <div className="flex items-center space-x-1">
                      <CalendarDays className="h-3 w-3" />
                      <span>
                        {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Đặt lúc: {formatDate(booking.thoiGianDat)}</span>
                  <span className="text-sm font-semibold">{formatCurrency(Number(booking.tongTien))}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
