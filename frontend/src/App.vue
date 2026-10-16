<template>
  <div class="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative select-none">
    <!-- Header -->
    <HeaderBar
      :events-count="upcomingEventsCount"
      :current-user="currentUser"
      @open-events="showEventsModal = true"
      @open-stats="showStatsModal = true"
      @open-settings="showSettingsModal = true"
      @open-auth="showAuthModal = true"
    />

    <!-- Toast Notification Banner -->
    <transition
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="-translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transform transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-4 opacity-0"
    >
      <div
        v-if="toast"
        class="fixed top-16 left-4 right-4 max-w-sm mx-auto z-[100] pointer-events-none"
      >
        <div
          class="rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md flex items-center justify-between text-xs font-bold border"
          :class="{
            'bg-emerald-500/90 text-white border-emerald-400': toast.type === 'success',
            'bg-rose-500/90 text-white border-rose-400': toast.type === 'error',
            'bg-sky-600/90 text-white border-sky-400': toast.type === 'info'
          }"
        >
          <span>{{ toast.message }}</span>
        </div>
      </div>
    </transition>

    <!-- Main Scrollable Area -->
    <main class="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
      <!-- iOS Install Guidance Banner -->
      <IosInstallBanner />

      <!-- Circular Water Progress Card -->
      <ProgressCard
        :current-day-total-ml="currentDayTotalMl"
        :daily-goal="dailyGoal"
        :sip-ml="preferences.sip_ml"
        :current-day-sips="currentDaySips"
        :percentage="percentage"
        :remaining-ml="remainingMl"
        :next-reminder-text="nextReminderText"
      />

      <!-- Quick Action Buttons -->
      <QuickActions
        :sip-ml="preferences.sip_ml"
        :cup-ml="preferences.cup_ml"
        :can-undo="currentDayLogs.length > 0 || lastRemovedLog !== null"
        @add-sip="handleAddSip"
        @add-half-cup="handleAddHalfCup"
        @add-full-cup="handleAddFullCup"
        @open-custom="showCustomModal = true"
        @undo="handleUndo"
        @test-custom="handleTestCustom"
      />

      <!-- History List -->
      <HistoryList
        :logs="currentDayLogs"
        @delete="handleDeleteLog"
        @update="handleUpdateLog"
        @clear-all="handleClearAll"
      />
    </main>

    <!-- Footer Safe Area -->
    <footer class="pb-safe pt-2 text-center text-[10px] text-slate-400 font-medium">
      WaterMate PWA • Nhắc Uống Nước • Lịch Sự Kiện • Đổ Rác
    </footer>

    <!-- Modals -->
    <AuthModal
      v-if="showAuthModal"
      :current-user="currentUser"
      @close="showAuthModal = false"
      @login="handleLogin"
      @register="handleRegister"
      @logout="handleLogout"
    />

    <EventRemindersModal
      v-if="showEventsModal"
      :events="eventReminders"
      :auto-delete="reminderSettings.event_auto_delete"
      @close="showEventsModal = false"
      @save-event="handleSaveEvent"
      @toggle-completed="handleToggleEvent"
      @delete-event="handleDeleteEvent"
    />

    <CustomWaterModal
      v-if="showCustomModal"
      :sip-ml="preferences.sip_ml"
      @close="showCustomModal = false"
      @submit="handleAddCustom"
    />

    <StatsModal
      v-if="showStatsModal"
      :summaries="historySummaries"
      @close="showStatsModal = false"
    />

    <SettingsModal
      v-if="showSettingsModal"
      :preferences="preferences"
      :settings="reminderSettings"
      :is-push-subscribed="isPushSubscribed"
      :current-user="currentUser"
      @close="showSettingsModal = false"
      @save-prefs="handleSavePrefs"
      @save-settings="handleSaveSettings"
      @pause="pauseReminder"
      @resume="resumeReminder"
      @request-push="handleRequestPush"
      @test-push="handleTestPush"
      @test-trash="handleTestTrash"
      @test-custom="handleTestCustom"
      @open-auth="showSettingsModal = false; showAuthModal = true"
      @open-events="showSettingsModal = false; showEventsModal = true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import ProgressCard from './components/ProgressCard.vue';
import QuickActions from './components/QuickActions.vue';
import HistoryList from './components/HistoryList.vue';
import CustomWaterModal from './components/CustomWaterModal.vue';
import StatsModal from './components/StatsModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import EventRemindersModal from './components/EventRemindersModal.vue';
import AuthModal from './components/AuthModal.vue';
import IosInstallBanner from './components/IosInstallBanner.vue';

import { useWaterTracker } from './composables/useWaterTracker';
import { useReminder } from './composables/useReminder';
import type { UserPreferences, ReminderSettings, EventReminder, User } from './types';
import * as api from './services/api';

const {
  logs,
  preferences,
  currentDayLogs,
  currentDayTotalMl,
  currentDaySips,
  dailyGoal,
  percentage,
  remainingMl,
  historySummaries,
  lastRemovedLog,
  addOneSip,
  addHalfCup,
  addFullCup,
  addWater,
  deleteLog,
  clearCurrentDayLogs,
  todayDate,
  updateLog,
  undoLastAction,
  setPreferences,
  syncBackendLogs,
  clearAllData,
} = useWaterTracker();

const {
  settings: reminderSettings,
  isPushSubscribed,
  nextReminderText,
  pauseReminder,
  resumeReminder,
  updateSettings,
} = useReminder();

// UI States
const showCustomModal = ref(false);
const showStatsModal = ref(false);
const showSettingsModal = ref(false);
const showEventsModal = ref(false);
const showAuthModal = ref(false);
const currentUser = ref<User | null>(null);
const storageMode = ref<'local' | 'cloud'>('local');

const eventReminders = ref<EventReminder[]>([]);
const toast = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

// Active countdown count for header badge
const upcomingEventsCount = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return eventReminders.value.filter((e) => !e.is_completed && e.event_date >= todayStr).length;
});

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.value = { type, message };
  setTimeout(() => {
    if (toast.value?.message === message) {
      toast.value = null;
    }
  }, 3500);
}

// Initial Sync with Backend if available
onMounted(async () => {
  // Check auth state
  try {
    const user = await api.fetchCurrentUser();
    if (user) {
      currentUser.value = user;
      storageMode.value = 'cloud';
    }
  } catch {
    storageMode.value = 'local';
  }

  await Promise.allSettled([
    refreshBackendLogs(),
    refreshEventReminders(),
  ]);

  // Check URL query parameter (e.g. from push click ?tab=events or ?tab=trash)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'events') {
      showEventsModal.value = true;
    } else if (urlParams.get('tab') === 'trash') {
      showSettingsModal.value = true;
    }
  } catch {
    // ignore
  }

  try {
    const remoteSettings = await api.fetchReminderSettings();
    if (remoteSettings) {
      updateSettings(remoteSettings);
    }
  } catch {
    // offline fallback
  }

  // Check if push already registered
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      isPushSubscribed.value = !!sub;
    } catch {
      // ignore
    }
  }

  // Listen for message from Service Worker to refresh logs and show in-app banner when push arrives
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        showToast(event.data.body || '💧 Đến giờ uống nước rồi!', 'info');
        refreshBackendLogs();
      } else if (event.data?.type === 'EVENT_PUSH_RECEIVED') {
        showToast(event.data.body || '📅 Bạn có nhắc nhở quan trọng!', 'info');
        refreshEventReminders();
      } else if (event.data?.type === 'OPEN_TAB' && event.data?.tab === 'events') {
        showEventsModal.value = true;
        refreshEventReminders();
      } else if (event.data?.type === 'OPEN_TAB' && event.data?.tab === 'trash') {
        showSettingsModal.value = true;
      } else if (event.data?.type === 'REFRESH_LOGS' || event.data?.type === 'AUTO_ADD_SIP') {
        refreshBackendLogs();
        refreshEventReminders();
      }
    });
  }

  // Auto refresh logs whenever the app is brought to foreground (unlock screen / switch app)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshBackendLogs();
        refreshEventReminders();
      }
    });
    window.addEventListener('focus', () => {
      refreshBackendLogs();
      refreshEventReminders();
    });
  }
});

// Re-fetch backend logs and update state (only for authenticated user)
async function refreshBackendLogs() {
  if (!currentUser.value) {
    return;
  }
  try {
    const backendLogs = await api.fetchWaterLogs();
    if (backendLogs && Array.isArray(backendLogs)) {
      syncBackendLogs(backendLogs);
    }
  } catch {
    // offline fallback
  }
}

// Auth Handlers (Local vs Account/Password)
async function handleLogin(payload: { username: string; password: string; syncLocal: boolean }) {
  try {
    const res = await api.loginUser(payload.username, payload.password);
    api.setAuthToken(res.token);
    currentUser.value = res.user;
    storageMode.value = 'cloud';
    showToast(`Đăng nhập thành công! Chào ${res.user.username}`, 'success');

    if (payload.syncLocal) {
      await api.syncLocalData({
        water_logs: logs.value,
        event_reminders: eventReminders.value,
        settings: reminderSettings.value,
      });
      showToast('Đã đồng bộ dữ liệu lên tài khoản đám mây!', 'info');
    }

    await Promise.allSettled([refreshBackendLogs(), refreshEventReminders()]);
    const remoteSettings = await api.fetchReminderSettings();
    if (remoteSettings) updateSettings(remoteSettings);
    showAuthModal.value = false;
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi đăng nhập', 'error');
  }
}

async function handleRegister(payload: { username: string; password: string; syncLocal: boolean }) {
  try {
    const res = await api.registerUser(payload.username, payload.password);
    api.setAuthToken(res.token);
    currentUser.value = res.user;
    storageMode.value = 'cloud';
    showToast(`Tạo tài khoản thành công! Xin chào ${res.user.username}`, 'success');

    if (payload.syncLocal) {
      await api.syncLocalData({
        water_logs: logs.value,
        event_reminders: eventReminders.value,
        settings: reminderSettings.value,
      });
      showToast('Đã lưu dữ liệu từ máy lên tài khoản mới!', 'info');
    }

    await Promise.allSettled([refreshBackendLogs(), refreshEventReminders()]);
    showAuthModal.value = false;
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi đăng ký tài khoản', 'error');
  }
}

function handleLogout() {
  api.clearAuthToken();
  currentUser.value = null;
  storageMode.value = 'local';
  clearAllData();
  eventReminders.value = [];
  showAuthModal.value = false;
  showToast('Đã đăng xuất. Dữ liệu cá nhân đã được bảo mật ẩn đi.', 'info');
}

// Quick Handlers
async function handleAddSip() {
  const log = addOneSip();
  if (log) {
    showToast(`Đã thêm 1 ngụm (+${log.amount_ml} ml)`, 'success');
    api.createWaterLog(log).catch(() => {});
  }
}

async function handleAddHalfCup() {
  const log = addHalfCup();
  if (log) {
    showToast(`Đã thêm nửa cốc (+${log.amount_ml} ml)`, 'success');
    api.createWaterLog(log).catch(() => {});
  }
}

async function handleAddFullCup() {
  const log = addFullCup();
  if (log) {
    showToast(`Đã thêm 1 cốc (+${log.amount_ml} ml)`, 'success');
    api.createWaterLog(log).catch(() => {});
  }
}

async function handleAddCustom(ml: number, source: 'sip' | 'custom') {
  const log = addWater(ml, source);
  if (log) {
    showToast(`Đã thêm +${log.amount_ml} ml (${log.sip_equivalent} ngụm)`, 'success');
    api.createWaterLog(log).catch(() => {});
  }
}

function handleUndo() {
  const success = undoLastAction();
  if (success) {
    showToast('Đã hoàn tác thao tác gần nhất', 'info');
  }
}

async function handleDeleteLog(id: string | number) {
  const success = deleteLog(id);
  if (success) {
    showToast('Đã xóa bản ghi uống nước', 'info');
    api.deleteWaterLog(id).catch(() => {});
  }
}

async function handleClearAll() {
  clearCurrentDayLogs();
  showToast('Đã xóa toàn bộ lịch sử hôm nay', 'info');
  api.clearWaterLogs(todayDate.value).catch(() => {});
}

async function handleUpdateLog(id: string | number, amount: number) {
  const success = updateLog(id, amount);
  if (success) {
    showToast(`Đã cập nhật thành ${amount} ml`, 'success');
    api.updateWaterLog(id, amount).catch(() => {});
  }
}

function handleSavePrefs(prefs: Partial<UserPreferences>) {
  setPreferences(prefs);
  showToast('Đã lưu cấu hình mục tiêu', 'success');
}

async function handleSaveSettings(newSettings: Partial<ReminderSettings>) {
  updateSettings(newSettings);
  showToast('Đã lưu cài đặt thông báo', 'success');
  try {
    await api.updateReminderSettings(newSettings);
  } catch {
    // local saved
  }
}

// Convert VAPID base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Push notifications request
async function handleRequestPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('Trình duyệt chưa hỗ trợ Web Push. Vui lòng thêm vào MH chính iPhone (iOS 16.4+)!', 'error');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast('Bạn đã từ chối quyền nhận thông báo trong cài đặt thiết bị', 'error');
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const publicKey = await api.getVapidPublicKey();
    const convertedKey = urlBase64ToUint8Array(publicKey);

    const existingSub = await reg.pushManager.getSubscription();
    if (existingSub) {
      try {
        await existingSub.unsubscribe();
      } catch (unsubErr) {
        console.warn('Could not clear stale subscription:', unsubErr);
      }
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    await api.sendPushSubscription(sub.toJSON());
    isPushSubscribed.value = true;
    showToast('Đã kích hoạt Web Push thành công!', 'success');
  } catch (err: unknown) {
    console.error('Push registration error:', err);
    showToast((err as Error)?.message || 'Lỗi khi kích hoạt Web Push', 'error');
  }
}

async function handleTestPush() {
  if (!isPushSubscribed.value) {
    showToast('Vui lòng bấm nút "Kích hoạt Web Push" bên cạnh trước để cấp quyền!', 'info');
    return;
  }

  try {
    showToast('Đang gửi thông báo thử nghiệm từ máy chủ...', 'info');
    const result = await api.sendTestNotification();
    if (result.success) {
      await refreshBackendLogs();
      if (result.sent && result.sent > 0) {
        showToast('Đã gửi thông báo & tự động cộng +1 ngụm (+50ml)!', 'success');
      } else {
        showToast('Đã ghi nhận +1 ngụm! (Chưa có máy nào nhận được thông báo)', 'info');
      }
    } else {
      showToast((result as any).error || result.message || 'Chưa gửi được thông báo', 'error');
    }
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi gửi test push', 'error');
  }
}

async function handleTestTrash(customMessage?: string) {
  if (!isPushSubscribed.value) {
    showToast('Vui lòng bấm nút "Kích hoạt Web Push" trên màn hình chính trước để cấp quyền!', 'info');
    return;
  }

  try {
    showToast('Đang gửi thông báo đổ rác thử nghiệm...', 'info');
    const result = await api.sendTestTrashNotification(customMessage);
    if (result.success) {
      showToast('Đã gửi thông báo đổ rác thử nghiệm thành công!', 'success');
    } else {
      showToast(result.error || 'Lỗi gửi test thông báo đổ rác', 'error');
    }
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi gửi test thông báo đổ rác', 'error');
  }
}

async function handleTestCustom(payload: { title?: string; message: string }) {
  const customBody = payload.message?.trim();
  const customTitle = payload.title?.trim() || 'WaterMate - Thông báo! 🔔';

  if (!customBody) {
    showToast('Vui lòng nhập nội dung thông báo trước khi ấn Test!', 'error');
    return;
  }

  // Try sending via Web Push backend first if subscribed
  if (isPushSubscribed.value) {
    try {
      showToast('Đang gửi thông báo test của bạn...', 'info');
      const result = await api.sendCustomTestNotification(customBody, customTitle);
      if (result.success) {
        showToast(`Đã gửi thông báo: "${customBody}"`, 'success');
        return;
      }
    } catch (err: unknown) {
      showToast((err as Error)?.message || 'Lỗi gửi thông báo qua Web Push', 'error');
      return;
    }
  }

  // Fallback: if Web Push isn't subscribed on this device yet, try backend anyway or local browser notification
  try {
    const result = await api.sendCustomTestNotification(customBody, customTitle);
    if (result.success) {
      showToast(`Đã gửi thông báo tới thiết bị đăng ký: "${customBody}"`, 'success');
      return;
    }
  } catch {
    // Fallback to local Notification API + in-app toast
  }

  if ('Notification' in window) {
    try {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }
      if (perm === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(customTitle, {
            body: customBody,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
          });
        } else {
          new Notification(customTitle, {
            body: customBody,
            icon: '/icons/icon-192.png',
          });
        }
        showToast(`🔔 ${customBody}`, 'success');
        return;
      }
    } catch {
      // ignore local notification error
    }
  }

  showToast(`🔔 [Test] ${customTitle}: ${customBody} (Hãy bấm "Kích hoạt Web Push" trong Cài đặt để nhận thông báo hệ thống)`, 'info');
}

// Event Reminders Handlers
async function refreshEventReminders() {
  if (!currentUser.value) {
    return;
  }
  try {
    const list = await api.fetchEventReminders();
    if (Array.isArray(list)) {
      eventReminders.value = list;
    }
  } catch {
    // offline fallback
  }
}

async function handleSaveEvent(data: {
  id?: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  remind_days: string;
}) {
  try {
    if (data.id) {
      await api.updateEventReminder(data.id, data);
      showToast('Đã cập nhật sự kiện!', 'success');
    } else {
      await api.createEventReminder({
        title: data.title,
        description: data.description,
        event_date: data.event_date,
        event_time: data.event_time,
        remind_days: data.remind_days,
      });
      showToast('Đã tạo lịch nhắc sự kiện!', 'success');
    }
    await refreshEventReminders();
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi khi lưu sự kiện', 'error');
  }
}

async function handleToggleEvent(id: string, autoDelete: boolean) {
  try {
    const res = await api.toggleEventReminder(id, autoDelete);
    await refreshEventReminders();
    if (res.deleted) {
      showToast('Đã hoàn thành & tự động xóa sự kiện!', 'success');
    } else {
      showToast('Đã cập nhật trạng thái sự kiện', 'info');
    }
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi khi cập nhật trạng thái', 'error');
  }
}

async function handleDeleteEvent(id: string) {
  try {
    await api.deleteEventReminder(id);
    await refreshEventReminders();
    showToast('Đã xóa sự kiện', 'info');
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi khi xóa sự kiện', 'error');
  }
}
</script>
