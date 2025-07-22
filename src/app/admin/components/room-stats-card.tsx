"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Users, TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface RoomStats {
    totalRooms: number
    availableRooms: number
    occupiedRooms: number
    occupancyRate: string
}

export function RoomStatsCard() {
    const [stats, setStats] = useState<RoomStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const fetchRoomStats = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`${BASE_URL}/admin/api/stats?type=room-stats`)
            if (!response.ok) throw new Error("Failed to fetch room stats")
            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoomStats()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Thống Kê Phòng</span>
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
                        <span>Thống Kê Phòng</span>
                        <Button onClick={fetchRoomStats} variant="outline" size="sm">
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
                    <span>Thống Kê Phòng</span>
                    <Button onClick={fetchRoomStats} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>Tình trạng phòng hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <Home className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Tổng phòng</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalRooms}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Phòng trống</p>
                            <p className="text-2xl font-bold text-green-600">{stats.availableRooms}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tỷ lệ lấp đầy</span>
                        <Badge variant="secondary" className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{stats.occupancyRate}%</span>
                        </Badge>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.occupancyRate}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Phòng đã đặt: {stats.occupiedRooms}</span>
                        <span>Phòng trống: {stats.availableRooms}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
