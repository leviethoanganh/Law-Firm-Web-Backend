import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Dùng Service Role Key ở Backend để có quyền admin

export const supabase = createClient(supabaseUrl, supabaseKey);