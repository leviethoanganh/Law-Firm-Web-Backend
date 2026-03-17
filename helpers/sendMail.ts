import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Gửi email thông báo nhiệm vụ dựa trên tài liệu Nodemailer chính thức
 * Đã tối ưu cấu hình SMTP để chạy ổn định trên Cloud (Render)
 */
// helpers/sendMail.ts

export const sendMail = async (email: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587, // CHUYỂN TỪ 465 SANG 587
        secure: false, // PHẢI LÀ FALSE CHO CỔNG 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // Cấu hình bắt buộc khi dùng cổng 587
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        },
        connectionTimeout: 20000, // Tăng thời gian chờ lên 20s
        greetingTimeout: 20000,
        socketTimeout: 20000,
        dnsV6: false // Tiếp tục chặn IPv6
    } as any);

    try {
        // Log để Anh theo dõi trên Render
        console.log("--- Đang kiểm tra kết nối tới cổng 587 ---");
        await transporter.verify();
        console.log("--- Kết nối SMTP thành công! ---");
        
        const mailOptions = {
            from: `"Law Connect System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("--- GỬI MAIL THÀNH CÔNG ---", info.messageId);
    } catch (error) {
        console.error("--- LỖI KẾT NỐI/GỬI MAIL ---", error);
    }
};