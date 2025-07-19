"use client"

import { type JSX, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"


export default function Account({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    tenKhachHang: "",
    ngaySinh: "",
    gioiTinh: "",
    diaChi: "",
    soDienThoai: "",
    membership: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [accountForm, setAccountForm] = useState({
    userName: user?.userName || "",
    passWord: "",
    trangThaiTk: user?.trangThaiTk || "",
  })

  // Map cấp độ thành viên với icon và màu sắc - ĐÃ SỬA ĐƯỜNG DẪN
  const MEMBERSHIP_MAP: Record<string, { label: string; icon: JSX.Element; color: string }> = {
    Bronze: {
      label: "Thành viên Đồng",
      icon: (
        <img
          src="/img/icons/bronze.webp"
          alt="Bronze"
          className="w-8 h-8 object-contain"
          onError={(e) => {
            console.error("Không thể tải ảnh bronze:", e)
            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
          }}
        />
      ),
      color: "text-amber-600",
    },
    Silver: {
      label: "Thành viên Bạc",
      icon: (
        <img
          src="/img/icons/silver.webp"
          alt="Silver"
          className="w-8 h-8 object-contain"
          onError={(e) => {
            console.error("Không thể tải ảnh silver:", e)
            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
          }}
        />
      ),
      color: "text-gray-500",
    },
    Gold: {
      label: "Thành viên Vàng",
      icon: (
        <img
          src="/img/icons/gold.jpg"
          alt="Gold"
          className="w-8 h-8 object-contain"
          onError={(e) => {
            console.error("Không thể tải ảnh gold:", e)
            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
          }}
        />
      ),
      color: "text-yellow-500",
    },
    Diamond: {
      label: "Thành viên Kim Cương",
      icon: (
        <img
          src="/img/icons/diamond.webp"
          alt="Diamond"
          className="w-8 h-8 object-contain"
          onError={(e) => {
            console.error("Không thể tải ảnh diamond:", e)
            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
          }}
        />
      ),
      color: "text-cyan-500",
    },
  }

  useEffect(() => {
    if (!user?.email) return

    // Fetch dữ liệu khách hàng
    fetch(`/api/khachhang/${user.email}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Dữ liệu từ API:", data) // Debug log
        if (data) {
          setIsEditing(true)
          setFormData({
            tenKhachHang: data.tenKhachHang || "",
            ngaySinh: data.ngaySinh?.slice(0, 10) || "",
            gioiTinh: data.gioiTinh || "",
            diaChi: data.diaChi || "",
            soDienThoai: data.soDienThoai || "",
            membership: data.membership?.level || "Bronze",
          })
          console.log("Membership level:", data.membership?.level) // Debug membership
        }
      })
      .catch((err) => {
        console.error("Lỗi khi lấy thông tin khách hàng:", err)
        toast.error("Không thể tải thông tin khách hàng!")
      })

    // Fetch dữ liệu tài khoản admin
    fetch(`/api/roleadminuser/${user.email}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể lấy dữ liệu tài khoản")

        const text = await res.text()
        if (!text) throw new Error("Không có dữ liệu trả về")

        return JSON.parse(text)
      })
      .then((data) => {
        if (data?.trangThaiTk) {
          setAccountForm((prev) => ({
            ...prev,
            userName: data.userName,
            trangThaiTk: data.trangThaiTk,
          }))
        }
      })
      .catch((err) => {
        console.error("Lỗi khi lấy trạng thái tài khoản:", err)
        toast.error("Không thể tải trạng thái tài khoản!")
      })
  }, [user?.email])

  const handleAccountChange = (e: any) => {
    const { name, value } = e.target
    setAccountForm((prev) => ({ ...prev, [name]: value }))
  }

  const TRANG_THAI_TK_MAP: Record<string, string> = {
    DangHoatDong: "Đang Hoạt Động",
    BiKhoa: "Bị Khóa",
  }

  const handleAccountSubmit = async () => {

    if (accountForm.passWord.length > 0 && accountForm.passWord.length < 4) {
      toast.error("Mật khẩu phải có ít nhất 4 ký tự!")
      return
    }

    const res = await fetch(`/api/roleadminuser/${user.email}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountForm),
    })

    if (res.ok) {
      toast.success("Cập nhật tài khoản thành công!")
      onClose()
    } else {
      toast.error("Cập nhật tài khoản thất bại!")
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    console.log("📦 Dữ liệu gửi lên API:", {
      ...formData,
      maUser: user.email,
    });
    // Kiểm tra xem khách hàng đã tồn tại chưa
    const checkRes = await fetch(`/api/khachhang/${user.email}`);
    const isExist = checkRes.ok;

    const method = isExist ? "PUT" : "POST";
    const url = isExist ? `/api/khachhang/${user.email}` : `/api/khachhang`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, maUser: user.email }),
    });

    if (res.ok) {
      toast.success(isExist ? "Cập nhật thành công!" : "Lưu thông tin thành công!");
      onClose();
    } else {
      const data = await res.json().catch(() => null);
      const errorMessage = data?.error || "Đã xảy ra lỗi, vui lòng thử lại!";
      toast.error(errorMessage);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cài Đặt Tài Khoản
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="personal">Thông Tin Cá Nhân</TabsTrigger>
            <TabsTrigger value="account">Thông Tin Tài Khoản</TabsTrigger>
          </TabsList>

          {/* Tab Cá Nhân */}
          <TabsContent value="personal">
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Họ và tên</label>
                <Input
                  name="tenKhachHang"
                  placeholder="Tên khách hàng"
                  value={formData.tenKhachHang}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Ngày sinh</label>
                <Input type="date" name="ngaySinh" value={formData.ngaySinh} onChange={handleChange} />
              </div>

              <div>
                <label className="block mb-1 font-medium">Giới tính</label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="gioiTinh"
                      value="Nam"
                      checked={formData.gioiTinh === "Nam"}
                      onChange={handleChange}
                    />
                    <span>Nam</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="gioiTinh"
                      value="Nữ"
                      checked={formData.gioiTinh === "Nữ"}
                      onChange={handleChange}
                    />
                    <span>Nữ</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Địa chỉ</label>
                <Input name="diaChi" placeholder="Địa chỉ" value={formData.diaChi} onChange={handleChange} />
              </div>

              <div>
                <label className="block mb-1 font-medium">Số điện thoại</label>
                <Input
                  name="soDienThoai"
                  placeholder="Số điện thoại"
                  value={formData.soDienThoai}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Cấp độ thành viên</label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {MEMBERSHIP_MAP[formData.membership]?.icon || (
                    <img src="/placeholder.svg?height=32&width=32" alt="Default" className="w-8 h-8" />
                  )}
                  <span className={`font-semibold ${MEMBERSHIP_MAP[formData.membership]?.color || "text-gray-600"}`}>
                    {MEMBERSHIP_MAP[formData.membership]?.label || "Chưa xác định"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isEditing ? "Cập nhật" : "Lưu thông tin"}
              </Button>
            </div>
          </TabsContent>

          {/* Tab Tài Khoản */}
          <TabsContent value="account">
            <div className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Email (định danh tài khoản)</label>
                <Input value={user?.email} disabled />
              </div>

              <div>
                <label className="block mb-1 font-medium">Tên đăng nhập</label>
                <Input name="userName" placeholder="Tên đăng nhập" value={accountForm.userName} disabled />
              </div>

              <div>
                <label className="block mb-1 font-medium">Mật khẩu mới</label>
                <Input
                  type="password"
                  name="passWord"
                  placeholder="Mật khẩu mới"
                  value={accountForm.passWord}
                  onChange={handleAccountChange}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Trạng thái tài khoản</label>
                <Input
                  name="trangThaiTk"
                  placeholder="Trạng thái tài khoản"
                  value={TRANG_THAI_TK_MAP[accountForm.trangThaiTk] || "Không xác định"}
                  disabled
                />
              </div>

              <Button
                onClick={handleAccountSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Cập nhật tài khoản
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
