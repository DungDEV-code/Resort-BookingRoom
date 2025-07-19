import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, DollarSign, Clock, CheckCircle, Home, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalBookings: number
    totalCustomers: number
    totalRooms: number
    totalRevenue: number
    pendingBookings: number
    checkedInBookings: number
    availableRooms: number
    occupancyRate: string
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Tổng Doanh Thu",
      value: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(Number(stats.totalRevenue)),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Tổng Đặt Phòng",
      value: stats.totalBookings.toString(),
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Khách Hàng",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Tỷ Lệ Lấp Đầy",
      value: `${stats.occupancyRate}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const statusCards = [
    {
      title: "Chờ Xác Nhận",
      value: stats.pendingBookings,
      icon: Clock,
      variant: "secondary" as const,
    },
    {
      title: "Đang Check-in",
      value: stats.checkedInBookings,
      icon: CheckCircle,
      variant: "default" as const,
    },
    {
      title: "Phòng Trống",
      value: stats.availableRooms,
      icon: Home,
      variant: "outline" as const,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statusCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">{card.value}</span>
                <Badge variant={card.variant}>{card.title}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
