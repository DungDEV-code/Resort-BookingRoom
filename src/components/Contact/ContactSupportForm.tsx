"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ContactSupportFormProps {
  open: boolean;
  onClose: () => void;
}

export default function ContactSupportForm({ open, onClose }: ContactSupportFormProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [supportType, setSupportType] = useState("Đặt phòng");
  const [viewMode, setViewMode] = useState<"form" | "history">("form");

  const mockHistory = [
    {
      id: 1,
      type: "Đặt phòng",
      message: "Tôi không thấy email xác nhận đặt phòng.",
      date: "22/06/2025",
      status: "Đã giải quyết",
    },
    {
      id: 2,
      type: "Thanh toán",
      message: "Tôi bị trừ tiền 2 lần.",
      date: "18/06/2025",
      status: "Đang xử lý",
    },
  ];

  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📩 Gửi yêu cầu hỗ trợ:", {
      email,
      supportType,
      message,
    });
    // TODO: Gửi qua API thực tế
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {/* 👇 Fix accessibility bắt buộc: */}
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Liên hệ hỗ trợ</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>

        {/* 👇 Tabs chuyển chế độ */}
        <div className="mb-4 flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setViewMode("form")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === "form"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-gray-500 hover:text-sky-600"
            }`}
          >
            Gửi yêu cầu
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === "history"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-gray-500 hover:text-sky-600"
            }`}
          >
            Lịch sử hỗ trợ
          </button>
        </div>

        {viewMode === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email của bạn</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="supportType">Loại yêu cầu</Label>
              <select
                id="supportType"
                value={supportType}
                onChange={(e) => setSupportType(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="Thanh toán">Vấn đề thanh toán</option>
                <option value="Đặt phòng">Sự cố khi đặt phòng</option>
                <option value="Thông tin cá nhân">Cập nhật thông tin cá nhân</option>
                <option value="Dịch vụ khác">Dịch vụ khác</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <Label htmlFor="message">Nội dung cần hỗ trợ</Label>
              <Textarea
                id="message"
                required
                placeholder="Vui lòng mô tả vấn đề bạn đang gặp phải..."
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-y overflow-hidden whitespace-pre-wrap break-words"
              />
            </div>
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white">
              Gửi yêu cầu
            </Button>
          </form>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {mockHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">Bạn chưa có yêu cầu nào trước đây.</p>
            ) : (
              mockHistory.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border-l-4 rounded-md shadow-sm bg-white border 
                    ${
                      item.status === "Đã giải quyết"
                        ? "border-emerald-500"
                        : "border-orange-400"
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold text-gray-800">
                      📌 {item.type}
                    </div>
                    <span
                      className={`text-xs font-bold rounded-full px-3 py-1 
                        ${
                          item.status === "Đã giải quyết"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.message}</p>
                  <div className="text-xs text-gray-500 mt-2">🕒 {item.date}</div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
