<template>
  <div class="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative select-none">
    <!-- Header -->
    <HeaderBar
      @open-stats="showStatsModal = true"
      @open-settings="showSettingsModal = true"
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
      WaterMate PWA • Nhắc & Theo Dõi Uống Nước
    </footer>

    <!-- Modals -->
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
      @close="showSettingsModal = false"
      @save-prefs="handleSavePrefs"
      @save-settings="handleSaveSettings"
      @pause="pauseReminder"
      @resume="resumeReminder"
      @request-push="handleRequestPush"
      @test-push="handleTestPush"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import ProgressCard from './components/ProgressCard.vue';
import QuickActions from './components/QuickActions.vue';
import HistoryList from './components/HistoryList.vue';
import CustomWaterModal from './components/CustomWaterModal.vue';
import StatsModal from './components/StatsModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import IosInstallBanner from './components/IosInstallBanner.vue';

import { useWaterTracker } from './composables/useWaterTracker';
import { useReminder } from './composables/useReminder';
import type { UserPreferences, ReminderSettings } from './types';
import * as api from './services/api';

const {
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
const toast = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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
  await refreshBackendLogs();

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
      } else if (event.data?.type === 'REFRESH_LOGS' || event.data?.type === 'AUTO_ADD_SIP') {
        refreshBackendLogs();
      }
    });
  }

  // Auto refresh logs whenever the app is brought to foreground (unlock screen / switch app)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshBackendLogs();
      }
    });
    window.addEventListener('focus', () => {
      refreshBackendLogs();
    });
  }
});

// Re-fetch backend logs and update state
async function refreshBackendLogs() {
  try {
    const backendLogs = await api.fetchWaterLogs();
    if (backendLogs && Array.isArray(backendLogs)) {
      syncBackendLogs(backendLogs);
    }
  } catch {
    // offline fallback
  }
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
  showToast('Đã lưu cài đặt nhắc nhở', 'success');
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

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    await api.sendPushSubscription(sub.toJSON());
    isPushSubscribed.value = true;
    showToast('Đã đăng ký Web Push thành công!', 'success');
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
        showToast(`Đã gửi thông báo & tự động cộng +1 ngụm (+50ml)!`, 'success');
      } else {
        showToast('Đã ghi nhận +1 ngụm! (Chưa có máy nào đăng ký push)', 'info');
      }
    } else {
      showToast(result.message || 'Chưa gửi được thông báo', 'error');
    }
  } catch (err: unknown) {
    showToast((err as Error)?.message || 'Lỗi gửi test push', 'error');
  }
}
</script>
