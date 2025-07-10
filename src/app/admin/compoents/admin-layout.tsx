"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import { cn } from "@/lib/utils"
import { Toaster } from "sonner"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AdminLayout({ children }: AdminLayoutProps) {
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
      {/* Sidebar cố định bên trái */}
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Content wrapper */}
      <div className={cn("flex flex-col flex-1", sidebarOpen ? "lg:ml-64" : "lg:ml-0")}>
        {/* Sticky Header */}
        <AdminHeader onToggleSidebar={toggleSidebar} />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Toaster richColors position="top-center" />
          {children}
        </main>
      </div>
    </div>
  )
}
