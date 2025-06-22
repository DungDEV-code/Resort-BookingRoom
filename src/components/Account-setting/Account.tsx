import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";

export default function Account({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        tenKhachHang: "",
        ngaySinh: "",
        gioiTinh: "",
        diaChi: "",
        soDienThoai: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [accountForm, setAccountForm] = useState({
        userName: user?.userName || "",
        passWord: "",
        trangThaiTk: user?.trangThaiTk || "",
    });

    // ✅ Di chuyển fetch vào useEffect
    useEffect(() => {
        if (!user?.email) return;

        // Fetch dữ liệu khách hàng
        fetch(`/api/khachhang/${user.email}`)
            .then((res) => res.json())
            .then((data) => {
                if (data) {
                    setIsEditing(true);
                    setFormData({
                        ...data,
                        ngaySinh: data.ngaySinh?.slice(0, 10) || "",
                    });
                }
            })
            .catch((err) => {
                console.error("Lỗi khi lấy thông tin khách hàng:", err);
            });

        // Fetch dữ liệu tài khoản admin
        fetch(`/api/roleadminuser/${user.email}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Không thể lấy dữ liệu tài khoản");

                const text = await res.text();
                if (!text) throw new Error("Không có dữ liệu trả về");

                return JSON.parse(text);
            })
            .then((data) => {
                if (data?.trangThaiTk) {
                    setAccountForm(prev => ({
                        ...prev,
                        userName: data.userName,
                        trangThaiTk: data.trangThaiTk,
                    }));
                }
            })
            .catch((err) => {
                console.error("Lỗi khi lấy trạng thái tài khoản:", err);
            });
    }, [user?.email]); // Chỉ gọi lại khi email thay đổi

    const handleAccountChange = (e: any) => {
        const { name, value } = e.target;
        setAccountForm((prev) => ({ ...prev, [name]: value }));
    };

    const TRANG_THAI_TK_MAP: Record<string, string> = {
        DangHoatDong: "Đang Hoạt Động",
        BiKhoa: "Bị Khóa",
    };

    const handleAccountSubmit = async () => {
        if (accountForm.passWord.length > 0 && accountForm.passWord.length < 4) {
            toast.error("Mật khẩu phải có ít nhất 4 ký tự!");
            return;
        }

        const res = await fetch(`/api/roleadminuser/${user.email}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(accountForm),
        });

        if (res.ok) {
            toast.success("Cập nhật tài khoản thành công!");
            onClose();
        } else {
            toast.error("Cập nhật tài khoản thất bại!");
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const method = isEditing ? "PUT" : "POST";
        const url = isEditing ? `/api/khachhang/${user.email}` : `/api/khachhang`;
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, maUser: user.email }),
        });

        if (res.ok) {
            toast.success(isEditing ? "Cập nhật thành công!" : "Lưu thông tin thành công!");
            onClose();
        } else {
            toast.error("Đã xảy ra lỗi, vui lòng thử lại!");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Cài Đặt Tài Khoản</DialogTitle>
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
                                <Input name="tenKhachHang" placeholder="Tên khách hàng" value={formData.tenKhachHang} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">Ngày sinh</label>
                                <Input type="date" name="ngaySinh" value={formData.ngaySinh} onChange={handleChange} />
                            </div>

                            <div>
                                <label className="block mb-1 font-medium">Giới tính</label>
                                <div className="flex items-center space-x-6">
                                    <label className="flex items-center space-x-2">
                                        <input type="radio" name="gioiTinh" value="Nam" checked={formData.gioiTinh === "Nam"} onChange={handleChange} />
                                        <span>Nam</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input type="radio" name="gioiTinh" value="Nữ" checked={formData.gioiTinh === "Nữ"} onChange={handleChange} />
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
                                <Input name="soDienThoai" placeholder="Số điện thoại" value={formData.soDienThoai} onChange={handleChange} />
                            </div>

                            <Button onClick={handleSubmit}>{isEditing ? "Cập nhật" : "Lưu thông tin"}</Button>
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
                                <Input
                                    name="userName"
                                    placeholder="Tên đăng nhập"
                                    value={accountForm.userName}
                                    disabled
                                />
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

                            <Button onClick={handleAccountSubmit}>Cập nhật tài khoản</Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}