export interface ITask {
  id: string;
  title: string;
  description?: string;
  assigner_id: string;
  assignee_id: string;
  due_date?: string;
  status: 'assigned' | 'in-progress' | 'completed' | 'archived';
  is_read_by_assignee: boolean;
  is_read_by_assigner: boolean;
  points: number;
  completed_at?: string;
  created_at: string;
}