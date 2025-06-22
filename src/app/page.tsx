"use client";

import Image from "next/image";
import { useState, useEffect, useRef, JSX } from 'react';
import Header from "@/components/Header/Header";
import RoomType from "@/components/Room/RoomType";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Bed, Facebook, Instagram, Mail, MapPin, Phone, Sparkles, Twitter, Utensils, Waves } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FaChild, FaDumbbell, FaFacebook, FaGolfBall, FaInstagram, FaLeaf, FaShip, FaTableTennis, FaTwitter, FaWater } from "react-icons/fa";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { RoomTypeProps } from "@/components/Room/RoomType";
import Service, { Services } from "@/components/Service/Service";
import AnimatedSection from "@/components/ui/AnimatedSection";

const banners = [
  { src: '/img/banner1.jpg', alt: 'ảnh' },
  { src: '/img/banner2.webp', alt: 'ảnh' },
  { src: '/img/banner3.webp', alt: 'ảnh' },
  { src: '/img/banner4.jpg', alt: 'ảnh' },
];
const iconMap: Record<string, JSX.Element> = {
  spa: <Sparkles className="h-6 w-6" />,
  dining: <Utensils className="h-6 w-6" />,
  beach: <Waves className="h-6 w-6" />,
  massage: <Sparkles className="h-6 w-6" />,       // dùng chung icon spa
  restaurant: <Utensils className="h-6 w-6" />,
  bar: <Utensils className="h-6 w-6" />,           // tạm thời dùng icon chung
  pool: <Waves className="h-6 w-6" />,
  gym: <FaDumbbell className="h-6 w-6" />,         // import thêm từ react-icons nếu muốn
  yoga: <FaLeaf className="h-6 w-6" />,
  kids: <FaChild className="h-6 w-6" />,
  golf: <FaGolfBall className="h-6 w-6" />,
  tennis: <FaTableTennis className="h-6 w-6" />,
  boat: <FaShip className="h-6 w-6" />,
  diving: <FaWater className="h-6 w-6" />,
};

const featuresMap: Record<string, string[]> = {
  spa: ["Massage thư giãn", "Spa cao cấp", "Phòng xông hơi"],
  dining: ["Nhà hàng 5 sao", "Ẩm thực quốc tế", "Bữa sáng buffet"],
  beach: ["Bãi biển riêng", "Thể thao dưới nước", "Khu vực thư giãn"],
};

const colorMap: Record<string, string> = {
  spa: "bg-green-500",
  dining: "bg-orange-500",
  beach: "bg-blue-500",
};
export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rooms, setRooms] = useState<RoomTypeProps[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<Services[]>([]);

  // Tự động chuyển ảnh sau mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        const enrichedServices = data.map((service: any, index: number) => ({
          ...service,
          // giaDV: service.giaDV, // Example pricing
          anhDV: service.anhDV || `/img/service${index + 1}.jpg`,
          features: featuresMap[service.maDV] || ["Dịch vụ cao cấp", "Trải nghiệm độc đáo"],
          icon: iconMap[service.maDV] || <Sparkles className="h-6 w-6" />,
          color: colorMap[service.maDV] || "bg-gray-500",
        }));
        setServices(enrichedServices);
      })
      .catch((error) => console.error("Error fetching services:", error));
  }, []);

  useEffect(() => {
    fetch("/api/roomType")
      .then((res) => res.json())
      .then((data) => {
        const enrichedRooms = data.map((rooms: any, index: number) => {
          const basePrice = 6000000;
          const discountStep = index * 500000;

          return {
            ...rooms,
            price: basePrice - discountStep, // giá giảm dần
            originalPrice: basePrice,        // giá gốc cố định
            amenities: ["Wifi miễn phí", "Ban công riêng", "Điều hòa", "Mini Bar"],
            rating: 4.5 + (index % 2) * 0.3,
            isPopular: index % 2 === 0
          };
        });
        setRooms(enrichedRooms);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const container = carouselRef.current;
        const scrollAmount = container.querySelector('div')?.clientWidth || 0; // scroll từng card
        const maxScrollLeft = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft + scrollAmount >= maxScrollLeft) {
          container.scrollTo({ left: 0, behavior: 'smooth' }); // quay về đầu
        } else {
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }
    }, 4000); // mỗi 4 giây

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Phần đầu trang (Hero Section) */}
        <section id="index" className="relative h-[80vh] w-full overflow-hidden">
          {banners.map((banner, index) => (
            <Image
              key={index}
              src={banner.src}
              alt={banner.alt}
              fill
              className={`object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              priority={index === 0}
            />
          ))}
          <div className="absolute inset-0 bg-black/30" />
          <div className="container absolute inset-0 flex flex-col items-center justify-center text-center">
            <Badge className="mb-4 px-4 py-2 text-lg font-semibold rounded-xl bg-white/20 text-white border border-white/30 shadow-md backdrop-blur">
              ⭐ Resort 5 Sao Hàng Đầu Việt Nam
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Khu Nghỉ Dưỡng Paradise Resort
            </h1>
            <p className="mt-4 max-w-[700px] text-lg text-white/90 md:text-xl">
              Hãy tận hưởng kỳ nghỉ thiên đường, nơi đẳng cấp hòa quyện với thiên nhiên – dịch vụ cao cấp, cảnh sắc
              ngoạn mục, và những kỷ niệm không thể nào quên.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                className="group relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 
                 text-white font-semibold text-xl py-6 px-12 rounded-xl shadow-2xl 
                 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 
                 hover:scale-105 hover:shadow-3xl 
                 transition-all duration-500 
                 flex items-center justify-center 
                 w-full sm:w-auto overflow-hidden
                 ring-2 ring-amber-400/40 hover:ring-amber-500/70"
              >
                <Link href="/rooms" className="relative z-10 flex items-center gap-3">
                  Đặt Phòng Ngay
                  <Sparkles className="h-6 w-6 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                </Link>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent 
                      translate-x-[-150%] group-hover:translate-x-[150%] 
                      transition-transform duration-1000 ease-in-out pointer-events-none" />
              </button>
            </div>
          </div>
        </section>

        {/* Phần chào mừng */}
        <section id="recommend" className="bg-sky-50 py-16 scroll-mt-24">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Chào mừng đến với thiên đường</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Nằm bên bãi biển cát trắng nguyên sơ và làn nước trong xanh, Paradise Resort mang đến sự kết hợp hoàn hảo
                giữa đẳng cấp, phiêu lưu và thư giãn. Cơ sở vật chất đẳng cấp và dịch vụ tận tâm đảm bảo mọi khoảnh khắc
                của bạn trở nên đặc biệt.
              </p>
              <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mx-auto text-center">
                <div className="text-center flex flex-col items-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                    <Bed className="h-8 w-8 text-sky-600" />
                  </div>
                  <h3 className="font-semibold">Phòng Sang Trọng</h3>
                  <p className="text-sm text-muted-foreground">Tầm nhìn hướng biển tuyệt đẹp và tiện nghi hiện đại</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                    <Utensils className="h-8 w-8 text-sky-600" />
                  </div>
                  <h3 className="font-semibold">Ẩm Thực Cao Cấp</h3>
                  <p className="text-sm text-muted-foreground">Hương vị tinh túy từ khắp nơi trên thế giới</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                    <Waves className="h-8 w-8 text-sky-600" />
                  </div>
                  <h3 className="font-semibold">Bãi Biển Riêng</h3>
                  <p className="text-sm text-muted-foreground">Thoải mái vui chơi với các môn thể thao dưới nước</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
                    <Sparkles className="h-8 w-8 text-sky-600" />
                  </div>
                  <h3 className="font-semibold">Dịch Vụ Đẳng Cấp</h3>
                  <p className="text-sm text-muted-foreground">Lễ tân 24/7, chăm sóc cá nhân tận tình</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Room Types Section */}


        <section id="roomtype" className="py-20 bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 relative overflow-hidden">
          {/* Background Decorative - giảm bớt để nhẹ nhàng hơn */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-24 w-52 h-52 bg-sky-200/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-pink-300/10 rounded-full blur-2xl"></div>
          </div>

          <div className="container max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-sky-500 text-white rounded-full shadow">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold text-sm">Luxury Collection</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-snug tracking-tight mb-4 bg-gradient-to-r from-sky-700 to-blue-600 bg-clip-text text-transparent">
                Các Loại Phòng Sang Trọng
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                Lựa chọn từ bộ sưu tập phòng và suite cao cấp, mỗi phòng được thiết kế để mang lại sự thoải mái và thư giãn tối đa trong suốt kỳ nghỉ của bạn.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-24 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"></div>
              </div>
            </div>

            {/* Carousel Section */}
            <div className="relative">
              <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
              <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

              <div
                ref={carouselRef}
                className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide gap-4 pb-10 pt-4 px-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.03), rgba(147,51,234,0.03))'
                }}
              >
                {rooms.map((room, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[85vw] sm:w-[47vw] md:w-[32vw] lg:w-[calc((100%-2rem)/3)] snap-start group"
                  >
                    <div className="relative mx-1 my-2 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                      {room.isPopular && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                            🔥 Phổ Biến
                          </span>
                        </div>
                      )}
                      <div className="relative z-10">
                        <RoomType
                          tenLoaiPhong={room.tenLoaiPhong}
                          moTa={room.moTa}
                          price={room.price}
                          originalPrice={room.originalPrice}
                          hinhAnh={room.hinhAnh}
                          amenities={room.amenities}
                          rating={room.rating}
                          isPopular={room.isPopular}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-14">
              <Button
                asChild
                size="lg"
                className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 px-10 py-6 text-xl rounded-2xl shadow-2xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-3xl ring-2 ring-purple-400/40 hover:ring-purple-500/70 group"
              >
                <Link href="/rooms" className="flex items-center gap-3 relative z-10">
                  <span className="relative z-10">Xem Tất Cả Phòng</span>
                  <Sparkles className="h-6 w-6 transform transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Hide Scrollbar */}
          <style jsx>{`
                .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }

                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
        </section>


        <AnimatedSection>
          <section id="service" className="bg-sky-50 py-16">
            <div className="container max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-sky-700 mb-4">
                  Dịch Vụ & Tiện Ích
                </h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                  Khám phá các dịch vụ tuyệt vời mà chúng tôi cung cấp để làm cho kỳ nghỉ của bạn trở nên đáng nhớ.
                </p>
              </div>
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Service key={service.maDV} {...service} />
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Special Offers Section */}
        <section id="benefit" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
                Ưu Đãi Đặc Biệt
              </h2>
              <p className="text-lg text-muted-foreground">
                Đừng bỏ lỡ các gói ưu đãi hấp dẫn dành riêng cho bạn
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#00A3E0] to-[#0077B6] p-6 min-h-[200px] flex items-center justify-center text-white">
                <div className="z-10 text-center">
                  <Badge className="mb-4 bg-white/10 text-white">Ưu Đãi Sớm</Badge>
                  <h3 className="text-2xl font-bold mb-2">Giảm 30% Khi Đặt Trước</h3>
                  <p className="mb-4 text-sm opacity-90">Đặt phòng trước 30 ngày và tiết kiệm đến 30% chi phí lưu trú</p>
                  <Button className="bg-white text-[#00A3E0] hover:bg-white/90">Đặt Ngay</Button>
                </div>
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 opacity-50" />
              </div>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#F5A623] to-[#F15A24] p-6 min-h-[200px] flex items-center justify-center text-white">
                <div className="z-10 text-center">
                  <Badge className="mb-4 bg-white/10 text-white">Gói Gia Đình</Badge>
                  <h3 className="text-2xl font-bold mb-2">Gói Nghỉ Dưỡng Gia Đình</h3>
                  <p className="mb-4 text-sm opacity-90">Trẻ em dưới 12 tuổi được miễn phí khi ở cùng bố mẹ</p>
                  <Button className="bg-white text-[#F5A623] hover:bg-white/90">Tìm Hiểu Thêm</Button>
                </div>
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 opacity-50" />
              </div>
            </div>
          </div>
        </section>

        {/* Phần kêu gọi hành động */}
        <section className="bg-gradient-to-r from-sky-500 to-sky-600 py-16 text-white">
          <div className="container text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Sẵn sàng cho kỳ nghỉ mơ ước?</h2>
            <p className="mt-4 text-lg opacity-90">
              Đặt phòng ngay hôm nay để trải nghiệm kỳ nghỉ nhiệt đới đẳng cấp với dịch vụ cao cấp và tiện nghi vượt trội.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            </div>
          </div>
        </section>
      </main>
      <footer id="Call" className="bg-sky-900 text-white px-6 sm:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Contact Info */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Paradise Palms Resort</h3>
              <address className="not-italic space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="mt-1 h-4 w-4 flex-shrink-0" />
                  <span>
                    123 Paradise Beach Road
                    <br />
                    Tropical Island, TI 12345
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@paradisepalms.com</span>
                </div>
              </address>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-sm text-sky-100">
                {[
                  { label: "Rooms & Suites", href: "/rooms" },
                  { label: "Entertainment", href: "/entertainment" },
                  { label: "Tours & Activities", href: "/tours" },
                  { label: "Spa & Wellness", href: "/spa" },
                  { label: "Dining", href: "/buffet" },
                  { label: "Contact Us", href: "/contact" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-sky-300 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resort Map */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Vị Trí Khu Nghỉ Dưỡng</h3>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-sky-800">
                <iframe
                  title="Bản đồ Paradise Palm Resort"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3899.540104635984!2d109.23401387429122!3d12.211664831085097!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317067338747104b%3A0xf147ac4d6beac9ef!2sNha%20Trang%20-%20Vinpearl%20Land%2C%20V%C4%A9nh%20Nguy%C3%AAn%2C%20Nha%20Trang%2C%20Vi%E1%BB%87t%20Nam!5e0!3m2!1svi!2s!4v1750260249418!5m2!1svi!2s"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <p className="mt-2 text-xs text-sky-300">Nằm bên bờ biển Paradise tuyệt đẹp</p>
            </div>

            {/* Newsletter & Social */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Stay Connected</h3>
              <p className="mb-4 text-sm">Subscribe for exclusive offers and updates</p>
              <div className="mb-6 flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
                <Button variant="secondary" size="sm" className="whitespace-nowrap">
                  Subscribe
                </Button>
              </div>
              <div className="flex space-x-6">
                <span className="text-sky-600 hover:text-sky-300 transition-colors text-2xl cursor-pointer" aria-label="Facebook">
                  <FaFacebook />
                </span>
                <span className="text-sky-600 hover:text-sky-300 transition-colors text-2xl cursor-pointer" aria-label="Instagram">
                  <FaInstagram />
                </span>
                <span className="text-sky-600 hover:text-sky-300 transition-colors text-2xl cursor-pointer" aria-label="Twitter">
                  <FaTwitter />
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/20 pt-6 text-center">
            <p className="text-sm text-sky-200">
              &copy; {new Date().getFullYear()} Paradise Palms Resort. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
