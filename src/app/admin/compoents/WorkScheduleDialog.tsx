"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface Room {
  maPhong: string;
  tenPhong: string;
}

interface Employee {
  maNhanVien: string;
  tenNhanVien: string;
}

interface WorkSchedule {
  maLichLamViec: string;
  maPhong: string;
  tenPhong: string;
  maNhanVien: string;
  tenNhanVien: string;
  ngayLam: string;
  loaiCV: "DonDep" | "SuaChua";
  trangThaiCV: "ChuaHoanThanh" | "DaHoanThanh";
}

interface WorkScheduleDialogProps {
  mode: "create" | "edit";
  schedule?: WorkSchedule;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function WorkScheduleDialog({ mode, schedule, onSuccess, children }: WorkScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState<Date | undefined>();
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

  const [formData, setFormData] = useState({
    maPhong: "",
    maNhanVien: "",
    loaiCongViec: "DonDep" as "DonDep" | "SuaChua",
    trangThaiCV: "ChuaHoanThanh" as "ChuaHoanThanh" | "DaHoanThanh",
  });

  useEffect(() => {
    if (formData.maPhong) {
      fetchDisabledDates(formData.maPhong);
    }
  }, [formData.maPhong]);

  const fetchDisabledDates = async (maPhong: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/rooms/${maPhong}/book-dates`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.data)) {
        const disabled: Date[] = [];
        for (const booking of data.data) {
          const start = new Date(booking.check_in);
          const end = new Date(booking.check_out);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            disabled.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          }
        }
        setDisabledDates(disabled);
      } else {
        console.error("Lỗi khi lấy ngày bận:", data);
      }
    } catch (error) {
      console.error("Lỗi khi fetch ngày bận:", error);
    }
  };

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
      }
    }
  }, [open, mode, schedule]);

  const fetchRoomsAndEmployees = async () => {
    try {
      const resRooms = await fetch(`${BASE_URL}/admin/api/rooms`);
      const dataRooms = await resRooms.json();
      if (resRooms.ok && Array.isArray(dataRooms.rooms)) {
        setRooms(dataRooms.rooms);
      } else {
        console.error("Rooms không hợp lệ:", dataRooms);
      }

      const resEmployees = await fetch(`${BASE_URL}/admin/api/employees-only`);
      const dataEmployees = await resEmployees.json();
      if (resEmployees.ok && Array.isArray(dataEmployees)) {
        setEmployees(dataEmployees);
      } else {
        console.error("Employees không hợp lệ:", dataEmployees);
      }
    } catch (error) {
      console.error("Lỗi khi fetch phòng và nhân viên:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.maPhong || !formData.maNhanVien || !date) {
      toast.error("Vui lòng điền đầy đủ thông tin", {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
      });
      return;
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
      onSuccess?.();

      if (mode === "create") {
        setFormData({
          maPhong: "",
          maNhanVien: "",
          loaiCongViec: "DonDep",
          trangThaiCV: "ChuaHoanThanh",
        });
        setDate(undefined);
      }
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Thêm lịch làm việc mới" : "Chỉnh sửa lịch làm việc"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Tạo lịch làm việc mới cho nhân viên" : "Cập nhật thông tin lịch làm việc"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Phòng *</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Nhân viên *</Label>
              <Select
                value={formData.maNhanVien}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, maNhanVien: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.maNhanVien} value={employee.maNhanVien}>
                      {employee.tenNhanVien} ({employee.maNhanVien})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  disabled={disabledDates}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">Loại công việc *</Label>
              <Select
                value={formData.loaiCongViec}
                onValueChange={(value: "DonDep" | "SuaChua") =>
                  setFormData((prev) => ({ ...prev, loaiCongViec: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DonDep">Dọn dẹp</SelectItem>
                  <SelectItem value="SuaChua">Sửa chữa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "edit" && (
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.trangThaiCV}
                  onValueChange={(value: "ChuaHoanThanh" | "DaHoanThanh") =>
                    setFormData((prev) => ({ ...prev, trangThaiCV: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ChuaHoanThanh">Chưa hoàn thành</SelectItem>
                    <SelectItem value="DaHoanThanh">Hoàn thành</SelectItem>
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