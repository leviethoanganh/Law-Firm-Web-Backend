import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import dns from "dns";

dotenv.config();

// 🔥 FIX LỖI IPV6 (QUAN TRỌNG)
dns.setDefaultResultOrder("ipv4first");

export const sendMail = async (
    email: string,
    subject: string,
    html: string
) => {
    const transporter = nodemailer.createTransport({
        service: "gmail", // ✅ dùng service cho gọn
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App password
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
    });

    try {
        console.log("🔄 Đang verify SMTP...");
        await transporter.verify();
        console.log("✅ SMTP OK");

        const info = await transporter.sendMail({
            from: `"Law Connect System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            html,
        });

        console.log("✅ Gửi mail thành công:", info.messageId);
    } catch (error) {
        console.error("❌ Lỗi gửi mail:", error);
        throw error; // để controller catch nếu cần
    }
};