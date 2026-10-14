import type { WaterLog, ReminderSettings, EventReminder, User } from '../types';

// In production on Vercel, points to Render backend via VITE_API_URL; locally proxies via /api
const envBase = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = envBase ? `${envBase.replace(/\/$/, '')}/api` : '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('watermate_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('watermate_auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('watermate_auth_token');
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth API
export async function registerUser(username: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi đăng ký tài khoản');
  return data;
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Lỗi đăng nhập');
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    clearAuthToken();
    return null;
  }
  const data = await res.json();
  return data.user;
}

export async function syncLocalData(payload: {
  water_logs?: WaterLog[];
  event_reminders?: EventReminder[];
  settings?: Partial<ReminderSettings>;
}): Promise<{ success: boolean; synced_logs: number; synced_events: number }> {
  const res = await fetch(`${API_BASE}/auth/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi đồng bộ dữ liệu');
  }
  return res.json();
}

// Water Logs API
export async function fetchWaterLogs(local_date?: string): Promise<WaterLog[]> {
  const query = local_date ? `?local_date=${encodeURIComponent(local_date)}` : '';
  const res = await fetch(`${API_BASE}/water-logs${query}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải lịch sử uống nước');
  return res.json();
}

export async function createWaterLog(data: Omit<WaterLog, 'id'>): Promise<WaterLog> {
  const res = await fetch(`${API_BASE}/water-logs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi ghi nhận lượng nước');
  }
  return res.json();
}

export async function updateWaterLog(id: string | number, amount_ml: number): Promise<WaterLog> {
  const res = await fetch(`${API_BASE}/water-logs/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ amount_ml }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi cập nhật bản ghi');
  }
  return res.json();
}

export async function deleteWaterLog(id: string | number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/water-logs/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Lỗi khi xóa bản ghi');
  }
  return true;
}

export async function clearWaterLogs(local_date?: string): Promise<boolean> {
  const query = local_date ? `?local_date=${encodeURIComponent(local_date)}` : '';
  const res = await fetch(`${API_BASE}/water-logs/clear-day${query}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return res.ok;
}

// Settings API
export async function fetchReminderSettings(): Promise<ReminderSettings> {
  const res = await fetch(`${API_BASE}/reminder-settings`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải cài đặt nhắc nhở');
  return res.json();
}

export async function updateReminderSettings(settings: Partial<ReminderSettings>): Promise<ReminderSettings> {
  const res = await fetch(`${API_BASE}/reminder-settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Không thể lưu cài đặt nhắc nhở');
  return res.json();
}

// Push API
export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/push/vapid-key`);
  if (!res.ok) throw new Error('Không thể lấy VAPID public key');
  const data = await res.json();
  return data.publicKey;
}

export async function sendPushSubscription(subscription: PushSubscriptionJSON): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ subscription }),
  });
  if (!res.ok) throw new Error('Không thể đăng ký Web Push trên máy chủ');
  return res.json();
}

export async function sendTestNotification(): Promise<{ success: boolean; message?: string; sent?: number; failed?: number; total?: number }> {
  const res = await fetch(`${API_BASE}/push/test`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi thông báo thử nghiệm');
  }
  return res.json();
}

export async function sendTestTrashNotification(): Promise<{ success: boolean; sent?: number; error?: string }> {
  const res = await fetch(`${API_BASE}/push/test-trash`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi gửi test thông báo đổ rác');
  }
  return res.json();
}

// Event Reminders API
export async function fetchEventReminders(): Promise<EventReminder[]> {
  const res = await fetch(`${API_BASE}/event-reminders`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Không thể tải danh sách sự kiện');
  return res.json();
}

export async function createEventReminder(data: {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  remind_days?: string;
}): Promise<EventReminder> {
  const res = await fetch(`${API_BASE}/event-reminders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi tạo sự kiện');
  }
  return res.json();
}

export async function updateEventReminder(id: string, data: Partial<EventReminder>): Promise<EventReminder> {
  const res = await fetch(`${API_BASE}/event-reminders/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi cập nhật sự kiện');
  }
  return res.json();
}

export async function toggleEventReminder(id: string, autoDelete: boolean = false): Promise<{ success: boolean; is_completed: boolean; deleted?: boolean }> {
  const res = await fetch(`${API_BASE}/event-reminders/${id}/toggle?auto_delete=${autoDelete}`, {
    method: 'PATCH',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Lỗi khi đổi trạng thái sự kiện');
  return res.json();
}

export async function deleteEventReminder(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/event-reminders/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Lỗi khi xóa sự kiện');
  return true;
}
