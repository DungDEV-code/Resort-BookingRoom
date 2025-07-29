"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash2, Calendar, User, Home, Plus, CheckCircle, XCircle, Pencil, Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { WorkScheduleDialog } from "../components/WorkScheduleDialog";
import { LoaiCongViec, lichlamviec_trangThaiCV, nhanvien_chucVu } from "@/generated/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Define TypeScript interfaces
interface WorkSchedule {
  maLichLamViec: string;
  maPhong: string;
  tenPhong: string;
  maNhanVien: string;
  tenNhanVien: string;
  chucVu: nhanvien_chucVu;
  ngayLam: string;
  loaiCV: LoaiCongViec;
  trangThaiCV: lichlamviec_trangThaiCV;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ open, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa lịch làm việc này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
          >
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getJobTypeBadge(loaiCV: LoaiCongViec) {
  switch (loaiCV) {
    case LoaiCongViec.DonDep:
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <Home className="w-3 h-3 mr-1" />
          Dọn dẹp
        </Badge>
      );
    case LoaiCongViec.SuaChua:
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <Clock className="w-3 h-3 mr-1" />
          Sửa chữa
        </Badge>
      );
    default:
      return <Badge variant="secondary">{loaiCV}</Badge>;
  }
}

function getStatusBadge(trangThaiCV: lichlamviec_trangThaiCV) {
  switch (trangThaiCV) {
    case lichlamviec_trangThaiCV.DaHoanThanh:
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Hoàn thành
        </Badge>
      );
    case lichlamviec_trangThaiCV.ChuaHoanThanh:
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
          <Clock className="w-3 h-3 mr-1" />
          Chưa hoàn thành
        </Badge>
      );
    default:
      return <Badge variant="secondary">{trangThaiCV}</Badge>;
  }
}

function getChucVuBadge(chucVu: nhanvien_chucVu) {
  const config = {
    [nhanvien_chucVu.DonDep]: "Nhân viên dọn dẹp",
    [nhanvien_chucVu.SuaChua]: "Nhân viên sửa chữa",
    [nhanvien_chucVu.LeTan]: "Lễ tân",
    [nhanvien_chucVu.BaoVe]: "Bảo vệ",
    [nhanvien_chucVu.QuanLy]: "Quản lý",
  };

  return (
    <Badge variant="secondary" className="bg-purple-100 text-purple-600 hover:bg-purple-200">
      {config[chucVu]}
    </Badge>
  );
}

export default function WorkSchedulePage() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/admin/api/schedule`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Lỗi khi tải lịch làm việc");

      const data: WorkSchedule[] = await res.json();
      setSchedules(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Lỗi khi tải dữ liệu", {
        description: err.message,
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter schedules based on search term
  const filteredSchedules = useMemo(() => {
    if (!searchTerm.trim()) return schedules;
    const searchLower = searchTerm.toLowerCase().trim();
    return schedules.filter(
      (schedule) =>
        schedule.maLichLamViec.toLowerCase().includes(searchLower) ||
        schedule.tenPhong.toLowerCase().includes(searchLower) ||
        schedule.maPhong.toLowerCase().includes(searchLower) ||
        schedule.tenNhanVien.toLowerCase().includes(searchLower) ||
        schedule.maNhanVien.toLowerCase().includes(searchLower) ||
        schedule.chucVu.toLowerCase().includes(searchLower) ||
        formatDate(schedule.ngayLam).includes(searchLower) ||
        schedule.loaiCV.toLowerCase().includes(searchLower)
    );
  }, [schedules, searchTerm]);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;

    setDeleting(confirmDeleteId);
    try {
      const res = await fetch(`${BASE_URL}/admin/api/schedule/${confirmDeleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Không thể xóa lịch làm việc");
      }

      toast.success("Xóa lịch làm việc thành công!", {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        duration: 3000,
      });

      await fetchSchedules();
    } catch (error) {
      toast.error("Lỗi khi xóa lịch làm việc", {
        description: error instanceof Error ? error.message : "Lỗi khi kết nối tới server",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000,
      });
    } finally {
      setDeleting(null);
      setConfirmDeleteId(null);
    }
  };

  const handleScheduleUpdate = async () => {
    await fetchSchedules();
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Có lỗi xảy ra</h3>
          <p className="text-gray-600">{error}</p>
          <Button
            onClick={fetchSchedules}
            className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Quản lý lịch làm việc
            </h1>
            <p className="text-gray-600 text-lg">Quản lý và phân công lịch làm việc cho nhân viên</p>
          </div>
          <WorkScheduleDialog mode="create" onSuccess={handleScheduleUpdate}>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3">
              <Plus className="w-5 h-5 mr-2" />
              Thêm lịch làm việc
            </Button>
          </WorkScheduleDialog>
        </div>

        {/* Search Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm theo mã lịch, phòng, nhân viên, chức vụ, ngày làm, loại công việc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                Tìm thấy <span className="font-semibold text-blue-600">{filteredSchedules.length}</span> kết quả cho "
                {searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Danh sách lịch làm việc
              {searchTerm && (
                <Badge variant="secondary" className="ml-2">
                  {filteredSchedules.length} kết quả
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 hover:from-slate-100 hover:to-gray-100">
                    <TableHead className="font-semibold text-gray-700 py-4">Mã lịch</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        Phòng
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Nhân viên
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Chức vụ</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Ngày làm
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Loại công việc</TableHead>
                    <TableHead className="font-semibold text-gray-700">Trạng thái</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule: WorkSchedule, index: number) => (
                    <TableRow
                      key={schedule.maLichLamViec}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <TableCell className="font-mono font-medium text-blue-600 py-4">
                        {schedule.maLichLamViec.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">{schedule.tenPhong}</div>
                          <div className="text-sm text-gray-500 font-mono">{schedule.maPhong}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-800">{schedule.tenNhanVien}</div>
                          <div className="text-sm text-gray-500 font-mono">{schedule.maNhanVien}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getChucVuBadge(schedule.chucVu)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {formatDate(schedule.ngayLam)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getJobTypeBadge(schedule.loaiCV)}</TableCell>
                      <TableCell>{getStatusBadge(schedule.trangThaiCV)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <WorkScheduleDialog mode="edit" schedule={schedule} onSuccess={handleScheduleUpdate}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Sửa
                            </Button>
                          </WorkScheduleDialog>
                          <Button
                            size="sm"
                            onClick={() => setConfirmDeleteId(schedule.maLichLamViec)}
                            disabled={deleting === schedule.maLichLamViec}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredSchedules.length === 0 && !searchTerm && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Chưa có lịch làm việc nào</h3>
                <p className="text-gray-600">Hãy thêm lịch làm việc đầu tiên để bắt đầu quản lý</p>
                <WorkScheduleDialog mode="create" onSuccess={handleScheduleUpdate}>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 mt-4">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm lịch làm việc đầu tiên
                  </Button>
                </WorkScheduleDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Search Results */}
        {filteredSchedules.length === 0 && searchTerm && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Không tìm thấy kết quả</h3>
                <p className="text-gray-600">Không có lịch làm việc nào phù hợp với từ khóa "{searchTerm}"</p>
                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                  Xóa bộ lọc
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <DeleteConfirmDialog
          open={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}