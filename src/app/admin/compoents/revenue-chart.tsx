"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

interface RevenueChartProps {
  data: Array<{
    month: string
    revenue: number
    bookings: number
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
    }).format(value)
  }

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-")
    return `${monthNum}/${year}`
  }

  const chartData = data.map((item) => ({
    ...item,
    month: formatMonth(item.month),
    revenue: Number(item.revenue),
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Doanh Thu Theo Tháng</CardTitle>
          <CardDescription>Doanh thu 12 tháng gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Doanh thu"]}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={{ fill: "#8884d8" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Số Lượng Đặt Phòng</CardTitle>
          <CardDescription>Số đặt phòng theo tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value, "Đặt phòng"]}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Bar dataKey="bookings" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
