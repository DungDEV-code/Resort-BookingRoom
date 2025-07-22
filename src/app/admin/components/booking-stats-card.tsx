"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface BookingStats {
    totalBookings: number
    pendingBookings: number
    checkedInBookings: number
    cancelledBookings: number
}
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
export function BookingStatsCard() {
    const [stats, setStats] = useState<BookingStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBookingStats = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`${BASE_URL}/admin/api/stats?type=booking-stats`)
            if (!response.ok) throw new Error("Failed to fetch booking stats")
            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookingStats()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Thống Kê Đặt Phòng</span>
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
                        <span>Thống Kê Đặt Phòng</span>
                        <Button onClick={fetchBookingStats} variant="outline" size="sm">
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

    const bookingItems = [
        {
            label: "Tổng đặt phòng",
            value: stats.totalBookings,
            icon: Calendar,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
        },
        {
            label: "Chờ xác nhận",
            value: stats.pendingBookings,
            icon: Clock,
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200",
        },
        {
            label: "Đã check-in",
            value: stats.checkedInBookings,
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
        },
        {
            label: "Đã hủy",
            value: stats.cancelledBookings,
            icon: XCircle,
            color: "text-red-600",
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
        },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Thống Kê Đặt Phòng</span>
                    <Button onClick={fetchBookingStats} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>Tổng quan tình trạng đặt phòng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    {bookingItems.map((item, index) => (
                        <div
                            key={index}
                            className={`flex items-center space-x-3 p-3 rounded-lg border ${item.bgColor} ${item.borderColor}`}
                        >
                            <div className={`p-2 rounded-lg ${item.bgColor}`}>
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tỷ lệ thành công</span>
                        <Badge variant="outline">
                            {stats.totalBookings > 0
                                ? (((stats.totalBookings - stats.cancelledBookings) / stats.totalBookings) * 100).toFixed(1)
                                : 0}
                            %
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Đang hoạt động</span>
                        <Badge variant="secondary">{stats.pendingBookings + stats.checkedInBookings}</Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
