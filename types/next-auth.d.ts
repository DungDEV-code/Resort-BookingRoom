// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image: string
      userName: string
      role: string
      trangThaiTk: string
      maKhachHang?: string
      tenKhachHang?: string
      maMembership?: string
      maNhanVien?: string
      tenNhanVien?: string
      viTri?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleId: string
    userName: string
    role: string
    trangThaiTk: string
    maKhachHang?: string
    tenKhachHang?: string
    maMembership?: string
    maNhanVien?: string
    tenNhanVien?: string
    viTri?: string
  }
}