import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

export const sendMail = async (email: string, subject: string, html: string) => {
    // Ép kiểu 'any' cho object cấu hình để vượt qua kiểm tra nghiêm ngặt của TS đối với dnsV6
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        dnsV6: false // Thuộc tính này cực kỳ quan trọng để fix lỗi trên Render
    } as any); // Thêm 'as any' ở đây để hết báo lỗi đỏ

    const mailOptions = {
        from: `"Law Connect System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("--- GỬI MAIL THÀNH CÔNG ---");
        console.log("Response:", info.response);
    } catch (error) {
        console.error("--- LỖI GỬI MAIL CHI TIẾT ---");
        console.error(error);
    }
};