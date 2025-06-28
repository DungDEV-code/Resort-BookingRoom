"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Users, Bed, Star, ArrowLeft, Heart, Share2, Camera, MapPin, CheckCircle, Settings, Wifi, Car, Dumbbell, Waves, Wind, Tv, Refrigerator, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header/Header";
import { phong_tinhTrang } from "@/generated/prisma";

// Interfaces
interface RoomType {
    maLoaiPhong: string;
    tenLoaiPhong: string;
    moTa: string;
    hinhAnh: string;
    soNguoi: number;
    soGiuong: number;
    priceRange: { min: number; max: number; formatted?: string };
    amenities: string[];
    rating?: number;
    totalRooms?: number;
    availableRooms?: number;
    rooms?: Room[];
}

interface Room {
    maPhong: string;
    tenPhong: string;
    gia: number;
    formattedGia: string;
    tinhTrang: phong_tinhTrang | null;
    hinhAnh: string;
}

// Constants
const TINH_TRANG_MAP: Record<string, string> = {
    [phong_tinhTrang.Trong]: "Còn trống",
    [phong_tinhTrang.DaDat]: "Đã đặt",
    [phong_tinhTrang.DangDonDep]: "Đang dọn dẹp",
    [phong_tinhTrang.DangSuaChua]: "Đang sửa chữa",
};

const AMENITY_ICONS: Record<string, any> = {
    "Wi-Fi miễn phí": Wifi,
    "Chỗ đậu xe": Car,
    "Phòng gym": Dumbbell,
    "Hồ bơi": Waves,
    "Điều hòa": Wind,
    "Tivi": Tv,
    "Tủ lạnh": Refrigerator,
    "Máy sấy tóc": Zap,
};

export default function RoomTypeDetail() {
    const router = useRouter();
    const { maLoaiPhong } = useParams();
    const [roomType, setRoomType] = useState<RoomType | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Effects
    useEffect(() => {
        if (maLoaiPhong) {
            setLoading(true);
            fetch(`/api/roomType/${maLoaiPhong}`)
                .then((res) => res.json())
                .then((data) => {
                    setRoomType(data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Lỗi lấy thông tin phòng:", error);
                    setLoading(false);
                });
        }
    }, [maLoaiPhong]);

    // Helper functions
    const formatPrice = (price: number, includeCurrency: boolean = false) =>
        `${new Intl.NumberFormat("vi-VN", { useGrouping: true }).format(price)}${includeCurrency ? " VND" : ""}`;

    const formatPriceRange = (range: { min: number; max: number; formatted?: string }) =>
        range.formatted || `${formatPrice(range.min)} - ${formatPrice(range.max, true)}`;

    // Loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">
                        Đang tải thông tin loại phòng...
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Vui lòng chờ trong giây lát
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (!roomType) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Camera className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                        Không tìm thấy loại phòng
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Loại phòng bạn đang tìm kiếm không tồn tại.
                    </p>
                    <Button
                        onClick={() => router.push("/rooms")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Quay lại danh sách phòng
                    </Button>
                </div>
            </div>
        );
    }

    // Main render
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />

            {/* Header Section */}
            <section className="bg-white border-b border-gray-100 py-4">
                <div className="container mx-auto px-4 max-w-6xl">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/rooms")}
                        className="mb-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại danh sách
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        {/* Room Info */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    Mã: {roomType.maLoaiPhong}
                                </Badge>
                                <Badge className="text-xs bg-green-100 text-green-700">
                                    {roomType.availableRooms}/{roomType.totalRooms} phòng trống
                                </Badge>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {roomType.tenLoaiPhong}
                            </h1>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{roomType.rating}</span>
                                    <span>đánh giá</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>Khu vực trung tâm</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-1">
                                <Heart className="h-4 w-4" />
                                Yêu thích
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1">
                                <Share2 className="h-4 w-4" />
                                Chia sẻ
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-6">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Room Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Main Image & Description */}
                            <div className="space-y-6">
                                {/* Main Image - Full Width */}
                                <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
                                    <Image
                                        src={
                                            roomType.hinhAnh
                                                ? `/img/${roomType.hinhAnh}`
                                                : "/placeholder.jpg"
                                        }
                                        alt={`Hình ảnh ${roomType.tenLoaiPhong}`}
                                        fill
                                        className={`object-cover rounded-2xl ${imageLoaded ? "opacity-100" : "opacity-0"
                                            } transition-opacity duration-500`}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 50vw"
                                        onLoad={() => setImageLoaded(true)}
                                        priority
                                    />
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center rounded-2xl">
                                            <Camera className="h-12 w-12 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    {/* Image Overlay with Room Type Info */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 rounded-b-2xl">
                                        <div className="text-white">
                                            <h2 className="text-xl font-bold mb-1">{roomType.tenLoaiPhong}</h2>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    <span>{roomType.soNguoi} khách</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Bed className="h-4 w-4" />
                                                    <span>{roomType.soGiuong} giường</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <Card className="shadow-md border border-gray-200 bg-white rounded-xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Settings className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-800">
                                                Mô tả loại phòng
                                            </h2>
                                        </div>
                                        <div className="prose prose-gray max-w-none">
                                            <p className="text-gray-700 text-base leading-relaxed mb-4">
                                                {roomType.moTa}
                                            </p>
                                            
                                            {/* Additional Info */}
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                                <div className="flex items-start gap-3">
                                                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <h4 className="font-semibold text-blue-900 mb-1">
                                                            Thông tin phòng {roomType.tenLoaiPhong}
                                                        </h4>
                                                        <p className="text-blue-800 text-sm">
                                                            Loại phòng này được thiết kế phù hợp cho {roomType.soNguoi} khách với {roomType.soGiuong} giường thoải mái, 
                                                            đầy đủ tiện nghi hiện đại để mang lại trải nghiệm lưu trú tuyệt vời.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Room Details & Amenities */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Room Details */}
                                <Card className="shadow-md border border-gray-200 bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className="h-5 w-5 text-blue-600" />
                                            <h3 className="text-lg font-bold text-gray-800">
                                                Thông tin chi tiết
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Số khách
                                                    </span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">
                                                    {roomType.soNguoi} người
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Bed className="h-4 w-4 text-purple-600" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Số giường
                                                    </span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">
                                                    {roomType.soGiuong} giường
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Phòng trống
                                                    </span>
                                                </div>
                                                <span className="text-sm font-bold text-gray-800">
                                                    {roomType.availableRooms} phòng
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Amenities */}
                                <Card className="shadow-md border border-gray-200 bg-white">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Settings className="h-5 w-5 text-green-600" />
                                            <h3 className="text-lg font-bold text-gray-800">
                                                Tiện nghi
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {roomType.amenities.map((amenity, index) => {
                                                const IconComponent = AMENITY_ICONS[amenity] || CheckCircle;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 py-1"
                                                    >
                                                        <IconComponent className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                        <span className="text-sm text-gray-700">{amenity}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Available Rooms */}
                            <Card className="shadow-md border border-gray-200 bg-white">
                                <CardContent className="p-4">
                                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                                        Phòng có sẵn ({roomType.rooms?.length || 0} phòng)
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {roomType.rooms?.slice(0, 6).map((room) => (
                                            <RoomCard
                                                key={room.maPhong}
                                                room={room}
                                                router={router}
                                            />
                                        ))}
                                    </div>
                                    {roomType.rooms && roomType.rooms.length > 6 && (
                                        <div className="text-center mt-4">
                                            <Button variant="outline" size="sm">
                                                Xem thêm {roomType.rooms.length - 6} phòng
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Booking Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-8">
                                <Card className="shadow-md border border-gray-200 bg-white">
                                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                                        <div className="text-center">
                                            <div className="text-xl font-bold mb-1">
                                                {formatPriceRange(roomType.priceRange)}
                                            </div>
                                            <div className="text-blue-100 text-sm font-medium">mỗi đêm</div>
                                        </div>
                                    </div>

                                    <CardContent className="p-4 space-y-4">
                                        {/* Guest Info */}
                                        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <Users className="h-5 w-5 mx-auto text-green-600 mb-1" />
                                            <div className="text-xs text-gray-500 font-medium">
                                                Số khách
                                            </div>
                                            <div className="text-sm font-bold text-gray-800 mt-1">
                                                Tối đa {roomType.soNguoi} người
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                                                <Star className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
                                                <div className="text-xs text-gray-600">Đánh giá</div>
                                                <div className="text-sm font-bold text-gray-800">
                                                    {roomType.rating}/5
                                                </div>
                                            </div>
                                            <div className="text-center p-2 bg-green-50 rounded-lg">
                                                <CheckCircle className="h-4 w-4 mx-auto text-green-600 mb-1" />
                                                <div className="text-xs text-gray-600">Còn trống</div>
                                                <div className="text-sm font-bold text-gray-800">
                                                    {roomType.availableRooms} phòng
                                                </div>
                                            </div>
                                        </div>

                                        {/* Special Offers */}
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <p className="font-bold text-green-700 text-sm">
                                                    Ưu đãi đặc biệt
                                                </p>
                                            </div>
                                            <p className="text-xs text-green-600 mb-1">
                                                ✓ Miễn phí hủy trong 24 giờ
                                            </p>
                                            <p className="text-xs text-green-600">
                                                ✓ Không cần thanh toán trước
                                            </p>
                                        </div>

                                        {/* Action Button */}

                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Separate component for room cards to avoid duplication
interface RoomCardProps {
    room: Room;
    router: any;
}

function RoomCard({ room, router }: RoomCardProps) {
    const [roomImageLoaded, setRoomImageLoaded] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="relative h-24 w-full mb-2 rounded-lg overflow-hidden">
                <Image
                    src={`/img/rooms/${room.hinhAnh || "placeholder.jpg"}`}
                    alt={room.tenPhong}
                    fill
                    className={`object-cover ${roomImageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300 rounded-lg`}
                    onLoad={() => setRoomImageLoaded(true)}
                />
                {!roomImageLoaded && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
                )}
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {room.tenPhong}
                    </h4>
                    <Badge
                        className={`text-xs ${room.tinhTrang === phong_tinhTrang.Trong
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                    >
                        {TINH_TRANG_MAP[room.tinhTrang || phong_tinhTrang.Trong]}
                    </Badge>
                </div>
                <p className="text-sm font-bold text-blue-600">
                    {room.formattedGia}
                </p>
                <Button
                    size="sm"
                    className="w-full text-xs"
                    disabled={room.tinhTrang !== phong_tinhTrang.Trong}
                    onClick={() => router.push(`/rooms/${room.maPhong}`)}
                >
                    {room.tinhTrang === phong_tinhTrang.Trong
                        ? "Xem chi tiết"
                        : "Không khả dụng"}
                </Button>
            </div>
        </div>
    );
}