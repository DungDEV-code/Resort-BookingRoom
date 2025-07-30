// hooks/useAdminUser.ts
"use client"

import { useEffect, useState } from "react"

export interface User {
    email: string
    role: "Admin" | "NhanVien"
    chucVu?: "Admin" | "LeTan" | "DonDep" | "SuaChua"
}

export function useAdminUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/admin/api/me")
                if (!res.ok) {
                    setUser(null)
                    return
                }
                const data = await res.json()
                console.log("user từ API /admin/api/me:", data)
                setUser(data)
            } catch (err) {
                console.error("Lỗi lấy user:", err)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        
        fetchUser()
    }, [])

    return { user, loading }
}
