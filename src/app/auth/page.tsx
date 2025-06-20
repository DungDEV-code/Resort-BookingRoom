"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { useAuth } from "@/context/auth-context"
export default function AuthPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [emailOrUsername, setEmailOrUsername] = useState("")
    const [password, setPassword] = useState("")
    const { setUser } = useAuth();
    const router = useRouter()
    // State đăng ký
    const [registerEmail, setRegisterEmail] = useState("")
    const [registerUsername, setRegisterUsername] = useState("")
    const [registerPassword, setRegisterPassword] = useState("")
    const [registerConfirm, setRegisterConfirm] = useState("")
    const isValidEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
    const [tabValue, setTabValue] = useState("login");
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword.trim()) {
            toast.error("❌ Vui lòng điền đầy đủ thông tin");
            return;
        }

        if (!isValidEmail(registerEmail)) {
            toast.error("❌ Email không đúng định dạng");
            return;
        }

        if (registerPassword.length < 4) {
            toast.error("❌ Mật khẩu phải dài tối thiểu 6 ký tự");
            return;
        }

        if (registerPassword !== registerConfirm) {
            toast.error("❌ Mật khẩu xác nhận không khớp");
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: registerEmail.trim(),
                    userName: registerUsername.trim(),
                    password: registerPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Lỗi đăng ký");

            toast.success("✅ " + data.message);
            setTabValue("login");
            // Reset form sau khi đăng ký thành công
            setRegisterUsername("");
            setRegisterEmail("");
            setRegisterPassword("");
            setRegisterConfirm("");
        } catch (err: any) {
            toast.error("❌ " + err.message);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ emailOrUsername, password }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.message || "Lỗi đăng nhập")

            toast.success("✅ " + data.message)
            setUser(data.user);
            router.push("/")
        } catch (err: any) {
            toast.error("❌ " + err.message)
        }
    }


    return (
        <div
            className="min-h-screen w-full bg-cover bg-center bg-no-repeat relative flex items-center justify-center px-4"
            style={{ backgroundImage: "url('/img/login.jpg')" }}
        >
            <div className="absolute inset-0 bg-sky-900/60 backdrop-brightness-90 z-0" />

            <div className="relative z-10 w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-8">
                <div className="absolute top-6 left-6 z-20">
                    <Link href="/" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                </div>
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white overflow-hidden shadow">
                            <Image
                                src="/img/logo1.jpg"
                                alt="Paradise Resort Logo"
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Chào Mừng Trở Lại</CardTitle>
                        <CardDescription>Đăng nhập để trải nghiệm dịch vụ tốt nhất</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Đăng Nhập</TabsTrigger>
                                <TabsTrigger value="register">Đăng Ký</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login" className="space-y-4">
                                <form className="space-y-4" onSubmit={handleLogin}>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email hoặc Tên Đăng Nhập</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="login-email"
                                                type="text"
                                                placeholder="email hoặc username"
                                                className="pl-10"
                                                value={emailOrUsername}
                                                onChange={(e) => setEmailOrUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="login-password">Mật Khẩu</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="login-password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 pr-10"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="remember" className="rounded border-gray-300 text-sky-600" />
                                            <Label htmlFor="remember">Ghi nhớ đăng nhập</Label>
                                        </div>
                                        <Link href="#" className="text-sky-600 hover:underline">Quên mật khẩu?</Link>
                                    </div>
                                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">Đăng Nhập</Button>
                                </form>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="w-full" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">Hoặc</span>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" type="button">
                                    <span className="mr-2">G</span> Đăng Nhập Với Google
                                </Button>
                            </TabsContent>
                            <TabsContent value="register" className="space-y-4">
                                <form className="space-y-4" onSubmit={handleRegister}>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-username">Tên Đăng Nhập</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="register-username"
                                                type="text"
                                                placeholder="username"
                                                className="pl-10"
                                                value={registerUsername}
                                                onChange={(e) => setRegisterUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="register-email"
                                                type="email"
                                                placeholder="your@email.com"
                                                className="pl-10"
                                                value={registerEmail}
                                                onChange={(e) => setRegisterEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Mật Khẩu</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="register-password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 pr-10"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Xác Nhận Mật Khẩu</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="confirm-password"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="pl-10 pr-10"
                                                value={registerConfirm}
                                                onChange={(e) => setRegisterConfirm(e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                            required
                                        />
                                        <Label htmlFor="terms" className="text-sm">
                                            Tôi đồng ý với{" "}
                                            <Link href="#" className="text-sky-600 hover:text-sky-700">
                                                Điều khoản dịch vụ
                                            </Link>{" "}
                                            và{" "}
                                            <Link href="#" className="text-sky-600 hover:text-sky-700">
                                                Chính sách bảo mật
                                            </Link>
                                        </Label>
                                    </div>
                                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">
                                        Tạo Tài Khoản
                                    </Button>
                                </form>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="w-full" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">Hoặc</span>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" type="button">
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Đăng Ký Với Google
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Bằng cách đăng nhập, bạn đồng ý với{" "}
                    <Link href="#" className="text-sky-600 hover:underline">Điều khoản sử dụng</Link> của chúng tôi
                </div>
            </div>
        </div>
    )
}
