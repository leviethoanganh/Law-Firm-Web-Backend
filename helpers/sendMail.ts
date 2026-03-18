import { Resend } from 'resend';
import * as dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async (email: string, subject: string, html: string) => {
    try {
        console.log("--- [Resend] Đang gửi mail tới:", email);

        const { data, error } = await resend.emails.send({
            // THAY ĐỔI DÒNG NÀY: Dùng tên miền hoanganhorg.org của Anh
            // Anh có thể đặt tên bất kỳ trước dấu @ (ví dụ: thongbao, nhiemvu, admin...)
            from: 'Law Connect <thongbao@hoanganhorg.org>', 
            to: email, // Bây giờ có thể gửi cho bất cứ ai, không lo lỗi 403
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("--- [Resend] Lỗi API từ hệ thống ---", error);
            return;
        }

        console.log("--- [Resend] GỬI MAIL THÀNH CÔNG ---");
        console.log("ID tin nhắn:", data?.id);

    } catch (error) {
        console.error("--- [Resend] Lỗi thực thi hàm ---", error);
    }
};