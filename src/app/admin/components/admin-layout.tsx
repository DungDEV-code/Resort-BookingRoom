"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"

  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isLoginPage && (
        <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      )}

      <div
        className={cn(
          "flex flex-col flex-1",
          !isLoginPage && sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}
      >
        {!isLoginPage && (
          <AdminHeader onToggleSidebar={toggleSidebar} />
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Toaster richColors position="top-center" />
          {children}
        </main>
      </div>
    </div>
  )
}
