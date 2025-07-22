"use client"
import type React from "react"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Search,
  Users,
  Bed,
  Filter,
  X,
  Star,
  Wifi,
  Car,
  Dumbbell,
  Waves,
  Sparkles,
  Calendar,
  User,
  CreditCard,
  ArrowRight,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import Header from "@/components/Header/Header"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

interface Room {
  maPhong: string
  moTa: string
  tinhTrang: string
  gia: number
  hinhAnh: string
  tenPhong: string
  loaiphong: {
    tenLoaiPhong: string
    soNguoi: number
    soGiuong: number
  }
  rating?: number
  view?: string
  tienNghi?: string[]
}

interface Service {
  maDV: string
  tenDV: string
  moTaDV: string
  giaDV: number
  anhDV: string
}

interface BookedService {
  maDichVu: string
  tenDichVu: string
  giaDV: number
  soLuong: number
  thanhTien: number
}

interface FilterState {
  soNguoi: string
  loaiPhong: string
  giaMin: string
  giaMax: string
  ratingMin: string
  tienNghi: string[]
  sortBy: string
}
interface Voucher {
  maVoucher: string;
  tenVoucher: string;
  phanTramGiam: number;
  dieuKienApDung: number | null;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai: string;
}
interface BookingForm {
  tenKhachHang: string
  ngaySinh: string
  diaChi: string
  soDienThoai: string
  email: string
  checkIn: string
  checkOut: string
  phuongThucThanhToan: string
  dichVuDat: BookedService[]
  maVoucher?: string; // Add voucher field

}

interface Customer {
  tenKhachHang: string
  soDienThoai: string
  maUser: string // Used as email
}

export default function RoomsPage() {
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const { user } = useAuth()
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false); //
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<string>("");
  const [validVouchers, setValidVouchers] = useState<Voucher[]>([]);
  useEffect(() => {
    // Gọi API để lấy danh sách voucher
    fetch("/api/vouchers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVouchers(data); // Cập nhật danh sách nếu dữ liệu hợp lệ
        } else {
          console.error("Dữ liệu voucher trả về không đúng định dạng:", data);
          setVouchers([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi gọi API lấy danh sách voucher:", err);
        setVouchers([]);
        toast.error("Không thể tải danh sách voucher. Vui lòng thử lại!");
      });
  }, []);

  useEffect(() => {
    const maPhong = searchParams.get("maPhong");
    console.log("Selected maPhong:", maPhong);
    if (maPhong) {
      const room = rooms.find((r) => r.maPhong === maPhong);
      if (room) {
        setSelectedRoom(room);
        setIsBookingModalOpen(true);
        setBookingStep(1);
        fetchBookedDates(room.maPhong);
      } else {
        fetch(`/api/rooms/${maPhong}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              const enhancedRoom = {
                ...data.data,
                rating: data.data.rating || Number((Math.random() * 2 + 3).toFixed(1)),
                tienNghi: data.data.tienNghi || generateRandomAmenities(),
              };
              setSelectedRoom(enhancedRoom);
              setIsBookingModalOpen(true);
              setBookingStep(1);
              fetchBookedDates(maPhong);
            }
          })
          .catch((err) => {
            console.error("Lỗi khi lấy thông tin phòng:", err);
            toast("Không tìm thấy phòng!");
          });
      }
    } else {
      setIsBookingModalOpen(false);
      setSelectedRoom(null);
      setBookedDates([]);
    }
  }, [searchParams, rooms]);
  //Dùng để chọn ngày tối thiểu làm ngày trả phòng
  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  const fetchBookedDates = async (maPhong: string) => {
    try {
      const response = await fetch(`/api/rooms/${maPhong}/book-dates`);
      const data = await response.json();

      console.log("API response:", JSON.stringify(data, null, 2));

      if (response.ok && data.success && Array.isArray(data.data)) {
        // Filter and validate bookings
        const bookedRanges: { start: Date; end: Date }[] = data.data
          .filter((booking: { check_in: string | null; check_out: string | null }) => {
            if (!booking.check_in || !booking.check_out) {
              console.warn("Skipping booking with null dates:", booking);
              return false;
            }
            const start = new Date(booking.check_in + "T00:00:00.000Z");
            const end = new Date(booking.check_out + "T00:00:00.000Z");
            const isValid = !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
            if (!isValid) {
              console.warn("Skipping invalid booking:", booking);
            }
            return isValid;
          })
          .map((booking: { check_in: string; check_out: string }) => ({
            start: new Date(booking.check_in + "T00:00:00.000Z"),
            end: new Date(booking.check_out + "T00:00:00.000Z"),
          }));

        console.log(
          "Booked ranges:",
          bookedRanges.map((r) => ({
            start: r.start.toISOString(),
            end: r.end.toISOString(),
          }))
        );

        const extendedBlockedDates: Set<string> = new Set();

        // Add all dates from check_in to check_out
        bookedRanges.forEach(({ start, end }) => {
          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            extendedBlockedDates.add(
              new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()
            );
          }
        });

        // Add the day before check_in
        bookedRanges.forEach(({ start }) => {
          const dayBefore = new Date(start);
          dayBefore.setDate(dayBefore.getDate() - 1);
          console.log("Adding day before:", dayBefore.toISOString());
          extendedBlockedDates.add(
            new Date(dayBefore.getFullYear(), dayBefore.getMonth(), dayBefore.getDate()).toDateString()
          );
        });

        // Convert Set to array of Date objects
        const result = Array.from(extendedBlockedDates).map((d) => new Date(d));
        console.log(
          "Blocked dates:",
          result.map((d) => d.toISOString())
        );

        setBookedDates(result);
      } else {
        console.error("Invalid booked dates response:", data);
        setBookedDates([]);
        toast.error("Không thể tải danh sách ngày đã đặt!");
      }
    } catch (err) {
      console.error("Error fetching booked dates:", err);
      setBookedDates([]);
      toast.error("Lỗi hệ thống khi tải ngày đã đặt!");
    }
  };
  function formatDateToYYYYMMDDLocal(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    tenKhachHang: "",
    ngaySinh: "",
    diaChi: "",
    soDienThoai: "",
    email: "",
    checkIn: "",
    checkOut: "",
    phuongThucThanhToan: "",
    dichVuDat: [],
  })
  const [services, setServices] = useState<Service[]>([])
  const [filters, setFilters] = useState<FilterState>({
    soNguoi: "",
    loaiPhong: "",
    giaMin: "",
    giaMax: "",
    ratingMin: "",
    tienNghi: [],
    sortBy: "gia-tang",
  })

  const availableAmenities = [
    { id: "wifi", label: "Wi-Fi miễn phí", icon: Wifi },
    { id: "parking", label: "Chỗ đậu xe", icon: Car },
    { id: "gym", label: "Phòng gym", icon: Dumbbell },
    { id: "pool", label: "Hồ bơi", icon: Waves },
  ]

  const generateRandomAmenities = () => {
    const shuffled = [...availableAmenities].sort(() => 0.5 - Math.random());
    const numAmenities = Math.random() < 0.5 ? 2 : 3;
    return shuffled.slice(0, numAmenities).map((amenity) => amenity.id);
  };

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((response) => {
        if (response.success && Array.isArray(response.data)) {
          const enhancedData = response.data.map((room: Room) => ({
            ...room,
            rating: room.rating || Number((Math.random() * 2 + 3).toFixed(1)),
            tienNghi: room.tienNghi || generateRandomAmenities(),
          }))
          setRooms(enhancedData)
        } else {
          console.error("Invalid response format or no data:", response)
          setRooms([])
        }
      })
      .catch((err) => {
        console.error("Error fetching rooms:", err)
        setRooms([])
      })
  }, [])
 

  useEffect(() => {
    if (bookingStep === 3 && bookingForm.checkIn && bookingForm.checkOut && selectedRoom) {
      const checkIn = new Date(bookingForm.checkIn);
      const checkOut = new Date(bookingForm.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const roomTotal = nights > 0 ? nights * Number(selectedRoom.gia) : 0;
      const servicesTotal = bookingForm.dichVuDat.reduce(
        (total, service) => total + Number(service.thanhTien),
        0
      );
      const totalBill = roomTotal + servicesTotal;

      // Lọc các voucher thỏa mãn điều kiện áp dụng
      const filteredVouchers = vouchers.filter(
        (voucher) => !voucher.dieuKienApDung || totalBill >= Number(voucher.dieuKienApDung)
      );
      setValidVouchers(filteredVouchers);

      // Nếu voucher đang chọn không còn hợp lệ, reset selectedVoucher
      if (selectedVoucher && !filteredVouchers.some((v) => v.maVoucher === selectedVoucher)) {
        setSelectedVoucher("");
      }
    }
  }, [bookingStep, bookingForm.checkIn, bookingForm.checkOut, bookingForm.dichVuDat, selectedRoom, vouchers, selectedVoucher]);
  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setServices(data)
        } else {
          console.error("Invalid services response format:", data)
          setServices([])
        }
      })
      .catch((err) => {
        console.error("Error fetching services:", err)
        setServices([])
      })
  }, [])

  const [customerData, setCustomerData] = useState<Customer | null>(null)
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/khachhang/${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error("Error fetching customer data:", data.error)
            setCustomerData(null)
          } else {
            setCustomerData({
              tenKhachHang: data.tenKhachHang || "",
              soDienThoai: data.soDienThoai || "",
              maUser: data.maUser || "",
            })
          }
        })
        .catch((err) => {
          console.error("Error fetching customer data:", err)
          setCustomerData(null)
        })
    } else {
      setCustomerData(null)
    }
  }, [user])

  useEffect(() => {
    if (customerData) {
      setBookingForm((prev) => ({
        ...prev,
        tenKhachHang: customerData.tenKhachHang,
        soDienThoai: customerData.soDienThoai,
        email: customerData.maUser,
      }))
    }
  }, [customerData])

  const uniqueRoomTypes = useMemo(() => {
    return [...new Set(rooms.map((room) => room.loaiphong?.tenLoaiPhong).filter(Boolean))]
  }, [rooms])

  const filteredAndSortedRooms = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const search = searchTerm.toLowerCase()
      const matchSearch = search ? room.tenPhong?.toLowerCase().includes(search) : true

      const matchSoNguoi = filters.soNguoi
        ? filters.soNguoi === "4"
          ? room.loaiphong.soNguoi >= 4
          : room.loaiphong.soNguoi.toString() === filters.soNguoi
        : true

      const matchLoaiPhong = filters.loaiPhong ? room.loaiphong?.tenLoaiPhong === filters.loaiPhong : true

      const matchGiaMin = filters.giaMin ? room.gia >= Number.parseInt(filters.giaMin) : true

      const matchGiaMax = filters.giaMax ? room.gia <= Number.parseInt(filters.giaMax) : true

      const matchRating = (() => {
        const rating = Number.parseFloat(String(room.rating || "0"))
        switch (filters.ratingMin) {
          case "3":
            return rating >= 0 && rating < 3.9
          case "4":
            return rating >= 4 && rating < 4.5
          case "4.5":
            return rating >= 4.5 && rating <= 5
          default:
            return true
        }
      })()

      const matchTienNghi =
        filters.tienNghi.length === 0 || filters.tienNghi.every((amenity) => room.tienNghi?.includes(amenity))

      return matchSearch && matchSoNguoi && matchLoaiPhong && matchGiaMin && matchGiaMax && matchRating && matchTienNghi
    })

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "gia-tang":
          return a.gia - b.gia
        case "gia-giam":
          return b.gia - a.gia
        case "rating-cao":
          return Number.parseFloat(String(b.rating || "0")) - Number.parseFloat(String(a.rating || "0"))
        default:
          return 0
      }
    })

    return filtered
  }, [rooms, searchTerm, filters])
  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day); // month: 0-indexed
  }
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price) + " VND";

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const nextStep = () => {
    if (bookingStep < 3) setBookingStep(bookingStep + 1)
  }

  const prevStep = () => {
    if (bookingStep > 1) setBookingStep(bookingStep - 1)
  }

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      tienNghi: checked ? [...prev.tienNghi, amenityId] : prev.tienNghi.filter((id) => id !== amenityId),
    }))
  }

  const clearFilters = () => {
    setFilters({
      soNguoi: "",
      loaiPhong: "",
      giaMin: "",
      giaMax: "",
      ratingMin: "",
      tienNghi: [],
      sortBy: "gia-tang",
    })
    setSearchTerm("")
  }

  const getAmenityIcon = (amenityId: string) => {
    const amenity = availableAmenities.find((a) => a.id === amenityId)
    return amenity?.icon || Wifi
  }

  const activeFiltersCount =
    Object.values(filters).filter((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value) && value !== "gia-tang",
    ).length + (searchTerm ? 1 : 0)

  const handleBookingFormChange = (field: keyof BookingForm, value: string) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBookNow = (room: Room) => {
    if (!user) {
      // If user is not logged in, redirect to login page
      toast.warning("Vui lòng đăng nhập để đặt phòng!");
      router.push("/auth"); // Adjust the path to your login page
      return;
    }

    // If user is logged in, proceed with booking
    setSelectedRoom(room);
    setBookingStep(1);
    router.push(`/rooms?maPhong=${room.maPhong}`);
  };

  const calculateTotalPrice = () => {
    if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut) return 0;

    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    let roomTotal = nights > 0 ? nights * Number(selectedRoom.gia) : 0;
    const servicesTotal = bookingForm.dichVuDat.reduce(
      (total, service) => total + Number(service.thanhTien),
      0
    );

    let voucherDiscount = 0;
    if (selectedVoucher) {
      const voucher = vouchers.find((v) => v.maVoucher === selectedVoucher);
      if (voucher && (!voucher.dieuKienApDung || roomTotal >= Number(voucher.dieuKienApDung))) {
        voucherDiscount = (voucher.phanTramGiam / 100) * roomTotal;
      }
    }

    return roomTotal + servicesTotal - voucherDiscount;
  };

  const addService = (service: Service) => {
    const existingService = bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV)

    if (existingService) {
      const updatedServices = bookingForm.dichVuDat.map((s) =>
        s.maDichVu === service.maDV ? { ...s, soLuong: s.soLuong + 1, thanhTien: (s.soLuong + 1) * s.giaDV } : s,
      )
      setBookingForm((prev) => ({ ...prev, dichVuDat: updatedServices }))
    } else {
      const newService: BookedService = {
        maDichVu: service.maDV,
        tenDichVu: service.tenDV,
        giaDV: service.giaDV,
        soLuong: 1,
        thanhTien: service.giaDV,
      }
      setBookingForm((prev) => ({ ...prev, dichVuDat: [...prev.dichVuDat, newService] }))
    }
  }

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId)
      return
    }

    const updatedServices = bookingForm.dichVuDat.map((s) =>
      s.maDichVu === serviceId ? { ...s, soLuong: quantity, thanhTien: quantity * s.giaDV } : s,
    )
    setBookingForm((prev) => ({ ...prev, dichVuDat: updatedServices }))
  }

  const removeService = (serviceId: string) => {
    const updatedServices = bookingForm.dichVuDat.filter((s) => s.maDichVu !== serviceId)
    setBookingForm((prev) => ({ ...prev, dichVuDat: updatedServices }))
  }
  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms");
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const enhancedData = data.data.map((room: Room) => ({
          ...room,
          rating: room.rating || Number((Math.random() * 2 + 3).toFixed(1)),
          tienNghi: room.tienNghi || generateRandomAmenities(),
        }));
        setRooms(enhancedData);
      } else {
        console.error("Invalid response format or no data:", data);
        setRooms([]);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!bookingForm.tenKhachHang || !bookingForm.soDienThoai || !bookingForm.checkIn || !bookingForm.checkOut) {
      toast.warning("Vui lòng điền đầy đủ thông tin bắt buộc!");
      setIsSubmitting(false);
      return;
    }

    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    if (checkOut <= checkIn) {
      toast.warning("Ngày trả phòng phải sau ngày nhận phòng!");
      setIsSubmitting(false);
      return;
    }

    if (!selectedRoom) {
      toast.warning("Không có phòng được chọn!");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maPhong: selectedRoom.maPhong,
          tenKhachHang: bookingForm.tenKhachHang,
          soDienThoai: bookingForm.soDienThoai,
          email: bookingForm.email,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          maVoucher: selectedVoucher || undefined,
          phuongThucThanhToan: bookingForm.phuongThucThanhToan,
          dichVuDat: bookingForm.dichVuDat,
          tongTien: calculateTotalPrice(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (bookingForm.phuongThucThanhToan === "ChuyenKhoan" && result.payUrl) {
          // Redirect to MoMo payment page
          window.location.href = result.payUrl;
        } else {
          // Handle cash payment success
          toast.success("🎉 Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.");

          // Refetch rooms to update the room status
          await fetchRooms();

          // Reset booking form and close modal
          setTimeout(() => {
            setIsBookingModalOpen(false);
            setBookingForm({
              tenKhachHang: "",
              ngaySinh: "",
              diaChi: "",
              soDienThoai: "",
              email: "",
              checkIn: "",
              checkOut: "",
              phuongThucThanhToan: "",
              dichVuDat: [],
            });
            router.push("/rooms");
          }, 500);
        }
      } else {
        toast.error(`❌ Lỗi khi đặt phòng: ${result.message || "Vui lòng thử lại sau."}`);
      }
    } catch (error) {
      console.error("❌ Error submitting booking:", error);
      toast.error("Lỗi hệ thống khi đặt phòng. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <section className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 text-gray-800 py-8 md:py-16 border-b border-sky-200">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-normal text-sky-700 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Danh Sách Phòng
            </h1>x
            <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
              Tìm phòng phù hợp với nhu cầu của bạn - Trải nghiệm nghỉ dưỡng tuyệt vời
            </p>
          </div>
        </section>
        <section className="py-4 md:py-8">
          <div className="container mx-auto px-4">
            <div className="lg:hidden mb-4">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-gray-200"
              >
                <Filter className="h-4 w-4" />
                Bộ lọc & Tìm kiếm
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
            <div className="flex gap-4 lg:gap-8">
              <aside
                className={`
                  ${showFilters ? "block" : "hidden"} lg:block
                  w-full lg:w-80 lg:flex-shrink-0
                  fixed lg:static top-0 left-0 right-0 bottom-0 z-50 lg:z-auto
                  bg-white lg:bg-transparent
                  p-4 lg:p-0
                  overflow-y-auto lg:overflow-visible
                `}
              >
                <div className="lg:hidden flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Bộ lọc & Tìm kiếm</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-4 lg:p-6 lg:sticky lg:top-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
                  <div className="mb-6">
                    <h2 className="text-base lg:text-lg font-semibold mb-3 text-gray-800">Tìm kiếm</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Tìm theo tên phòng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border-gray-200 focus:border-sky-500 focus:ring-sky-500 rounded-2xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Sắp xếp theo</h3>
                    <select
                      className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                    >
                      <option value="gia-tang">Giá: Thấp đến cao</option>
                      <option value="gia-giam">Giá: Cao đến thấp</option>
                      <option value="rating-cao">Đánh giá cao nhất</option>
                    </select>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Số khách</h3>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                        value={filters.soNguoi}
                        onChange={(e) => handleFilterChange("soNguoi", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="1">1 khách</option>
                        <option value="2">2 khách</option>
                        <option value="3">3 khách</option>
                        <option value="4">4+ khách</option>
                      </select>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Loại phòng</h3>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                        value={filters.loaiPhong}
                        onChange={(e) => handleFilterChange("loaiPhong", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        {uniqueRoomTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Đánh giá tối thiểu</h3>
                      <select
                        className="w-full p-2 border border-gray-200 rounded-2xl text-sm focus:border-sky-500 focus:ring-sky-500"
                        value={filters.ratingMin}
                        onChange={(e) => handleFilterChange("ratingMin", e.target.value)}
                      >
                        <option value="">Tất cả</option>
                        <option value="3">3 sao</option>
                        <option value="4">4+ sao</option>
                        <option value="4.5">4.5+ sao</option>
                      </select>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Khoảng giá (VNĐ)</h3>
                      <div className="mb-2">
                        <Slider
                          min={0}
                          max={10000000}
                          step={50000}
                          value={[Number(filters.giaMin) || 0, Number(filters.giaMax) || 10000000]}
                          onValueChange={([min, max]) => {
                            handleFilterChange("giaMin", String(min))
                            handleFilterChange("giaMax", String(max))
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{formatPrice(Number(filters.giaMin) || 0)}</span>
                        <span>{formatPrice(Number(filters.giaMax) || 10000000)}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tiện nghi</h3>
                      <div className="space-y-2">
                        {availableAmenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={amenity.id}
                              checked={filters.tienNghi.includes(amenity.id)}
                              onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                            />
                            <label htmlFor={amenity.id} className="text-sm flex items-center gap-2 cursor-pointer">
                              <amenity.icon className="h-4 w-4" />
                              {amenity.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {activeFiltersCount > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full flex items-center justify-center gap-1 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                        Xóa bộ lọc ({activeFiltersCount})
                      </Button>
                    </div>
                  )}
                  <div className="lg:hidden mt-6 pt-4 border-t">
                    <Button
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-2xl"
                    >
                      Áp dụng bộ lọc
                    </Button>
                  </div>
                </div>
              </aside>
              {showFilters && (
                <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowFilters(false)} />
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-4 lg:mb-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Tìm thấy <span className="font-semibold text-sky-600">{filteredAndSortedRooms.length}</span> phòng
                  </div>
                </div>
                {filteredAndSortedRooms.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 lg:h-16 w-12 lg:w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl lg:text-2xl font-semibold text-gray-600 mb-2">Không tìm thấy phòng</h3>
                    <p className="text-gray-500 mb-4 text-sm lg:text-base">
                      Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                    <Button onClick={clearFilters} variant="outline">
                      Xóa bộ lọc
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                    {filteredAndSortedRooms.map((room) => (
                      <Card
                        key={room.maPhong}
                        className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 border border-gray-100 p-0"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-200 via-blue-200 to-sky-200 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                        <div className="relative w-full h-56 overflow-hidden">
                          <Link href={`/rooms/${room.maPhong}`} className="block w-full h-full">
                            <Image
                              src={
                                room.hinhAnh ? `/img/rooms/${room.hinhAnh}` : "/placeholder.svg?height=256&width=400"
                              }
                              alt={room.loaiphong?.tenLoaiPhong || "Phòng"}
                              fill
                              className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              priority={false}
                            />
                          </Link>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none" />
                          <div className="absolute top-4 right-4 backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-2 rounded-2xl text-xs font-bold shadow-2xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            {room.maPhong}
                          </div>
                          <div className="absolute top-4 left-4 backdrop-blur-md bg-white/20 border border-white/30 text-white px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300 drop-shadow-lg" />
                            {room.rating}
                          </div>
                          <div className="absolute bottom-4 left-4 backdrop-blur-md border border-white/30 px-3 py-2 rounded-2xl text-xs font-bold shadow-2xl transform group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                            <div
                              className={`${room.tinhTrang === "Còn trống" || room.tinhTrang === "Trống"
                                ? "bg-emerald-500/90 text-white"
                                : "bg-red-500/90 text-white"
                                } px-3 py-1 rounded-xl`}
                            >
                              {room.tinhTrang}
                            </div>
                          </div>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div
                              className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping"
                              style={{ animationDelay: "0s" }}
                            />
                            <div
                              className="absolute top-3/4 right-1/3 w-1 h-1 bg-white/60 rounded-full animate-ping"
                              style={{ animationDelay: "1s" }}
                            />
                            <div
                              className="absolute bottom-1/3 left-2/3 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping"
                              style={{ animationDelay: "2s" }}
                            />
                          </div>
                        </div>
                        <CardContent className="p-6 relative z-10">
                          <div className="mb-4">
                            <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-sky-600 transition-colors duration-300">
                              {room.tenPhong || room.loaiphong?.tenLoaiPhong || "Phòng"}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed mb-4">{room.moTa}</p>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-2 bg-sky-50 px-3 py-2 rounded-xl">
                              <Users className="h-4 w-4 text-sky-600" />
                              <span className="font-medium">{room.loaiphong?.soNguoi} khách</span>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-xl">
                              <Bed className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium">{room.loaiphong?.soGiuong} giường</span>
                            </div>
                          </div>
                          <div className="mb-6">
                            {room.tienNghi && room.tienNghi.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {room.tienNghi.slice(0, 4).map((amenityId) => {
                                  const Icon = getAmenityIcon(amenityId)
                                  const amenity = availableAmenities.find((a) => a.id === amenityId)
                                  return (
                                    <div
                                      key={amenityId}
                                      className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 p-3 rounded-2xl flex items-center gap-2 hover:from-sky-100 hover:to-blue-100 transition-colors duration-300 shadow-sm"
                                      title={amenity?.label}
                                    >
                                      <Icon className="h-4 w-4 text-sky-600" />
                                      <span className="text-xs font-medium text-sky-700">
                                        {amenity?.label.split(" ")[0]}
                                      </span>
                                    </div>
                                  )
                                })}
                                {room.tienNghi.length > 4 && (
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 px-4 py-3 rounded-2xl text-xs text-purple-700 font-bold shadow-sm">
                                    +{room.tienNghi.length - 4} tiện nghi
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div>
                              <div className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                {formatPrice(room.gia)}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">/ đêm</div>
                            </div>
                            <Button
                              size="lg"
                              disabled={room.tinhTrang !== "Trống" && room.tinhTrang !== "Còn trống"}
                              onClick={() => handleBookNow(room)}
                              className="relative overflow-hidden bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center gap-2 group/btn border-0"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                              <Sparkles className="h-5 w-5 group-hover/btn:rotate-180 transition-transform duration-500 relative z-10" />
                              <span className="relative z-10 text-sm">
                                {room.tinhTrang === "Trống" || room.tinhTrang === "Còn trống"
                                  ? "Đặt ngay"
                                  : "Hết phòng"}
                              </span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <Dialog
          open={isBookingModalOpen}
          onOpenChange={(open) => {
            setIsBookingModalOpen(open);
            if (!open) {
              router.push("/rooms");
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Đặt phòng - {selectedRoom?.tenPhong}
              </DialogTitle>
            </DialogHeader>
            <Tabs value={bookingStep.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1" disabled={bookingStep < 1}>
                  Thông tin
                </TabsTrigger>
                <TabsTrigger value="2" disabled={bookingStep < 2}>
                  Dịch vụ
                </TabsTrigger>
                <TabsTrigger value="3" disabled={bookingStep < 3}>
                  Xác nhận
                </TabsTrigger>
              </TabsList>
              <TabsContent value="1" className="space-y-6">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-4">
                    <Image
                      src={
                        selectedRoom?.hinhAnh ? `/img/rooms/${selectedRoom.hinhAnh}` : "/placeholder.svg?height=80&width=120"
                      }
                      alt={selectedRoom?.tenPhong || ""}
                      width={120}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-emerald-800">{selectedRoom?.tenPhong}</h3>
                      <p className="text-emerald-600">{selectedRoom?.loaiphong.tenLoaiPhong}</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {selectedRoom && formatPrice(selectedRoom.gia)}/đêm
                      </p>
                    </div>
                  </div>
                </div>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin khách hàng</h3>
                    <div>
                      <Label htmlFor="tenKhachHang">Họ và tên *</Label>
                      <Input
                        id="tenKhachHang"
                        value={bookingForm.tenKhachHang}
                        onChange={(e) => handleBookingFormChange("tenKhachHang", e.target.value)}
                        placeholder="Nhập họ và tên"
                        className="mt-1"
                        required
                        disabled={!!customerData?.tenKhachHang}
                      />
                    </div>
                    <div>
                      <Label htmlFor="soDienThoai">Số điện thoại *</Label>
                      <Input
                        id="soDienThoai"
                        value={bookingForm.soDienThoai}
                        onChange={(e) => handleBookingFormChange("soDienThoai", e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => handleBookingFormChange("email", e.target.value)}
                        placeholder="Nhập email"
                        className="mt-1"
                        disabled={!!customerData?.maUser}
                      />

                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin đặt phòng</h3>

                    <div>
                      <Label htmlFor="checkIn">Ngày nhận phòng *</Label>
                      <DatePicker
                        id="checkIn"
                        selected={bookingForm.checkIn ? parseLocalDate(bookingForm.checkIn) : null}
                        onChange={(date: Date | null) => {
                          if (!date) return;
                          const isBooked = bookedDates.some(
                            (d) => d.toDateString() === date.toDateString()
                          );
                          if (isBooked) {
                            toast.warning("Ngày này đã được đặt, vui lòng chọn ngày khác!");
                            return;
                          }

                          // ❌ Không dùng: date.toISOString().split("T")[0]
                          // ✅ Dùng local format
                          const formatted = formatDateToYYYYMMDDLocal(date);
                          handleBookingFormChange("checkIn", formatted);
                        }}
                        excludeDates={bookedDates}
                        minDate={new Date(Date.now() + 86400000)}
                        dateFormat="yyyy-MM-dd"
                        className="mt-1 w-full border px-3 py-2 rounded"
                        placeholderText="Chọn ngày nhận phòng"
                      />

                    </div>

                    <div>
                      <Label htmlFor="checkOut">Ngày trả phòng *</Label>
                      <DatePicker
                        id="checkOut"
                        selected={bookingForm.checkOut ? parseLocalDate(bookingForm.checkOut) : null}
                        onChange={(date: Date | null) => {
                          if (!date) return;

                          const checkInDate = bookingForm.checkIn ? parseLocalDate(bookingForm.checkIn) : null;

                          // ❌ Nếu chọn checkOut <= checkIn → cảnh báo
                          if (checkInDate && date <= checkInDate) {
                            toast.warning("Ngày trả phòng phải sau ngày nhận phòng!");
                            return;
                          }

                          const isBooked = bookedDates.some(
                            (d) => d.toDateString() === date.toDateString()
                          );
                          if (isBooked) {
                            toast.warning("Ngày này đã được đặt, vui lòng chọn ngày khác!");
                            return;
                          }

                          const formatted = formatDateToYYYYMMDDLocal(date);
                          handleBookingFormChange("checkOut", formatted);
                        }}
                        excludeDates={bookedDates}
                        minDate={
                          bookingForm.checkIn
                            ? addDays(parseLocalDate(bookingForm.checkIn), 1) // 👈 ít nhất là 1 ngày sau check-in
                            : new Date(Date.now() + 86400000)
                        }
                        dateFormat="yyyy-MM-dd"
                        className="mt-1 w-full border px-3 py-2 rounded"
                        placeholderText="Chọn ngày trả phòng"
                      />
                    </div>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="2" className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Chọn dịch vụ bổ sung</h3>
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div
                      key={service.maDV}
                      className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Image
                          src={
                            service.anhDV ? `/img/services/${service.anhDV}` : "/placeholder.svg?height=60&width=60"
                          }
                          alt={service.tenDV}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{service.tenDV}</h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.moTaDV}</p>
                          <p className="text-lg font-bold text-emerald-600">{formatPrice(service.giaDV)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV) ? (
                            <div className="flex items-center gap-2 bg-emerald-50 rounded-lg p-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const currentService = bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV)
                                  if (currentService) {
                                    updateServiceQuantity(service.maDV, currentService.soLuong - 1)
                                  }
                                }}
                                className="w-8 h-8 p-0"
                              >
                                -
                              </Button>
                              <span className="font-semibold min-w-[30px] text-center">
                                {bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV)?.soLuong || 0}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const currentService = bookingForm.dichVuDat.find((s) => s.maDichVu === service.maDV)
                                  if (currentService) {
                                    updateServiceQuantity(service.maDV, currentService.soLuong + 1)
                                  }
                                }}
                                className="w-8 h-8 p-0"
                              >
                                +
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => addService(service)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Thêm
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="3" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin đặt phòng</h3>
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between">
                        <span>Khách hàng:</span>
                        <span className="font-medium">{bookingForm.tenKhachHang}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Số điện thoại:</span>
                        <span className="font-medium">{bookingForm.soDienThoai}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-in:</span>
                        <span className="font-medium">{bookingForm.checkIn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Check-out:</span>
                        <span className="font-medium">{bookingForm.checkOut}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phuongThucThanhToan">Phương thức thanh toán *</Label>
                      <RadioGroup
                        value={bookingForm.phuongThucThanhToan}
                        onValueChange={(value) => handleBookingFormChange("phuongThucThanhToan", value)}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="TienMat" id="cash" />
                          <Label htmlFor="cash" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span>💵</span>
                              <div>
                                <div className="font-medium">Tiền mặt</div>
                                <div className="text-xs text-gray-500">Thanh toán khi nhận phòng</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="ChuyenKhoan" id="transfer" />
                          <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span>🏦</span>
                              <div>
                                <div className="font-medium">Chuyển khoản</div>
                                <div className="text-xs text-gray-500">Thanh toán online</div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Chi tiết thanh toán</h3>
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                      <div className="space-y-3">
                        {bookingForm.checkIn && bookingForm.checkOut && (
                          <>
                            <div className="flex justify-between">
                              <span>Số đêm:</span>
                              <span className="font-medium">
                                {Math.ceil(
                                  (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
                                  (1000 * 60 * 60 * 24)
                                )}{" "}
                                đêm
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Giá phòng:</span>
                              <span className="font-medium">
                                {selectedRoom &&
                                  formatPrice(
                                    Math.ceil(
                                      (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                    ) * selectedRoom.gia
                                  )}
                              </span>
                            </div>
                          </>
                        )}
                        {bookingForm.dichVuDat.length > 0 && (
                          <div className="flex justify-between">
                            <span>Dịch vụ:</span>
                            <span className="font-medium">
                              {formatPrice(
                                bookingForm.dichVuDat.reduce((total, service) => total + Number(service.thanhTien), 0)
                              )}
                            </span>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="maVoucher">Mã Voucher</Label>
                          <select
                            id="maVoucher"
                            value={selectedVoucher}
                            onChange={(e) => setSelectedVoucher(e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-emerald-500"
                          >
                            <option value="">Không sử dụng voucher</option>
                            {validVouchers.map((voucher) => (
                              <option key={voucher.maVoucher} value={voucher.maVoucher}>
                                {voucher.tenVoucher} ({voucher.phanTramGiam}% off)
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedVoucher && (() => {
                          const voucher = vouchers.find((v) => v.maVoucher === selectedVoucher);
                          const soNgay = bookingForm.checkIn && bookingForm.checkOut
                            ? Math.ceil(
                              (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
                              (1000 * 60 * 60 * 24)
                            )
                            : 0;

                          const tienPhong = selectedRoom ? selectedRoom.gia * soNgay : 0;
                          const giamGia = voucher ? (voucher.phanTramGiam / 100) * tienPhong : 0;

                          return voucher ? (
                            <div className="flex justify-between text-emerald-600">
                              <span>Voucher ({voucher.tenVoucher}):</span>
                              <span className="font-medium">-{formatPrice(giamGia)}</span>
                            </div>
                          ) : null;
                        })()}

                        <Separator />
                        <div className="flex justify-between text-lg font-bold text-emerald-700">
                          <span>Tổng cộng:</span>
                          <span>{formatPrice(calculateTotalPrice())}</span>
                        </div>
                      </div>
                    </div>
                    {bookingForm.dichVuDat.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Dịch vụ đã chọn:</h4>
                        <div className="space-y-2">
                          {bookingForm.dichVuDat.map((service) => (
                            <div key={service.maDichVu} className="flex justify-between text-sm bg-white p-2 rounded">
                              <span>
                                {service.tenDichVu} x{service.soLuong}
                              </span>
                              <span className="font-medium">{formatPrice(service.thanhTien)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={bookingStep > 1 ? prevStep : () => setIsBookingModalOpen(false)}
              >
                {bookingStep > 1 ? "Quay lại" : "Hủy"}
              </Button>
              <Button
                onClick={bookingStep < 3 ? nextStep : handleSubmitBooking}
                className={`
            relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700
            hover:from-emerald-700 hover:to-teal-800
            text-white font-bold px-6 py-3 rounded-xl
            shadow-lg hover:shadow-xl transition-all duration-300
            transform hover:scale-105 active:scale-95
            disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100
            flex items-center gap-2
          `}
                disabled={isSubmitting || (bookingStep === 3 && !bookingForm.phuongThucThanhToan)}
              >
                <div
                  className={`
              absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
              -skew-x-12 -translate-x-full
              ${isSubmitting ? "" : "group-hover:translate-x-full"} transition-transform duration-1000
            `}
                />
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white relative z-10"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="relative z-10 text-sm">Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10 text-sm">
                      {bookingStep < 3 ? "Tiếp tục" : "Xác nhận"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}