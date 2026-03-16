import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes/index.route";
import cookieParser from "cookie-parser";

// 1. Xóa bỏ import connectDB cũ
// import { connectDB } from './configs/database.config'; 

// Load biến môi trường
dotenv.config();

// 2. Xóa bỏ dòng gọi connectDB() vì Supabase Client tự quản lý kết nối khi được gọi
// connectDB();

const app = express();
// Bạn có thể dùng biến môi trường cho port hoặc mặc định 5000
const port = process.env.PORT || 5000;

// 3. Cấu hình CORS
// Đảm bảo origin khớp với URL của dự án React/Next.js của bạn
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true, 
}));

// 4. Middleware
app.use(express.json());
app.use(cookieParser());

// Thêm dòng này trước app.use("/", routes);
app.get("/", (req, res) => {
  res.send("Server Law Connect đang hoạt động!");
});


// 5. Hệ thống định tuyến (Routes)
app.use("/", routes);

// 6. Khởi động server
app.listen(port, () => {
  console.log(`Server Supabase Backend đang chạy trên cổng ${port}`);
});
