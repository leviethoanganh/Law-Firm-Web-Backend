import { Request, Response } from "express";
import { supabase } from "../configs/supabase.config";
import { AccountRequest } from "../interfaces/request.interface";
import { sendMail } from "../helpers/sendMail";

// 1. Tạo Task mới
// task.controller.ts
// task.controller.ts

export const createTask = async (req: AccountRequest, res: Response) => {
    try {
        const { title, description, assigneeEmail, dueDate } = req.body;

        // BƯỚC 1: Tìm ID người nhận
        const { data: assigneeUser, error: userError } = await supabase
            .from("account_users")
            .select("id")
            .eq("email", assigneeEmail)
            .single();

        if (userError || !assigneeUser) {
            return res.json({ code: "error", message: "Không tìm thấy người dùng nhận nhiệm vụ!" });
        }

        // BƯỚC 2: Tạo Task
        const { data: newTask, error: taskError } = await supabase
            .from("tasks")
            .insert([{
                title,
                description,
                assigner_id: req.account.id, 
                assignee_id: assigneeUser.id,
                due_date: dueDate,
                status: "assigned",
            }])
            .select()
            .single();

        if (taskError) throw taskError;

        // BƯỚC 3: Gửi Mail (Bọc try-catch để không làm hỏng phản hồi API)
        const subject = `[Law Connect] Nhiệm vụ mới: ${title}`;
        const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : "Không có hạn chót";
        
        const htmlContent = `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                <h2 style="color: #4f46e5;">Xin chào,</h2>
                <p>Bạn vừa được giao một nhiệm vụ mới trên hệ thống <b>Law Connect</b>.</p>
                <hr style="border: 0; border-top: 1px solid #eee;"/>
                <p><b>Công việc:</b> ${title}</p>
                <p><b>Mô tả:</b> ${description || "Không có mô tả"}</p>
                <p><b>Hạn chót:</b> ${formattedDate}</p>
                <p>Vui lòng đăng nhập để xem chi tiết và thực hiện.</p>
            </div>
        `;

        // Gọi gửi mail và bắt lỗi riêng
        sendMail(assigneeEmail, subject, htmlContent).catch(err => {
            console.error("--- LỖI GỬI MAIL TRONG CONTROLLER ---", err);
        });

        res.json({
            code: "success",
            message: "Tạo việc thành công! Email thông báo đang được gửi đi.",
            data: newTask
        });

    } catch (error) {
        console.error("Lỗi Create Task:", error);
        res.json({ code: "error", message: "Đã có lỗi xảy ra, vui lòng kiểm tra lại!" });
    }
};


// 2. Đánh dấu người nhận đã xem
export const markAsReadByAssignee = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase
        .from("tasks")
        .update({ is_read_by_assignee: true })
        .eq("id", id);
    
    res.json({ code: error ? "error" : "success" });
};

// 3. Đánh dấu người giao đã xem
export const markAsReadByAssigner = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase
        .from("tasks")
        .update({ is_read_by_assigner: true })
        .eq("id", id);
    
    res.json({ code: error ? "error" : "success" });
};

// 4. Lấy danh sách việc đã giao (My Created Cases)
export const getMyCreatedCases = async (req: AccountRequest, res: Response) => {
    try {
        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                assigner:account_users!assigner_id(full_name),
                assignee:account_users!assignee_id(full_name)
            `) // Thay đổi ở đây
            .eq("assigner_id", req.account.id)
            .neq("status", "archived")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ code: "success", data: tasks });
    } catch (error) {
        res.json({ code: "error", message: "Không thể lấy dữ liệu" });
    }
};

// 5. Lấy danh sách việc được giao (My Tasks)
export const getMyTasks = async (req: AccountRequest, res: Response) => {
    try {
        const { data: tasks, error } = await supabase
            .from("tasks")
            .select(`
                *,
                assigner:account_users!assigner_id(full_name),
                assignee:account_users!assignee_id(full_name)
            `) // Thay đổi ở đây
            .eq("assignee_id", req.account.id)
            .neq("status", "archived")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json({ code: "success", data: tasks });
    } catch (error) {
        res.json({ code: "error", message: "Lỗi Server" });
    }
};

// 6. Hoàn thành Task (Đổi tên thành markAsCompleted để khớp với Route của Anh)
export const markAsCompleted = async (req: AccountRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        const { data: task, error: taskError } = await supabase
            .from("tasks")
            .update({ 
                status: "completed", 
                completed_at: new Date().toISOString(),
                is_read_by_assigner: false 
            })
            .match({ id, assignee_id: req.account.id })
            .select()
            .single();

        if (taskError || !task) throw taskError;

        await supabase.rpc('increment_points', { 
            row_id: req.account.id, 
            amount: 30 
        });

        res.json({ 
            code: "success", 
            message: "Chúc mừng! Bạn đã hoàn thành nhiệm vụ và nhận được 30 điểm thưởng. 🎉" 
        });
    } catch (error) {
        console.error(error);
        res.json({ code: "error", message: "Lỗi cập nhật trạng thái!" });
    }
};

// 7. Đánh dấu đã xem tổng quát
export const markTaskAsSeen = async (req: AccountRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        const { data: task, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !task) return res.json({ code: "error", message: "Không tìm thấy task" });

        const updateData: any = {};
        if (task.assignee_id === req.account.id) {
            updateData.is_read_by_assignee = true;
        } else if (task.assigner_id === req.account.id) {
            updateData.is_read_by_assigner = true;
        }

        const { error: updateError } = await supabase
            .from("tasks")
            .update(updateData)
            .eq("id", id);

        if (updateError) throw updateError;
        res.json({ code: "success", message: "Đã đánh dấu đã xem" });
    } catch (error) {
        res.json({ code: "error", message: "Lỗi server" });
    }
};

