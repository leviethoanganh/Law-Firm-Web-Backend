import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Gửi email thông báo nhiệm vụ dựa trên tài liệu Nodemailer chính thức
 * Đã tối ưu cấu hình SMTP để chạy ổn định trên Cloud (Render)
 */
export const sendMail = async (email: string, subject: string, html: string) => {
    
    // 1. Khởi tạo transporter (Tham khảo từ image_11b219.png và image_11b199.png)
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true cho port 465, false cho port 587
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Cấu hình socket để ép sử dụng IPv4 (Xử lý lỗi ENETUNREACH trên Render)
        // Lưu ý: Dùng kiểu 'any' để tránh lỗi kiểm tra thuộc tính dnsV6 của TypeScript
        dnsV6: false 
    } as any);

    // 2. Kiểm tra kết nối trước khi gửi (Tham khảo image_11b1d9.png)
    try {
        await transporter.verify();
        console.log("--- Hệ thống đã sẵn sàng gửi mail ---");
    } catch (error) {
        console.error("--- Lỗi kết nối SMTP ---", error);
        return; // Dừng nếu không kết nối được
    }

    // 3. Định nghĩa nội dung tin nhắn (Tham khảo image_11b1be.png)
    const mailOptions = {
        from: `"Law Connect System" <${process.env.EMAIL_USER}>`, // Địa chỉ người gửi
        to: email, // Danh sách người nhận
        subject: subject, // Tiêu đề
        html: html, // Nội dung HTML
    };

    // 4. Thực hiện gửi mail (Tham khảo image_11b1be.png)
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("--- GỬI MAIL THÀNH CÔNG ---");
        console.log("Message sent: %s", info.messageId);
        console.log("Response: %s", info.response);
    } catch (err) {
        console.error("--- Lỗi trong quá trình gửi mail ---", err);
    }
};