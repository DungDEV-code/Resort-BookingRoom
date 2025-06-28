"use client";
import React, { useState, useEffect } from "react";
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
import BookingManagement from "../BookingManagement/BookingManagement";

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
  const { user, setUser } = useAuth();
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showBookingManagement, setShowBookingManagement] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component mount và khi có thay đổi
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include", // Đảm bảo gửi cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("User data from API:", data); // Debug log
          setUser(data.user);
        } else {
          // Nếu không có session, clear user
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setUser(null);
      }
    };

    // Kiểm tra ngay khi component mount
    checkAuthStatus();

    // Kiểm tra lại khi focus vào window (trường hợp user đăng nhập ở tab khác)
    const handleFocus = () => {
      checkAuthStatus();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [setUser]);

  // Kiểm tra URL params để xem có thông báo thành công từ Google login không
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      // Xóa param khỏi URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Kiểm tra lại trạng thái đăng nhập
      const checkAuthAfterGoogle = async () => {
        try {
          const response = await fetch("/api/me", {
            method: "GET",
            credentials: "include",
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("User data after Google login:", data);
            setUser(data.user);
          }
        } catch (error) {
          console.error("Error after Google login:", error);
        }
      };
      
      checkAuthAfterGoogle();
    }
  }, [setUser]);

  // Debug log để kiểm tra trạng thái
  useEffect(() => {
    console.log("Current user state:", user);
    console.log("showBookingManagement:", showBookingManagement);
  }, [user, showBookingManagement]);

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-[#1e90ff] border-2 border-[#1e90ff] rounded-full p-1 bg-white shadow hover:bg-[#1e90ff]/10"
                  onClick={() => {
                    console.log("CalendarCheck clicked");
                    setShowBookingManagement(true);
                  }}
                  title="Quản lý đặt phòng"
                >
                  <CalendarCheck className="h-6 w-6" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-[#1e90ff] border-2 border-[#ffd700] rounded-full p-1 bg-white shadow hover:bg-[#ffd700]/10"
                    >
                      {user.avatar || user.picture ? (
                        <Image
                          src={user.avatar || user.picture}
                          alt="User Avatar"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <UserRound className="h-8 w-8 text-[#1e90ff]" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 mt-2 mr-4">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {user.name || user.displayName || user.email}
                    </div>
                    <DropdownMenuSeparator />
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
                        try {
                          await fetch("/api/logout", { 
                            method: "POST",
                            credentials: "include"
                          });
                          setUser(null);
                          router.push("/");
                        } catch (error) {
                          console.error("Logout error:", error);
                        }
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
                      <div className="flex items-center space-x-2 px-2 py-1">
                        {user.avatar || user.picture ? (
                          <Image
                            src={user.avatar || user.picture}
                            alt="User Avatar"
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <UserRound className="h-6 w-6 text-[#1e90ff]" />
                        )}
                        <span className="text-sm text-[#1e293b]">
                          {user.name || user.displayName || user.email}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
                        onClick={() => {
                          console.log("Quản Lý Đặt Phòng clicked (mobile)");
                          setIsOpen(false);
                          setShowBookingManagement(true);
                        }}
                      >
                        Quản Lý Đặt Phòng
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#1e90ff] text-[#1e90ff] hover:bg-[#1e90ff]/10 px-4"
                        onClick={() => {
                          setIsOpen(false);
                          setShowAccountSettings(true);
                        }}
                      >
                        Cài Đặt Tài Khoản
                      </Button>
                      <Button
                        className="bg-red-600 text-white hover:bg-red-700 px-4"
                        onClick={async () => {
                          try {
                            await fetch("/api/logout", { 
                              method: "POST",
                              credentials: "include"
                            });
                            setUser(null);
                            setIsOpen(false);
                            router.push("/");
                          } catch (error) {
                            console.error("Logout error:", error);
                          }
                        }}
                      >
                        Đăng Xuất
                      </Button>
                    </>
                  ) : (
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
      {showAccountSettings && (
        <Account open={showAccountSettings} onClose={() => setShowAccountSettings(false)} />
      )}
      {showContact && (
        <ContactSupportForm open={showContact} onClose={() => setShowContact(false)} />
      )}
      {showBookingManagement && (
        <BookingManagement open={showBookingManagement} onClose={() => setShowBookingManagement(false)} />
      )}
    </>
  );
}

export default Header;