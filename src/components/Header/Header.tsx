"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"

const navigationItems = [
  { name: "Trang Chủ", href: "#index" },
  { name: "Phòng", href: "#roomtype" },
  { name: "Giới Thiệu", href: "#recommend" },
  { name: "Dịch Vụ và Tiện Ích", href: "#service" },
  { name: "Liên Hệ", href: "/contact" },
];

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  return (
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
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="outline"
            size="default"
            className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
            onClick={() => router.push("/auth")} // ✅ CHỈNH NÚT NÀY
          >
            Đăng Nhập
          </Button>
          <Button size="default" className="bg-[#1e90ff] text-white hover:bg-[#ffd700] hover:text-[#1e293b] px-4">
            Đặt Phòng
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
                <Button variant="outline" size="default" className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/auth"); // ✅ Mobile "Đăng Nhập"
                  }}>
                  Đăng Nhập
                </Button>
                <Button size="default" className="bg-[#1e90ff] text-white hover:bg-[#ffd700] hover:text-[#1e293b] px-4">
                  Đặt Phòng
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
