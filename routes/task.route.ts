import { Router } from "express";
import * as taskController from "../controllers/task.controller";

const router = Router();

// routes/task.route.ts
import { verifyTokenUser } from "../middlewares/auth.middleware"; // Giả sử tên file của bạn

// Thêm requireAuth vào giữa
router.post("/create", verifyTokenUser, taskController.createTask);

router.get("/my-created-cases", verifyTokenUser, taskController.getMyCreatedCases);

router.get("/my-tasks", verifyTokenUser, taskController.getMyTasks);

router.patch("/complete/:id", verifyTokenUser, taskController.markAsCompleted);

router.patch("/mark-seen/:id", verifyTokenUser, taskController.markTaskAsSeen);

export default router;