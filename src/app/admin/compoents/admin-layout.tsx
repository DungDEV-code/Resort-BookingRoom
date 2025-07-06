"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { cn } from "@/lib/utils"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
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
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content wrapper with push effect */}
      <div className="min-h-screen">
        {/* Header with push effect */}
        <div className={cn("transition-all duration-300 ease-in-out", sidebarOpen ? "lg:ml-64" : "lg:ml-0")}>
          <AdminHeader onToggleSidebar={toggleSidebar} title={title} />
        </div>

        {/* Main content with push effect */}
        <div className={cn("transition-all duration-300 ease-in-out", sidebarOpen ? "lg:ml-64" : "lg:ml-0")}>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
