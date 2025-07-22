"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface TopServiceStats {
    topService: {
        maDichVu: string
        tenDichVu: string
        soLanSuDung: number
        doanhThu: number
    } | null
}
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
export function TopServiceCard() {
    const [stats, setStats] = useState<TopServiceStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTopServiceStats = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`${BASE_URL}/admin/api/stats?type=top-service`)
            if (!response.ok) throw new Error("Failed to fetch top service stats")
            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTopServiceStats()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Dịch Vụ Hàng Đầu</span>
                        <Skeleton className="h-4 w-4" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Dịch Vụ Hàng Đầu</span>
                        <Button onClick={fetchTopServiceStats} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">Lỗi: {error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!stats?.topService) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Dịch Vụ Hàng Đầu</span>
                        <Button onClick={fetchTopServiceStats} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Chưa có dữ liệu dịch vụ</p>
                </CardContent>
            </Card>
        )
    }

    const { topService } = stats

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Dịch Vụ Hàng Đầu</span>
                    <Button onClick={fetchTopServiceStats} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>Dịch vụ được sử dụng nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{topService.tenDichVu}</h3>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                #1
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Mã: {topService.maDichVu}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-muted-foreground">Lần sử dụng</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{topService.soLanSuDung}</p>
                    </div>

                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <span className="text-sm text-muted-foreground">Doanh thu</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">
                            {formatCurrency(Number(topService.doanhThu))}
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Trung bình/lần</span>

                        <span className="font-medium">
                            {topService.soLanSuDung > 0
                                ? formatCurrency(Number(topService.doanhThu) / topService.soLanSuDung)
                                : formatCurrency(0)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
