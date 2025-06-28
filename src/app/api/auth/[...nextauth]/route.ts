import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async signIn({ user, account }) {
            console.log("=== SignIn Debug ===");
            console.log("User from Google:", user);

            if (account?.provider === "google") {
                try {
                    // Check if user already exists in roleadminuser
                    const existingUser = await prisma.roleadminuser.findUnique({
                        where: { email: user.email! },
                    });

                    if (!existingUser) {
                        // Generate username from email (remove @domain)
                        let userName = user.email!.split("@")[0];

                        // Check if username already exists
                        const existingUserName = await prisma.roleadminuser.findUnique({
                            where: { userName },
                        });

                        // If username exists, append a timestamp to make it unique
                        if (existingUserName) {
                            const timestamp = Date.now().toString().slice(-4);
                            userName = `${userName}${timestamp}`;
                        }

                        // Create new user in roleadminuser
                        const newUser = await prisma.roleadminuser.create({
                            data: {
                                email: user.email!,
                                userName: userName,
                                passWord: "null", // OAuth users don't need password, set to null
                                role: "KhachHang", // Default role is Customer
                                trangThaiTk: "DangHoatDong", // Account status: Active
                            },
                        });

                        console.log("New user created in roleadminuser:", newUser);
                    } else {
                        console.log("User already exists:", existingUser.email);
                    }
                    const existingKH = await prisma.khachhang.findFirst({
                        where: { maUser: user.email! },
                    });

                    if (!existingKH) {
                        await prisma.khachhang.create({
                            data: {
                                maKhachHang: `KH${Date.now()}`,
                                maUser: user.email!,
                                tenKhachHang: user.name || user.email!.split("@")[0],
                                gioiTinh: "Khác",
                                diaChi: "Chưa cập nhật",
                                soDienThoai: "Chưa cập nhật",
                                ngaySinh: new Date("2000-01-01"),
                                maMembership:"MEM001",
                            },
                        });

                        console.log("Tạo khachhang thành công");
                    }

                    return true;

                } catch (error) {
                    console.error("Error in signIn callback:", error);
                    return false;
                }

            }
            return true;
        },

        async jwt({ token, account, user }) {
            if (account && user) {
                // Store Google info in token
                token.googleId = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;

                try {
                    // Fetch user from database, including passWord
                    const dbUser = await prisma.roleadminuser.findUnique({
                        where: { email: user.email! },
                        select: {
                            userName: true,
                            role: true,
                            trangThaiTk: true,
                            passWord: true, // Include passWord
                        },
                    });

                    if (dbUser) {
                        token.userName = dbUser.userName;
                        token.role = dbUser.role ?? "KhachHang";
                        token.trangThaiTk = dbUser.trangThaiTk ?? "DangHoatDong";
                        token.passWord = dbUser.passWord; // This will be null for OAuth users
                    }
                } catch (error) {
                    console.error("Error fetching user from database:", error);
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user = {
                    id: token.googleId as string,
                    email: token.email as string,
                    name: token.name as string,
                    image: token.picture as string,
                    userName: token.userName as string,
                    role: token.role as string,
                    trangThaiTk: token.trangThaiTk as string,
                    // Can be null for OAuth users
                };
            }

            console.log("Final session:", session);
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };