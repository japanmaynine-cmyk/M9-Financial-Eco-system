
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmrizuukclgiwxlqiign.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcml6dXVrY2xnaXd4bHFpaWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNDg4MzIsImV4cCI6MjA4NTgyNDgzMn0.mV3TcHsIhw5OOiKBd3M7_q07KUiwW8S352jyNseFRX0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
