"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "./compoents/admin-sidebar"
import { AdminHeader } from "./compoents/admin-header"

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
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
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          "lg:ml-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0",
        )}
      >
        <AdminHeader onToggleSidebar={toggleSidebar} title={title} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
