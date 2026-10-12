export interface WaterLog {
  id: string | number;
  amount_ml: number;
  sip_equivalent: number;
  source: 'sip' | 'half_cup' | 'full_cup' | 'custom';
  created_at: string; // ISO string
  local_date: string; // YYYY-MM-DD
}

export interface ReminderSettings {
  id?: number;
  enabled: boolean;
  start_time: string; // HH:mm, e.g. "08:00"
  end_time: string;   // HH:mm, e.g. "22:00"
  interval_minutes: number; // 15, 30, 45, 60, 90, 120, etc.
  timezone: string;   // e.g. "Asia/Ho_Chi_Minh"
  notification_message: string;
  paused_until?: string | null; // ISO string or null
  quiet_hours_enabled?: boolean;
  quiet_start_time?: string; // HH:mm, e.g. "12:00"
  quiet_end_time?: string;   // HH:mm, e.g. "13:30"
}

export interface UserPreferences {
  daily_goal_ml: number;
  sip_ml: number; // default 50
  cup_ml: number; // default 450
  user_name: string;
}

export interface DaySummary {
  local_date: string;
  total_ml: number;
  total_sips: number;
  log_count: number;
  percentage: number;
}
