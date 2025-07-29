"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { LoaiCongViec, lichlamviec_trangThaiCV, nhanvien_chucVu } from "@/generated/prisma";
import { Input } from "@/components/ui/input";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface Room {
  maPhong: string;
  tenPhong: string;
}

interface Employee {
  maNhanVien: string;
  tenNhanVien: string;
  chucVu: nhanvien_chucVu;
}

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

interface WorkScheduleDialogProps {
  mode: "create" | "edit";
  schedule?: WorkSchedule;
  onSuccess?: () => Promise<void>;
  children: React.ReactNode;
}

export function WorkScheduleDialog({ mode, schedule, onSuccess, children }: WorkScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState<Date | undefined>();

  const [formData, setFormData] = useState({
    maPhong: "",
    maNhanVien: "",
    loaiCongViec: LoaiCongViec.DonDep as LoaiCongViec,
    trangThaiCV: lichlamviec_trangThaiCV.ChuaHoanThanh as lichlamviec_trangThaiCV,
  });

  // Lọc danh sách nhân viên dựa trên loại công việc (chỉ dùng trong chế độ create)
  const filteredEmployees = useMemo(() => {
    if (mode === "edit") return employees; // Trong chế độ edit, không cần lọc
    return employees.filter(
      (employee) =>
        (formData.loaiCongViec === LoaiCongViec.DonDep && employee.chucVu === nhanvien_chucVu.DonDep) ||
        (formData.loaiCongViec === LoaiCongViec.SuaChua && employee.chucVu === nhanvien_chucVu.SuaChua)
    );
  }, [employees, formData.loaiCongViec, mode]);

  // Ngày hiện tại (dùng ngày hiện tại thực tế)
  const today = startOfDay(new Date());

  useEffect(() => {
    if (open) {
      fetchRoomsAndEmployees();
      if (mode === "edit" && schedule) {
        setFormData({
          maPhong: schedule.maPhong,
          maNhanVien: schedule.maNhanVien,
          loaiCongViec: schedule.loaiCV,
          trangThaiCV: schedule.trangThaiCV,
        });
        setDate(new Date(schedule.ngayLam));
      } else {
        setFormData({
          maPhong: "",
          maNhanVien: "",
          loaiCongViec: LoaiCongViec.DonDep,
          trangThaiCV: lichlamviec_trangThaiCV.ChuaHoanThanh,
        });
        setDate(undefined);
      }
    }
  }, [open, mode, schedule]);

  const fetchRoomsAndEmployees = async () => {
    try {
      const resRooms = await fetch(`${BASE_URL}/admin/api/rooms`, {
        cache: "no-store",
      });
      const dataRooms = await resRooms.json();
      if (resRooms.ok && Array.isArray(dataRooms.rooms)) {
        setRooms(dataRooms.rooms);
      } else {
        toast.error("Lỗi khi lấy danh sách phòng", {
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          duration: 5000,
        });
      }

      const resEmployees = await fetch(`${BASE_URL}/admin/api/employees-only`, {
        cache: "no-store",
      });
      const dataEmployees = await resEmployees.json();
      if (resEmployees.ok && Array.isArray(dataEmployees)) {
        setEmployees(dataEmployees);
      } else {
        toast.error("Lỗi khi lấy danh sách nhân viên", {
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Lỗi khi fetch phòng và nhân viên:", error);
      toast.error("Lỗi khi tải dữ liệu", {
        description: error instanceof Error ? error.message : "Lỗi kết nối server",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.maPhong || !formData.maNhanVien || !date) {
      toast.error("Vui lòng điền đầy đủ thông tin", {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000,
      });
      return;
    }

    // Kiểm tra ngày làm việc không được là quá khứ trong chế độ create
    if (mode === "create" && date < today) {
      toast.error("Ngày làm việc phải là hôm nay hoặc trong tương lai", {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000,
      });
      return;
    }

    // Kiểm tra nhân viên có chức vụ phù hợp với loại công việc (chỉ trong chế độ create)
    if (mode === "create") {
      const selectedEmployee = employees.find((emp) => emp.maNhanVien === formData.maNhanVien);
      if (
        selectedEmployee &&
        ((formData.loaiCongViec === LoaiCongViec.DonDep && selectedEmployee.chucVu !== nhanvien_chucVu.DonDep) ||
         (formData.loaiCongViec === LoaiCongViec.SuaChua && selectedEmployee.chucVu !== nhanvien_chucVu.SuaChua))
      ) {
        toast.error(`Nhân viên với chức vụ ${selectedEmployee.chucVu} không thể thực hiện công việc ${formData.loaiCongViec}`, {
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          duration: 5000,
        });
        return;
      }
    }

    setLoading(true);

    try {
      const url =
        mode === "create"
          ? `${BASE_URL}/admin/api/schedule`
          : `${BASE_URL}/admin/api/schedule/${schedule?.maLichLamViec}`;
      const method = mode === "create" ? "POST" : "PUT";

      const payload = {
        maPhong: formData.maPhong,
        maNhanVien: formData.maNhanVien,
        ngayLam: format(date, "yyyy-MM-dd"),
        loaiCongViec: formData.loaiCongViec,
        ...(mode === "edit" && { trangThaiCV: formData.trangThaiCV }),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Có lỗi xảy ra");
      }

      toast.success(mode === "create" ? "Thêm lịch làm việc thành công!" : "Cập nhật lịch làm việc thành công!", {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        duration: 3000,
      });

      setOpen(false);
      await onSuccess?.();
    } catch (error) {
      toast.error("Có lỗi xảy ra", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Logic vô hiệu hóa ngày quá khứ
  const isDateDisabled = (dateToCheck: Date) => {
    if (mode === "create") {
      // Trong chế độ create, vô hiệu hóa các ngày trước ngày hiện tại
      return dateToCheck < today;
    } else if (mode === "edit" && schedule) {
      // Trong chế độ edit, cho phép giữ ngày hiện tại của lịch, nhưng vô hiệu hóa các ngày quá khứ khác
      const originalDate = startOfDay(new Date(schedule.ngayLam));
      return dateToCheck < today && dateToCheck.getTime() !== originalDate.getTime();
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {mode === "create" ? "Thêm lịch làm việc mới" : "Chỉnh sửa lịch làm việc"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Tạo lịch làm việc mới cho nhân viên" : "Cập nhật ngày làm việc hoặc trạng thái"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Phòng *</Label>
              {mode === "edit" ? (
                <Input
                  value={
                    rooms.find((room) => room.maPhong === formData.maPhong)?.tenPhong +
                    ` (${formData.maPhong})`
                  }
                  disabled
                  className="bg-gray-100"
                />
              ) : (
                <Select
                  value={formData.maPhong}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, maPhong: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.maPhong} value={room.maPhong}>
                        {room.tenPhong} ({room.maPhong})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Nhân viên *</Label>
              {mode === "edit" ? (
                <Input
                  value={
                    employees.find((emp) => emp.maNhanVien === formData.maNhanVien)?.tenNhanVien +
                    ` (${formData.maNhanVien})`
                  }
                  disabled
                  className="bg-gray-100"
                />
              ) : (
                <Select
                  value={formData.maNhanVien}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, maNhanVien: value }))}
                  required
                  disabled={filteredEmployees.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredEmployees.length === 0 ? "Không có nhân viên phù hợp" : "Chọn nhân viên"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((employee) => (
                      <SelectItem key={employee.maNhanVien} value={employee.maNhanVien}>
                        {employee.tenNhanVien} ({employee.maNhanVien}) - {employee.chucVu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ngày làm việc *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  {date ? format(date, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selected) => setDate(selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()) : undefined)}
                  initialFocus
                  locale={vi}
                  disabled={isDateDisabled}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">Loại công việc *</Label>
              {mode === "edit" ? (
                <Input
                  value={formData.loaiCongViec === LoaiCongViec.DonDep ? "Dọn dẹp" : "Sửa chữa"}
                  disabled
                  className="bg-gray-100"
                />
              ) : (
                <Select
                  value={formData.loaiCongViec}
                  onValueChange={(value: LoaiCongViec) => {
                    setFormData((prev) => ({ ...prev, loaiCongViec: value, maNhanVien: "" }));
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại công việc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LoaiCongViec.DonDep}>Dọn dẹp</SelectItem>
                    <SelectItem value={LoaiCongViec.SuaChua}>Sửa chữa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {mode === "edit" && (
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.trangThaiCV}
                  onValueChange={(value: lichlamviec_trangThaiCV) =>
                    setFormData((prev) => ({ ...prev, trangThaiCV: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={lichlamviec_trangThaiCV.ChuaHoanThanh}>Chưa hoàn thành</SelectItem>
                    <SelectItem value={lichlamviec_trangThaiCV.DaHoanThanh}>Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              {loading ? "Đang xử lý..." : mode === "create" ? "Thêm mới" : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}