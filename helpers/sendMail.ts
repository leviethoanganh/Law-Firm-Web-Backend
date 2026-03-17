import nodemailer from "nodemailer";

export const sendMail = async (email: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Mã 16 ký tự Anh vừa lấy
        },
    });

    const mailOptions = {
        from: `"Law Connect System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Lỗi gửi mail:", error);
    }
};