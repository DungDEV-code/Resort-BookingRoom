"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface RevenueStats {
    totalRevenue: number
    monthlyRevenue: number
}

export function RevenueStatsCard() {
    const [stats, setStats] = useState<RevenueStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const fetchRevenueStats = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${BASE_URL}/admin/api/stats?type=total-revenue`)
            if (!response.ok) throw new Error("Failed to fetch revenue stats")
            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRevenueStats()
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
                        <span>Thống Kê Doanh Thu</span>
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
                        <span>Thống Kê Doanh Thu</span>
                        <Button onClick={fetchRevenueStats} variant="outline" size="sm">
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

    if (!stats) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Thống Kê Doanh Thu</span>
                    <Button onClick={fetchRevenueStats} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>Tổng quan doanh thu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(Number(stats.totalRevenue))}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground">Doanh thu tháng này</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(Number(stats.monthlyRevenue))}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tỷ lệ tháng/tổng</span>
                        <span className="font-medium">
                            {stats.totalRevenue > 0
                                ? ((Number(stats.monthlyRevenue) / Number(stats.totalRevenue)) * 100).toFixed(1)
                                : 0}
                            %
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
