"use client"

import { Menu, Bell, ChevronDown, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminHeaderProps {
  onToggleSidebar: () => void
  title?: string
}

export function AdminHeader({ onToggleSidebar, title = "Dashboard" }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onToggleSidebar}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      {/* Right side - notifications, user menu */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src="/placeholder.svg?height=28&width=28" alt="Admin" />
                <AvatarFallback className="text-xs bg-blue-600 text-white">AD</AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-xs">
                <span className="font-medium text-gray-900">Admin User</span>
                <span className="text-gray-500">admin@hotel.com</span>
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border-gray-200" align="end" sideOffset={8}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                  <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-gray-900">Admin User</span>
                  <span className="truncate text-xs text-gray-500">admin@hotel.com</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="text-gray-700 hover:bg-gray-100">
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt tài khoản
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-700 hover:bg-gray-100">
              <User className="mr-2 h-4 w-4" />
              Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem className="text-red-600 hover:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
