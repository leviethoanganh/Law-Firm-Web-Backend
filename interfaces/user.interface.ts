export interface IUser {
  id: string;
  full_name: string;
  email: string;
  password?: string; // Thường chỉ dùng ở backend khi login/register
  avatar?: string;
  phone?: string;
  points: number;
  created_at: string;
}