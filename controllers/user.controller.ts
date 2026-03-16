import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "../configs/supabase.config"; // Import config Supabase đã tạo
import { AccountRequest } from "../interfaces/request.interface";

export const registerPost = async (req: AccountRequest, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Kiểm tra Email tồn tại (Thay thế AccountUser.findOne)
    const { data: existAccount, error: fetchError } = await supabase
      .from("account_users")
      .select("email")
      .eq("email", email)
      .maybeSingle(); // maybeSingle trả về null nếu không tìm thấy, không gây ra lỗi

    if (existAccount) {
      return res.json({
        code: "error",
        message: "Email đã tồn tại trong hệ thống!",
      });
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Tạo bản ghi mới (Thay thế new AccountUser(...).save())
    const { error: insertError } = await supabase
      .from("account_users")
      .insert([
        {
          full_name: fullName,
          email: email,
          password: passwordHash,
          points: 0
        }
      ]);

    if (insertError) throw insertError;

    res.json({
      code: "success",
      message: "Đăng ký tài khoản thành công!",
    });
  } catch (error) {
    console.error("Lỗi register:", error);
    res.json({
      code: "error",
      message: "Đã có lỗi xảy ra, vui lòng thử lại sau!",
    });
  }
};

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra sự tồn tại của tài khoản (Thay thế AccountUser.findOne)
    const { data: existAccount, error: fetchError } = await supabase
      .from("account_users")
      .select("*")
      .eq("email", email)
      .single(); // Trả về 1 đối tượng duy nhất

    if (fetchError || !existAccount) {
      return res.json({
        code: "error",
        message: "Email không tồn tại trong hệ thống!",
      });
    }

    // 2. So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, existAccount.password);
    
    if (!isPasswordValid) {
      return res.json({
        code: "error",
        message: "Mật khẩu không đúng!",
      });
    }

    // 3. Tạo JWT token (Lưu ý: MongoDB dùng _id, Supabase dùng id)
    const token = jwt.sign(
      {
        id: existAccount.id, // Đổi từ _id thành id
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "1d",
      }
    );

    // 4. Lưu token vào Cookie

    res.cookie("token", token, {
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true, // Bảo mật, chống XSS
      secure: true,   // BẮT BUỘC: Vì Vercel và Render dùng HTTPS
      sameSite: "none", // BẮT BUỘC: Để gửi cookie giữa 2 domain khác nhau
    });

    res.json({
      code: "success",
      message: "Đăng nhập thành công!",
    });
  } catch (error) {
    console.error("Lỗi login:", error);
    res.json({
      code: "error",
      message: "Đã có lỗi xảy ra, vui lòng thử lại sau!",
    });
  }
};

// back-end/controllers/user.controller.ts
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    path: "/",
    httpOnly: true,
    // Cấu hình này PHẢI khớp 100% với lúc loginPost tạo cookie
    sameSite: "none", 
    secure: true, 
  });

  res.json({
    code: "success",
    message: "Đã đăng xuất thành công!",
  });
};

export const getAllMembers = async (req: Request, res: Response) => {
    try {
        const { data: members, error } = await supabase
            .from("account_users")
            .select("full_name, email");

        if (error) throw error;
        res.json({ code: "success", data: members });
    } catch (error) {
        res.json({ code: "error", message: "Không thể lấy danh sách thành viên" });
    }
};

