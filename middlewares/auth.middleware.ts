import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../configs/supabase.config"; // Sử dụng config Supabase mới
import { AccountRequest } from "../interfaces/request.interface";

export const verifyTokenUser = async (req: AccountRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Lấy token từ Cookie
    const token = req.cookies.token;
    if (!token) {
      console.log("--- [Middleware] Không tìm thấy Token ---");
      return res.json({ code: "error", message: "Vui lòng đăng nhập!" });
    }

    // 2. Giải mã token
    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as jwt.JwtPayload;
    
    // 3. Truy vấn Supabase thay cho Mongoose (Dùng id kiểu UUID)
    const { data: existAccount, error } = await supabase
      .from("account_users")
      .select("id, full_name, email, points")
      .eq("id", decoded.id) // Supabase dùng id (UUID)
      .single();

    // 4. Kiểm tra tài khoản
    if (error || !existAccount) {
      console.log(`--- [Middleware] XÓA COOKIE: ID ${decoded.id} không tồn tại trong Supabase ---`);
      res.clearCookie("token", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return res.json({ code: "error", message: "Tài khoản không tồn tại!" });
    }

    // 5. Gán thông tin vào request để các Controller sau sử dụng
    // Lưu ý: Chuyển đổi tên trường về camelCase để khớp với logic cũ ở Frontend nếu cần
    req.account = {
      ...existAccount,
      fullName: existAccount.full_name // Map lại tên từ database SQL
    };

    console.log("--- [Middleware] Xác thực thành công cho:", existAccount.full_name);
    next();
  } catch (error: any) {
    console.log("--- [Middleware] XÓA COOKIE: Token lỗi ---", error.message);
    res.clearCookie("token", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.json({ code: "error", message: "Token không hợp lệ!" });
  }
};