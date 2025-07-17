// app/admin/comments/page.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Add Shadcn Select component
import { RefreshCw, AlertCircle, MessageSquare, Hash, Calendar, Check, X, Star, Clock, Search, Trash2 } from "lucide-react";

interface Comment {
    maBinhLuan: string;
    maDatPhong: string;
    noiDung: string;
    danhGia: number;
    thoiGianBL: string;
    trangThai: string;
    datphong: {
        maPhong: string;
        khachhang: {
            tenKhachHang: string;
        };
    };
}

interface ApiResponse {
    data: Comment[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

const CommentsPage = () => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all"); // New state for status filter
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Hàm lấy danh sách bình luận
    const fetchComments = async (page: number = 1, search: string = "", status: string = "all") => {
        setLoading(true);
        setError(null);
        try {
            const url = new URL(`${BASE_URL}/admin/api/comments`);
            url.searchParams.set("page", page.toString());
            url.searchParams.set("limit", "7");
            if (search) {
                url.searchParams.set("maBinhLuan", search); // Search specifically by maBinhLuan
            }
            if (status !== "all") {
                url.searchParams.set("trangThai", status); // Add status filter
            }
            const response = await fetch(url, {
                headers: {
                    "Cache-Control": "no-store",
                },
            });
            const data: ApiResponse = await response.json();
            if (response.ok && Array.isArray(data.data)) {
                setComments(data.data);
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
            } else {
                throw new Error("Invalid comments response");
            }
        } catch (err: any) {
            console.error("Error fetching comments:", err);
            setError("Không thể tải danh sách bình luận");
            setComments([]);
            toast.error("Lỗi hệ thống khi tải bình luận!");
        } finally {
            setLoading(false);
        }
    };

    const deleteComment = async (maBinhLuan: string) => {
        try {
            const response = await fetch(`${BASE_URL}/admin/api/comments/${maBinhLuan}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(`Xóa thất bại: ${errorData.message || "Lỗi không xác định"}`);
                return;
            }

            toast.success(`✅ Đã xóa bình luận ${maBinhLuan}`);

            if (comments.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1); // Quay lại trang trước nếu trang hiện tại bị trống
            } else {
                fetchComments(currentPage, searchTerm, statusFilter); // Tải lại trang hiện tại
            }
        } catch (error: any) {
            console.error("Error deleting comment:", error);
            toast.error("⚠️ Lỗi hệ thống khi xóa bình luận!");
        }
    };

    // Tải dữ liệu khi trang, tìm kiếm hoặc trạng thái thay đổi
    useEffect(() => {
        fetchComments(currentPage, searchTerm, statusFilter);
    }, [currentPage, searchTerm, statusFilter]);

    const handleRefresh = () => {
        fetchComments(currentPage, searchTerm, statusFilter);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to page 1 when search changes
    };

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1); // Reset to page 1 when status filter changes
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return isNaN(date.getTime())
            ? "N/A"
            : date.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                    />
                ))}
                <div className="text-xs font-medium text-gray-600 mt-1">({rating})</div>
            </div>
        );
    };

    const renderStatus = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
            ChoPheDuyet: {
                label: "Chờ duyệt",
                className: "bg-yellow-50 text-yellow-700 border-yellow-200",
                icon: <Clock className="h-3 w-3" />,
            },
            DaPheDuyet: {
                label: "Đã duyệt",
                className: "bg-green-50 text-green-700 border-green-200",
                icon: <Check className="h-3 w-3" />,
            },
            BiTuChoi: {
                label: "Từ chối",
                className: "bg-red-50 text-red-700 border-red-200",
                icon: <X className="h-3 w-3" />,
            },
        };

        const config = statusConfig[status] || {
            label: status,
            className: "bg-gray-50 text-gray-700 border-gray-200",
            icon: null,
        };

        return (
            <Badge variant="outline" className={`${config.className} text-xs px-2 py-1`}>
                <div className="flex items-center gap-1">
                    {config.icon}
                    {config.label}
                </div>
            </Badge>
        );
    };

    const updateCommentStatus = async (commentId: string, newStatus: string) => {
        try {
            const response = await fetch(`${BASE_URL}/admin/api/comments/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ trangThai: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.error(`Cập nhật thất bại: ${errorData.message || "Lỗi không xác định"}`);
                return;
            }

            const statusLabel = newStatus === "DaPheDuyet" ? "PHÊ DUYỆT" : "TỪ CHỐI";
            toast.success(`✅ Đã ${statusLabel} bình luận ${commentId}`);
            fetchComments(currentPage, searchTerm, statusFilter);
        } catch (error: any) {
            console.error("Error updating comment status:", error);
            toast.error("⚠️ Lỗi hệ thống khi cập nhật trạng thái bình luận!");
        }
    };

    const truncateText = (text: string, maxLength = 40) => {
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    // Component skeleton khi loading
    const LoadingSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="grid grid-cols-7 gap-4 items-center">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                            Quản Lý Bình Luận
                        </h1>
                        <p className="text-gray-600 text-base lg:text-lg">
                            Quản lý và kiểm duyệt tất cả các bình luận từ khách hàng
                        </p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 w-full lg:w-auto"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                </div>

                {/* Search and Status Filter */}
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Tìm theo mã bình luận"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 w-full"
                        />
                    </div>
                    <Select onValueChange={handleStatusFilterChange} value={statusFilter}>
                        <SelectTrigger className="w-full lg:w-48">
                            <SelectValue placeholder="Lọc theo trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="ChoPheDuyet">Chờ duyệt</SelectItem>
                            <SelectItem value="DaPheDuyet">Đã duyệt</SelectItem>
                            <SelectItem value="BiTuChoi">Từ chối</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Thông báo lỗi */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {/* Trạng thái loading */}
                {loading && <LoadingSkeleton />}

                {/* Bảng dữ liệu hoặc trạng thái không có dữ liệu */}
                {!loading && (
                    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                Danh sách bình luận
                                <Badge variant="secondary" className="ml-2">
                                    {comments.length} bình luận
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {comments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="h-8 w-8 text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có dữ liệu</h3>
                                    <p className="text-gray-600 text-center max-w-md">
                                        Không tìm thấy bình luận phù hợp với tìm kiếm của bạn.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-50 border-b">
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-left w-[120px]">
                                                        <div className="flex items-center gap-1">
                                                            <Hash className="h-3 w-3" />
                                                            <span className="text-xs">Mã BL</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-left w-[120px]">
                                                        <div className="flex items-center gap-1">
                                                            <Hash className="h-3 w-3" />
                                                            <span className="text-xs">Mã ĐP</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-left w-[200px]">
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            <span className="text-xs">Nội Dung</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-center w-[80px]">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Star className="h-3 w-3" />
                                                            <span className="text-xs">Đánh Giá</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-center w-[120px]">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-xs">Thời Gian</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-center w-[100px]">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            <span className="text-xs">Trạng Thái</span>
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-gray-700 py-3 px-3 text-center w-[120px]">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Check className="h-3 w-3" />
                                                            <span className="text-xs">Hành Động</span>
                                                        </div>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {comments.map((comment, index) => (
                                                    <TableRow
                                                        key={comment.maBinhLuan}
                                                        className={`hover:bg-gray-50 transition-colors duration-150 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                                                    >
                                                        <TableCell className="py-3 px-3">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs px-2 py-1"
                                                            >
                                                                {comment.maBinhLuan}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3">
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-purple-50 text-purple-700 border-purple-200 font-mono text-xs px-2 py-1"
                                                            >
                                                                {comment.maDatPhong}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3 w-[200px]">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <div
                                                                        className="max-w-[200px] truncate cursor-pointer hover:text-blue-600"
                                                                        onClick={() => setSelectedComment(comment)}
                                                                        title={comment.noiDung}
                                                                    >
                                                                        <p className="text-xs text-gray-800 leading-relaxed">
                                                                            {truncateText(comment.noiDung, 50)}
                                                                        </p>
                                                                    </div>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[425px]">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Nội dung bình luận</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="mt-2">
                                                                        <p className="text-sm text-gray-800 leading-relaxed break-words">
                                                                            {selectedComment?.noiDung}
                                                                        </p>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3 text-center">{renderStars(comment.danhGia)}</TableCell>
                                                        <TableCell className="py-3 px-3 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                                <span className="text-xs text-gray-600 font-medium leading-tight">
                                                                    {formatDate(comment.thoiGianBL)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-3 text-center">{renderStatus(comment.trangThai)}</TableCell>
                                                        <TableCell className="py-3 px-3 text-center">
                                                            <div className="flex flex-col gap-1">
                                                                {comment.trangThai === "ChoPheDuyet" && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateCommentStatus(comment.maBinhLuan, "DaPheDuyet")}
                                                                            className="text-xs h-7 px-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors duration-150"
                                                                        >
                                                                            <Check className="h-3 w-3 mr-1" />
                                                                            Duyệt
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => updateCommentStatus(comment.maBinhLuan, "BiTuChoi")}
                                                                            className="text-xs h-7 px-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors duration-150"
                                                                        >
                                                                            <X className="h-3 w-3 mr-1" />
                                                                            Từ chối
                                                                        </Button>
                                                                    </>
                                                                )}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => deleteComment(comment.maBinhLuan)}
                                                                    className="text-xs h-7 px-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors duration-150"
                                                                >
                                                                    <Trash2 className="h-3 w-3 mr-1" />
                                                                    Xóa
                                                                </Button>
                                                                {comment.trangThai !== "ChoPheDuyet" && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled
                                                                        className="text-xs h-7 px-2"
                                                                    >
                                                                        Đã xử lý
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {/* Pagination Controls */}
                                    <div className="flex justify-between items-center p-4">
                                        <div className="text-sm text-gray-600">
                                            Trang {currentPage} / {totalPages}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="text-xs"
                                            >
                                                Trang trước
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="text-xs"
                                            >
                                                Trang sau
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CommentsPage;