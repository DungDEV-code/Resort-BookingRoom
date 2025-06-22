"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, UserCircle2, MessageSquare, Settings, LogOut, UserRound, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Account from "../Account-setting/Account";
import ContactSupportForm from "../Contact/ContactSupportForm";

const navigationItems = [
  { name: "Trang Chủ", href: "#index" },
  { name: "Phòng", href: "#roomtype" },
  { name: "Giới Thiệu", href: "#recommend" },
  { name: "Dịch Vụ và Tiện Ích", href: "#service" },
  { name: "Ưu Đãi", href: "#benefit" },
  { name: "Liên Hệ", href: "#Call" },
];

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, setUser } = useAuth(); // ✅ dùng context để xác định trạng thái đăng nhập
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showContact, setShowContact] = useState(false)
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-[#f8fafc]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[#f8fafc]/70 shadow-md">
        <div className="container flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/img/logo1.jpg"
              alt="Paradise Palms Resort Logo"
              width={48}
              height={48}
              className="rounded-md ml-2"
            />
            <span className="hidden font-bold text-xl text-[#1e90ff] sm:inline-block ml-1">
              Paradise Resort
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-base font-medium text-[#1e293b] transition-colors hover:text-[#ffd700]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4 pr-4">
            {user ? (
              <>
                {/* 👇 Icon quản lý đơn đặt phòng */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#1e90ff] border-2 border-[#1e90ff] rounded-full p-1 bg-white shadow hover:bg-[#1e90ff]/10"
                  onClick={() => router.push("/booking/history")}
                  title="Quản lý đặt phòng"
                >
                  <CalendarCheck className="h-6 w-6" />
                </Button>

                {/* 👇 Dropdown user menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-[#1e90ff] border-2 border-[#ffd700] rounded-full p-1 bg-white shadow hover:bg-[#ffd700]/10"
                    >
                      <UserRound className="h-8 w-8 text-[#1e90ff]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 mt-2 mr-4">
                    <DropdownMenuItem
                      onClick={() => {
                        setShowAccountSettings(true);
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài Đặt Tài Khoản</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowContact(true)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Liên Hệ Hỗ Trợ</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await fetch("/api/logout", { method: "POST" })
                        setUser(null)
                        router.push("/")
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Đăng Xuất</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="outline"
                size="default"
                className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
                onClick={() => router.push("/auth")}
              >
                Đăng Nhập
              </Button>
            )}
            <Button size="default" className="bg-[#1e90ff] text-white hover:bg-[#ffd700] hover:text-[#1e293b] px-4">
              <Link href="/rooms">Đặt Phòng</Link>
            </Button>
          </div>

          <Button variant="ghost" size="default" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6 text-[#1e90ff]" /> : <Menu className="h-6 w-6 text-[#1e90ff]" />}
          </Button>
        </div>

        {isOpen && (
          <div className="border-t bg-[#f8fafc] md:hidden">
            <nav className="container py-6">
              <div className="flex flex-col space-y-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-[#1e293b] hover:text-[#ffd700]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col space-y-3 pt-6 border-t">
                  {user ? (
                    <>
                      <Button
                        variant="outline"
                        className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/account");
                        }}
                      >
                        Cài Đặt Tài Khoản
                      </Button>
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700 px-4"
                        onClick={() => {
                          setUser(null);
                          setIsOpen(false);
                          router.push("/");
                        }}
                      >
                        Đăng Xuất
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="default"
                        className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/auth");
                        }}
                      >
                        Đăng Nhập
                      </Button>
                    </>
                  )}
                  <Button size="default" className="bg-[#1e90ff] text-white hover:bg-[#ffd700] hover:text-[#1e293b] px-4">
                    <Link href="/rooms">Đặt Phòng</Link>
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
      {/* ✅ Đặt ngay sau header, nhưng vẫn nằm trong JSX */}
      {
        showAccountSettings && (
          <Account open={showAccountSettings} onClose={() => setShowAccountSettings(false)} />
        )
      }
      {showContact && (
        <ContactSupportForm open={showContact} onClose={() => setShowContact(false)} />
      )}
    </>
  );
}

export default Header;