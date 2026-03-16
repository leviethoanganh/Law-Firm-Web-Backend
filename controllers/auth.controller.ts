import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../configs/supabase.config"; 

export const check = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({
        code: "error",
        message: "Token không hợp lệ!",
      });
    }

    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    const { id, email } = decoded;

    const { data: existAccountUser, error } = await supabase
      .from("account_users")
      .select("id, full_name, email, points")
      .eq("id", id)
      .eq("email", email)
      .single();

    if (existAccountUser && !error) {
      // CHỈNH SỬA TẠI ĐÂY: Trả về field "data" để khớp với useAuth.ts
      const infoUser = {
        id: existAccountUser.id,
        fullName: existAccountUser.full_name, 
        email: existAccountUser.email,
        points: existAccountUser.points
      };
      console.log("Thông tin người dùng:", infoUser); // Debug log để kiểm tra thông tin người dùng

      return res.json({
        code: "success",
        message: "Token hợp lệ!",
        data: infoUser, // Đổi từ infoUser: infoUser thành data: infoUser
      });
    }
    
    res.clearCookie("token");
    return res.json({
      code: "error",
      message: "Tài khoản không tồn tại!"
    });

  } catch (error) {
    res.clearCookie("token");
    res.json({
      code: "error",
      message: "Token hết hạn hoặc không hợp lệ!",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({
    code: "success",
    message: "Đã đăng xuất!",
  });
};