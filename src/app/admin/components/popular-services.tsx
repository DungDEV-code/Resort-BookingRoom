import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PopularServicesProps {
  services: Array<{
    maDichVu: string
    tenDV: string | null
    giaDV: number | null
    tongSoLuong: number
    doanhThu: number
    soLanSuDung: number
  }>
}

export function PopularServices({ services }: PopularServicesProps) {
  const maxQuantity = services.length > 0
    ? Math.max(...services.map((s) => s.tongSoLuong ?? 0))
    : 0

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dịch Vụ Phổ Biến</CardTitle>
        <CardDescription>Top 5 dịch vụ được sử dụng nhiều nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services && services.length > 0 ? (
            services.map((service, index) => {
              const quantity = service.tongSoLuong ?? 0
              const revenue = service.doanhThu ?? 0
              const percentage = maxQuantity > 0
                ? (quantity / maxQuantity) * 100
                : 0

              return (
                <div key={service.maDichVu} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">#{index + 1}</span>
                      <span className="text-sm">{service.tenDV || "Không xác định"}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{quantity} lần</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(revenue)}
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Không có dữ liệu dịch vụ.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
