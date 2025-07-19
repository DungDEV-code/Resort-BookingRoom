import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PopularServicesProps {
    services: Array<{
        maDichVu: string
        tenDV: string | null
        giaDV: number | null
        _sum: {
            soLuong: number | null
            ThanhTien: number | null
        }
        _count: {
            maDichVu: number
        }
    }>
}

export function PopularServices({ services }: PopularServicesProps) {
    const maxQuantity = Math.max(...services.map((s) => s._sum.soLuong || 0))
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dịch Vụ Phổ Biến</CardTitle>
                <CardDescription>Top 5 dịch vụ được sử dụng nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {services.map((service, index) => {
                        const quantity = service._sum.soLuong || 0
                        const revenue = service._sum.ThanhTien || 0
                        const percentage = maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0

                        return (
                            <div key={service.maDichVu} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">#{index + 1}</span>
                                        <span className="text-sm">{service.tenDV || "Không xác định"}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">{quantity} lần</div>
                                        <div className="text-xs text-muted-foreground">{formatCurrency(Number(revenue))}</div>
                                    </div>
                                </div>
                                <Progress value={percentage} className="h-2" />
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
