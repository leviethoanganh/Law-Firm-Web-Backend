import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

// Định nghĩa route GET để kiểm tra trạng thái đăng nhập
// Đường dẫn đầy đủ sẽ là: /auth/check (phụ thuộc vào file index.route.ts)
router.get("/check", authController.check);

router.get("/logout", authController.logout);

export default router;