"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Crown, TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface CustomerStats {
  customerCount: number
  mostBookedCustomer: {
    maKH: string
    tenKH: string
    soLanDat: number
  } | null
  biggestSpender: {
    maKH: string
    tenKH: string
    tongChiTieu: number
  } | null
}

export function CustomerStatsCard() {
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const fetchCustomerStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${BASE_URL}/admin/api/stats?type=customer-count`)
      if (!response.ok) throw new Error("Không thể tải dữ liệu thống kê khách hàng")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerStats()
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
            <span>Thống Kê Khách Hàng</span>
            <Skeleton className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
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
            <span>Thống Kê Khách Hàng</span>
            <Button onClick={fetchCustomerStats} variant="outline" size="sm" aria-label="Reload stats">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-500 mb-2">Lỗi: {error}</p>
              <Button onClick={fetchCustomerStats} variant="outline" size="sm">
                Thử lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Thống Kê Khách Hàng</span>
          <Button onClick={fetchCustomerStats} variant="outline" size="sm" aria-label="Reload stats">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>Tổng quan và khách hàng VIP</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tổng khách hàng */}
        <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
            <p className="text-3xl font-bold text-purple-600">{stats.customerCount}</p>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Tổng cộng
          </Badge>
        </div>

        {/* Khách hàng VIP */}
        <div className="grid gap-3">
          {/* Khách hàng đặt phòng nhiều nhất */}
          {stats.mostBookedCustomer ? (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Khách hàng thân thiết</span>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  #{stats.mostBookedCustomer.soLanDat} lần
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{stats.mostBookedCustomer.tenKH}</p>
                <p className="text-xs text-muted-foreground">Mã KH: {stats.mostBookedCustomer.maKH}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu khách hàng đặt phòng</p>
            </div>
          )}

          {/* Khách hàng chi tiêu nhiều nhất */}
          {stats.biggestSpender ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Khách hàng VIP</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {formatCurrency(stats.biggestSpender.tongChiTieu)}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{stats.biggestSpender.tenKH}</p>
                <p className="text-xs text-muted-foreground">Mã KH: {stats.biggestSpender.maKH}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu khách hàng chi tiêu</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{stats.mostBookedCustomer?.soLanDat || 0}</p>
              <p className="text-xs text-muted-foreground">Đặt phòng tối đa</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">
                {stats.biggestSpender ? formatCurrency(stats.biggestSpender.tongChiTieu) : "0 ₫"}
              </p>
              <p className="text-xs text-muted-foreground">Chi tiêu tối đa</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
