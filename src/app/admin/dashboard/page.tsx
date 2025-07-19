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
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [revenueRes, serviceRes] = await Promise.all([
          fetch(`${BASE_URL}/admin/api/stats?type=total-revenue`),
          fetch(`${BASE_URL}/admin/api/stats?type=top-service`),
        ]);

        if (revenueRes.ok && serviceRes.ok) {
          const revenue = await revenueRes.json();
          const service = await serviceRes.json();

          setChartData([
            {
              name: "Tổng doanh thu",
              doanhThu: revenue.totalRevenue || 0,
            },
            {
              name: "Doanh thu tháng này",
              doanhThu: revenue.monthlyRevenue || 0,
            },
          ]);

          setPopularServices(service.services || []);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Trang Quản Trị</h2>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RoomStatsCard />
        <RevenueStatsCard />
        <BookingStatsCard />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {!loading && popularServices.length > 0 && <PopularServices services={popularServices} />}
        <CustomerStatsCard />
      </div>
   
      {/* Charts Section */}
      {!loading && chartData && chartData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Biểu Đồ Doanh Thu</h3>
          <RevenueChart data={chartData} />
        </div>
      )}


    </div>
  )
}
