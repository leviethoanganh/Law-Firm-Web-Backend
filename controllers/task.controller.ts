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
        console.log("--- Chuẩn bị gửi mail cho:", assigneeEmail);
        console.log("--- Nội dung mail:", htmlContent);
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
        
        // 1. Cập nhật trạng thái và lấy thông tin người giao + người nhận
        const { data: task, error: taskError } = await supabase
            .from("tasks")
            .update({ 
                status: "completed", 
                completed_at: new Date().toISOString(),
                is_read_by_assigner: false 
            })
            .match({ id, assignee_id: req.account.id })
            // Lấy thêm email người giao (Assigner) và tên người hoàn thành (Assignee)
            .select(`
                *,
                assigner:account_users!assigner_id(email, full_name),
                assignee:account_users!assignee_id(full_name)
            `)
            .single();

        if (taskError || !task) {
            console.error("Lỗi cập nhật hoặc không có quyền:", taskError);
            throw taskError;
        }

        // 2. Cộng điểm thưởng cho người hoàn thành
        await supabase.rpc('increment_points', { 
            row_id: req.account.id, 
            amount: 30 
        });

        // 3. Gửi mail thông báo cho người giao (Assigner)
        const assignerEmail = task.assigner?.email;
        const assigneeName = task.assignee?.full_name || "Cộng sự";
        
        if (assignerEmail) {
            const subject = `[Law Connect] ✅ Nhiệm vụ đã hoàn thành: ${task.title}`;
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
                    <h2 style="color: #10b981; margin-top: 0;">Thông báo hoàn thành!</h2>
                    <p>Nhiệm vụ bạn giao đã được <b>${assigneeName}</b> đánh dấu hoàn thành.</p>
                    
                    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
                        <p style="margin: 4px 0;"><strong>📌 Tên nhiệm vụ:</strong> ${task.title}</p>
                        <p style="margin: 4px 0;"><strong>⏰ Hoàn thành lúc:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                    </div>

                    <p style="font-size: 14px;">Vui lòng đăng nhập hệ thống để kiểm tra lại kết quả công việc.</p>
                    
                    <div style="text-align: center; margin-top: 24px;">
                        <a href="https://law-firm-web-frontend.vercel.app" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Kiểm tra ngay</a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #9ca3af; text-align: center;">Email gửi từ hệ thống Law Connect của hoanganhorg.org</p>
                </div>
            `;

            console.log("--- [Resend] Thông báo hoàn thành gửi tới:", assignerEmail);
            
            // Gửi mail ngầm
            sendMail(assignerEmail, subject, htmlContent).catch(err => {
                console.error("Lỗi gửi mail thông báo Assigner:", err);
            });
        }

        res.json({ 
            code: "success", 
            message: "Chúc mừng! Bạn đã hoàn thành nhiệm vụ và nhận được 30 điểm thưởng. 🎉" 
        });

    } catch (error) {
        console.error("Lỗi markAsCompleted:", error);
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

