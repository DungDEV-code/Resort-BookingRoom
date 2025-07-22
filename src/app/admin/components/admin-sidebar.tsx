"use client"

import { CalendarDays, Contact, Home, Hotel, Package, Settings, Users, Bed, BookOpen, Percent, X, ClipboardList, CreditCard, MessageSquare, MessagesSquare } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Quản lý nhân viên",
    url: "/admin/employees",
    icon: Users,
  },
  {
    title: "Quản lý lịch làm",
    url: "/admin/work-schedule",
    icon: CalendarDays,
  },
  {
    title: "Quản lý phòng",
    url: "/admin/rooms",
    icon: Bed,
  },
  {
    title: "Quản lý dịch vụ",
    url: "/admin/services",
    icon: Package,
  },
  {
    title: "Quản lý loại phòng",
    url: "/admin/room-types",
    icon: Hotel,
  },
  {
    title: "Quản lý đơn đặt phòng",
    url: "/admin/bookings",
    icon: BookOpen,
  },
  {
    title: "Quản lý hóa đơn",
    url: "/admin/invoices",
    icon: CreditCard,
  },
  {
    title: "Quản lý dịch vụ đặt phòng",
    url: "/admin/services-booking",
    icon: ClipboardList,
  },
  {
    title: "Quản lý ưu đãi",
    url: "/admin/vouchers",
    icon: Percent,
  },
  {
    title: "Quản lý tài khoản",
    url: "/admin/accounts",
    icon: Settings,
  },
  {
    title: "Liên hệ hỗ trợ",
    url: "/admin/support",
    icon: Contact,
  },
  {
    title: "Quản lý bình luận",
    url: "/admin/comments",
    icon: MessagesSquare,
  }
]

interface AdminSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out",
          "w-64 shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Hotel className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-gray-900">Hotel Admin</span>
                <span className="truncate text-xs text-gray-500">Quản lý khách sạn</span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <div className="px-2 py-2">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quản lý hệ thống</h2>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.url ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">Hotel Admin v1.0</div>
        </div>
      </div>
    </>
  )
}
