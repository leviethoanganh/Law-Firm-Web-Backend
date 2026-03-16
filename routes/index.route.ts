import { Router } from "express";
import userRoutes from "./user.route";
import  authRoutes  from  "./auth.route" ;
import  taskRoutes  from  "./task.route" ;

const router = Router();

// Định nghĩa tiền tố /user cho tất cả các tuyến đường liên quan đến người dùng
router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/task", taskRoutes);

export default router;