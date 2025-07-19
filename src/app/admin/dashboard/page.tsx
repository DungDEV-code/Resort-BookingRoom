"use client"

import { useEffect, useState } from "react"
import { RoomStatsCard } from "../compoents/room-stats-card"
import { RevenueStatsCard } from "../compoents/revenue-stats-card"
import { CustomerStatsCard } from "../compoents/customer-stats-card"
import { TopServiceCard } from "../compoents/top-service-card"
import { BookingStatsCard } from "../compoents/booking-stats-card"
import { RevenueChart } from "../compoents/revenue-chart"
import { PopularServices } from "../compoents/popular-services"

export default function AdminPage() {
  const [chartData, setChartData] = useState<any[]>([])
  const [popularServices, setPopularServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdditionalData = async () => {
      try {
        const [revenueRes, servicesRes] = await Promise.all([
          fetch("/api/dashboard/revenue"),
          fetch("/api/dashboard/services"),
        ])

        if (revenueRes.ok && servicesRes.ok) {
          const [revenue, services] = await Promise.all([revenueRes.json(), servicesRes.json()])

          setChartData(revenue.revenueData || [])
          setPopularServices(services.popularServices || [])
        }
      } catch (error) {
        console.error("Error fetching additional data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdditionalData()
  }, [])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Trang Quản Trị</h2>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RoomStatsCard />
        <RevenueStatsCard />
        <CustomerStatsCard />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopServiceCard />
        <BookingStatsCard />
      </div>

      {/* Charts Section */}
      {!loading && chartData && chartData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Biểu Đồ Doanh Thu</h3>
          <RevenueChart data={chartData} />
        </div>
      )}

      {/* Additional Data Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {!loading && popularServices.length > 0 && <PopularServices services={popularServices} />}
      </div>
    </div>
  )
}
