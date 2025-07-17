"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Shield } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const apiUrl = `${BASE_URL}/admin/api/login`
            console.log("Sending request to:", apiUrl)
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const contentType = res.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text()
                console.error("Received non-JSON response:", text)
                setError("Lỗi server: Phản hồi không phải JSON")
                return
            }

            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Đăng nhập thất bại")
                return
            }

            // Assuming the API returns user data like { email, name, token, ... }
            const userData = {
                email: data.email || email, // Fallback to input email if API doesn't return it
                name: data.name || "Admin User", // Fallback name if not provided
            }

            // Store user data in localStorage
            if (rememberMe) {
                localStorage.setItem("user", JSON.stringify(userData))
            } else {
                sessionStorage.setItem("user", JSON.stringify(userData)) // Use sessionStorage for non-persistent storage
            }

            toast.success("Đăng nhập thành công!")
            window.location.href = "/admin/dashboard"
        } catch (err) {
            console.error("Fetch error:", err)
            setError("Đã có lỗi xảy ra")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    return (
        // ... (rest of the component remains unchanged)
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                    <CardHeader className="space-y-4 pb-6">
                        <div className="flex items-center justify-center">
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <CardTitle className="text-2xl font-bold text-gray-900">Đăng nhập Admin</CardTitle>
                            <CardDescription className="text-gray-600 mt-2">
                                Vui lòng đăng nhập để truy cập bảng điều khiển quản trị
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Mật khẩu
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-11 pr-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                    />
                                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                                        Ghi nhớ đăng nhập
                                    </Label>
                                </div>
                                <button type="button" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                                    Quên mật khẩu?
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang đăng nhập...</span>
                                    </div>
                                ) : (
                                    "Đăng nhập"
                                )}
                            </Button>
                        </form>

                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">Chỉ dành cho quản trị viên được ủy quyền</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center">
                    <p className="text-sm text-white/70">Demo: admin@example.com / admin123</p>
                </div>
            </div>
        </div>
    )
}