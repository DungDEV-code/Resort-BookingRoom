import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Types for better type safety
interface DecodedToken {
  email: string;
  userName: string;
  role: string;
}

interface CommentRequestBody {
  maDatPhong: string;
  noiDung: string;
  danhGia: number;
}

interface AuthResult {
  success: boolean;
  message?: string;
  status?: number;
  maKhachHang?: string;
}

// POST - Tạo comment mới
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(req);
    if (!user.success) {
      return NextResponse.json(
        { message: user.message }, 
        { status: user.status! }
      );
    }

    // Parse and validate request body
    const body: CommentRequestBody = await req.json();
    const validationResult = validateCommentData(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.message },
        { status: 400 }
      );
    }

    const { maDatPhong, noiDung, danhGia } = body;

    // Verify booking ownership and status
    const bookingResult = await verifyBookingForComment(maDatPhong, user.maKhachHang!);
    if (!bookingResult.success) {
      return NextResponse.json(
        { message: bookingResult.message },
        { status: bookingResult.status! }
      );
    }

    // Note: Cho phép người dùng bình luận nhiều lần cho cùng một đặt phòng
    // Đã bỏ kiểm tra comment đã tồn tại

    // Create new comment (người dùng có thể bình luận nhiều lần)
    const commentCount = await getCommentCountForBooking(maDatPhong);
    const newComment = await createComment(maDatPhong, noiDung, danhGia, commentCount + 1);

    return NextResponse.json({
      success: true,
      message: 'Bình luận đã được gửi thành công và đang chờ phê duyệt',
      data: {
        maBinhLuan: newComment.maBinhLuan,
        danhGia: newComment.danhGia,
        thoiGianBL: newComment.thoiGianBL.toISOString(),
        trangThai: newComment.trangThai,
        totalComments: commentCount + 1 // Tổng số bình luận cho đặt phòng này
      }
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error in POST /api/comments:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { message: "Token không hợp lệ" }, 
        { status: 401 }
      );
    }
    
    // Handle Prisma specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string };
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { message: 'Bình luận đã tồn tại' },
          { status: 409 }
        );
      }
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { message: 'Không tìm thấy đặt phòng' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { message: 'Lỗi server nội bộ - Không thể tạo bình luận' },
      { status: 500 }
    );
  }
}

/**
 * Authenticate user from JWT token
 */
async function authenticateUser(req: NextRequest): Promise<AuthResult> {
  const token = req.cookies.get("auth_token")?.value;
  
  if (!token) {
    return {
      success: false,
      message: "Không được phép truy cập - Vui lòng đăng nhập",
      status: 401
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    
    const user = await prisma.roleadminuser.findUnique({
      where: { email: decoded.email },
      include: {
        khachhang: {
          select: {
            maKhachHang: true
          }
        }
      }
    });

    if (!user?.khachhang?.[0]?.maKhachHang) {
      return {
        success: false,
        message: "Không tìm thấy thông tin khách hàng",
        status: 404
      };
    }

    return {
      success: true,
      maKhachHang: user.khachhang[0].maKhachHang
    };

  } catch (error: unknown) {
    return {
      success: false,
      message: "Token không hợp lệ",
      status: 401
    };
  }
}

/**
 * Validate comment request data
 */
function validateCommentData(body: any): { success: boolean; message?: string } {
  const { maDatPhong, noiDung, danhGia } = body;

  if (!maDatPhong || !noiDung || danhGia === undefined) {
    return {
      success: false,
      message: 'Thiếu thông tin bắt buộc (maDatPhong, noiDung, danhGia)'
    };
  }

  if (danhGia < 1 || danhGia > 5) {
    return {
      success: false,
      message: 'Đánh giá phải từ 1 đến 5 sao'
    };
  }

  if (typeof noiDung !== 'string' || noiDung.trim().length < 10) {
    return {
      success: false,
      message: 'Nội dung bình luận phải có ít nhất 10 ký tự'
    };
  }

  return { success: true };
}

/**
 * Verify booking ownership and status for commenting
 */
async function verifyBookingForComment(maDatPhong: string, maKhachHang: string): Promise<AuthResult> {
  const booking = await prisma.datphong.findFirst({
    where: {
      maDatPhong: maDatPhong,
      maKhachHang: maKhachHang,
      trangThai: 'Check_out' // Chỉ cho phép comment khi đã check out
    },
    include: {
      phong: {
        select: {
          maPhong: true,
          tenPhong: true
        }
      }
    }
  });

  if (!booking) {
    return {
      success: false,
      message: 'Không tìm thấy đặt phòng hoặc chưa check out',
      status: 404
    };
  }

  return { success: true };
}

/**
 * Get comment count for booking (for reference/logging)
 */
async function getCommentCountForBooking(maDatPhong: string): Promise<number> {
  const commentCount = await prisma.binhluan.count({
    where: {
      maDatPhong: maDatPhong
    }
  });

  return commentCount;
}

/**
 * Create new comment
 */
async function createComment(maDatPhong: string, noiDung: string, danhGia: number, commentNumber: number) {
  // Generate unique ID cho bình luận với số thứ tự
  const timestamp = Date.now();
  const maBinhLuan = `BL${timestamp}_${commentNumber}`;

  return await prisma.binhluan.create({
    data: {
      maBinhLuan: maBinhLuan,
      maDatPhong: maDatPhong,
      noiDung: noiDung.trim(),
      danhGia: parseInt(danhGia.toString()),
      thoiGianBL: new Date(),
      trangThai: 'ChoPheDuyet' // Mặc định chờ phê duyệt
    }
  });
}