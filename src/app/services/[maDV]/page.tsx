export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header/Header";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  DollarSign,
  Star,
  Users,
  Calendar,
  CheckCircle,
  Award,
  Waves,
  Phone
} from "lucide-react";

// Add explicit async/await for params
export default async function ServiceDetailPage({ params }: { params: Promise<{ maDV: string }> }) {
  // Await the params
  const { maDV } = await params;
  
  const res = await fetch("http://localhost:3000/api/services", { cache: "no-store" });
  const data = await res.json();

  const service = data.find((s: any) => s.maDV === maDV);
  if (!service) return notFound();

  const duration = "60 phút";
  const workingHours = "08:00 – 20:00 hàng ngày";
  const location = "Khu Chính - Tầng 3, Paradise Spa Center";
  const status = "Còn hoạt động";

  return (
    <>
      <Header />
      <main className="bg-gradient-to-br from-slate-50 to-cyan-50/30">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
              <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 border-cyan-200">
                <Waves className="w-3 h-3 mr-1" />
                Dịch vụ spa
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              {service.tenDV}
            </h1>
            <p className="text-slate-600">Trải nghiệm đẳng cấp tại Paradise Resort</p>
          </div>

          {/* Main Content - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Left Column - Image & Gallery */}
            <div className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative h-80 rounded-xl overflow-hidden bg-white">
                  <Image
                    src={service.anhDV?.startsWith("/") ? service.anhDV : `/img/services/${service.anhDV}`}
                    alt={service.tenDV}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Service Highlights */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Điểm nổi bật</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <Award className="w-4 h-4 text-cyan-600" />
                    </div>
                    <span className="text-sm text-slate-700">Chất lượng cao</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-slate-700">Chuyên nghiệp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-sm text-slate-700">An toàn</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm text-slate-700">5 sao</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Info */}
            <div className="space-y-6">
              
              {/* Service Info Card */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Thông tin dịch vụ</h3>
                
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Giờ hoạt động</p>
                      <p className="text-slate-600">{workingHours}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Thời lượng</p>
                      <p className="text-slate-600">{duration}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Địa điểm</p>
                      <p className="text-slate-600">{location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 mb-1">Giá dịch vụ</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-6 h-6" />
                      <span className="text-3xl font-bold">
                        {Number(service.giaDV).toLocaleString("vi-VN")} VND
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                    <p className="text-cyan-100 text-sm">Đánh giá 5/5</p>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-slate-800 rounded-xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Đặt lịch ngay</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Hotline</p>
                    <p className="text-slate-300">1900 6868</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800">Mô tả chi tiết</h2>
            </div>
            <p className="text-slate-700 leading-relaxed text-lg">
              {service.moTaDV}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Waves className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Không gian thư giãn</h3>
              <p className="text-slate-600 text-sm">Môi trường yên tĩnh, thoải mái cho trải nghiệm tốt nhất</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Tiêu chuẩn quốc tế</h3>
              <p className="text-slate-600 text-sm">Dịch vụ đạt chuẩn 5 sao theo tiêu chuẩn quốc tế</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Đội ngũ chuyên nghiệp</h3>
              <p className="text-slate-600 text-sm">Nhân viên được đào tạo bài bản, kinh nghiệm nhiều năm</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}