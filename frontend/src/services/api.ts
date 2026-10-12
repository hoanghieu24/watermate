import type { WaterLog, ReminderSettings } from '../types';

// In production on Vercel, points to Render backend via VITE_API_URL; locally proxies via /api
const envBase = (import.meta.env.VITE_API_URL as string) || '';
const API_BASE = envBase ? `${envBase.replace(/\/$/, '')}/api` : '/api';

export async function fetchWaterLogs(local_date?: string): Promise<WaterLog[]> {
  const query = local_date ? `?local_date=${encodeURIComponent(local_date)}` : '';
  const res = await fetch(`${API_BASE}/water-logs${query}`);
  if (!res.ok) throw new Error('Không thể tải lịch sử uống nước');
  return res.json();
}

export async function createWaterLog(data: Omit<WaterLog, 'id'>): Promise<WaterLog> {
  const res = await fetch(`${API_BASE}/water-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
  });
  return res.ok;
}

export async function fetchReminderSettings(): Promise<ReminderSettings> {
  const res = await fetch(`${API_BASE}/reminder-settings`);
  if (!res.ok) throw new Error('Không thể tải cài đặt nhắc nhở');
  return res.json();
}

export async function updateReminderSettings(settings: Partial<ReminderSettings>): Promise<ReminderSettings> {
  const res = await fetch(`${API_BASE}/reminder-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Không thể lưu cài đặt nhắc nhở');
  return res.json();
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/push/vapid-key`);
  if (!res.ok) throw new Error('Không thể lấy VAPID public key');
  const data = await res.json();
  return data.publicKey;
}

export async function sendPushSubscription(subscription: PushSubscriptionJSON): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });
  if (!res.ok) throw new Error('Không thể đăng ký Web Push trên máy chủ');
  return res.json();
}

export async function sendTestNotification(): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${API_BASE}/push/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gửi thông báo thử nghiệm');
  }
  return res.json();
}

