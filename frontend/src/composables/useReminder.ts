import { ref, computed, watch } from 'vue';
import type { ReminderSettings } from '../types';

const STORAGE_KEY = 'watermate_reminder_settings';

const defaultSettings: ReminderSettings = {
  enabled: true,
  start_time: '08:00',
  end_time: '22:00',
  interval_minutes: 60,
  timezone: 'Asia/Ho_Chi_Minh',
  notification_message: '💧 Hiếu ơi, đến giờ uống nước rồi! Uống một ngụm nhé.',
  paused_until: null,
  quiet_hours_enabled: false,
  quiet_start_time: '12:00',
  quiet_end_time: '13:30',
};

const settings = ref<ReminderSettings>({ ...defaultSettings });
const isLoaded = ref<boolean>(false);
const isPushSubscribed = ref<boolean>(false);
const pushPermission = ref<NotificationPermission>('default');
const isSubscribing = ref<boolean>(false);
const statusMessage = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      settings.value = { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to load reminder settings:', err);
  } finally {
    isLoaded.value = true;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
  } catch (err) {
    console.error('Failed to save reminder settings:', err);
  }
}

export function isQuietTimeNow(now: Date, quietStart: string, quietEnd: string): boolean {
  const currentTotal = now.getHours() * 60 + now.getMinutes();
  const [sH, sM] = quietStart.split(':').map(Number);
  const startTotal = sH * 60 + sM;
  const [eH, eM] = quietEnd.split(':').map(Number);
  const endTotal = eH * 60 + eM;

  if (startTotal < endTotal) {
    return currentTotal >= startTotal && currentTotal < endTotal;
  } else if (startTotal > endTotal) {
    return currentTotal >= startTotal || currentTotal < endTotal;
  }
  return false;
}

export function useReminder() {
  if (!isLoaded.value) {
    loadSettings();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      pushPermission.value = Notification.permission;
    }
  }

  watch(settings, () => {
    saveSettings();
  }, { deep: true });

  // Calculate Next Reminder Time
  const nextReminderText = computed(() => {
    if (!settings.value.enabled) {
      return 'Đang tắt nhắc nhở';
    }

    const now = new Date();

    // Check if paused
    if (settings.value.paused_until) {
      const pauseDate = new Date(settings.value.paused_until);
      if (pauseDate > now) {
        return `Tạm dừng đến ${pauseDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      }
    }

    // Check Quiet Hours (Không làm phiền)
    if (settings.value.quiet_hours_enabled && settings.value.quiet_start_time && settings.value.quiet_end_time) {
      if (isQuietTimeNow(now, settings.value.quiet_start_time, settings.value.quiet_end_time)) {
        return `Yên tĩnh đến ${settings.value.quiet_end_time}`;
      }
    }

    const [startH, startM] = settings.value.start_time.split(':').map(Number);
    const [endH, endM] = settings.value.end_time.split(':').map(Number);

    const startTimeToday = new Date(now);
    startTimeToday.setHours(startH, startM, 0, 0);

    const endTimeToday = new Date(now);
    endTimeToday.setHours(endH, endM, 0, 0);

    // If currently before start time today
    if (now < startTimeToday) {
      return `Bắt đầu lúc ${settings.value.start_time}`;
    }

    // If past end time today
    if (now > endTimeToday) {
      return `Hẹn sáng mai lúc ${settings.value.start_time}`;
    }

    // Currently within active window: calculate next interval point
    const intervalMs = settings.value.interval_minutes * 60 * 1000;
    const diffMs = now.getTime() - startTimeToday.getTime();
    const intervalsPassed = Math.floor(diffMs / intervalMs);
    const nextMs = startTimeToday.getTime() + (intervalsPassed + 1) * intervalMs;
    const nextDate = new Date(nextMs);

    if (nextDate > endTimeToday) {
      return `Hẹn sáng mai lúc ${settings.value.start_time}`;
    }

    const timeStr = nextDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `Tiếp theo: ${timeStr} (mỗi ${settings.value.interval_minutes}p)`;
  });

  // Pause helper
  function pauseReminder(minutes: number) {
    const pauseTime = new Date(Date.now() + minutes * 60 * 1000);
    settings.value.paused_until = pauseTime.toISOString();
    saveSettings();
  }

  function resumeReminder() {
    settings.value.paused_until = null;
    saveSettings();
  }

  function showMessage(type: 'success' | 'error' | 'info', text: string) {
    statusMessage.value = { type, text };
    setTimeout(() => {
      if (statusMessage.value?.text === text) {
        statusMessage.value = null;
      }
    }, 4000);
  }

  return {
    settings,
    isPushSubscribed,
    pushPermission,
    isSubscribing,
    statusMessage,
    nextReminderText,
    pauseReminder,
    resumeReminder,
    showMessage,
    updateSettings: (newSettings: Partial<ReminderSettings>) => {
      settings.value = { ...settings.value, ...newSettings };
      saveSettings();
    }
  };
}
