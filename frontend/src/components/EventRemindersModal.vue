<template>
  <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
    <div class="bg-white w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col pb-safe sm:pb-6 animate-in slide-in-from-bottom-8 duration-200">
      
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <CalendarDays class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-black text-slate-800">Lịch nhắc sự kiện</h3>
            <p class="text-xs text-slate-400">Nhắc trước 2-3 ngày & đúng ngày</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-y-auto space-y-4 py-4 pr-1">

        <!-- Button to open Add Event Form & Auto delete toggle -->
        <div v-if="!showForm" class="space-y-2">
          <button
            type="button"
            @click="openAddForm"
            class="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Thêm sự kiện cần nhắc</span>
          </button>

          <!-- Auto delete toggle option ("Khi nào xong tự xoá") -->
          <div class="px-3 py-2 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-purple-900 block">Khi nào xong tự xoá</span>
              <span class="text-[10px] text-slate-400">Tự động xóa khỏi danh sách khi tích hoàn thành</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="isAutoDelete" class="sr-only peer" />
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <!-- Add / Edit Form -->
        <div v-if="showForm" class="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3 animate-in fade-in duration-150">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase tracking-wider text-purple-900">
              {{ editingId ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới' }}
            </h4>
            <button
              type="button"
              @click="closeForm"
              class="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Hủy
            </button>
          </div>

          <!-- Event Title -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Tên sự kiện / Việc cần làm <span class="text-rose-500">*</span></label>
            <input
              type="text"
              v-model="formTitle"
              placeholder="VD: Sinh nhật, Hạn đóng tiền nhà, Thi cử..."
              class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <!-- Date and Time -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Ngày diễn ra <span class="text-rose-500">*</span></label>
              <input
                type="date"
                v-model="formDate"
                class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Giờ nhắc trong ngày</label>
              <input
                type="time"
                v-model="formTime"
                class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <!-- Remind Days Selection -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1.5">Lịch nhắc nhở trước:</label>
            <div class="grid grid-cols-4 gap-1.5 mb-2">
              <button
                v-for="opt in [
                  { label: 'Trước 3 ngày', val: 3 },
                  { label: 'Trước 2 ngày', val: 2 },
                  { label: 'Trước 1 ngày', val: 1 },
                  { label: 'Đúng ngày (0)', val: 0 }
                ]"
                :key="opt.val"
                type="button"
                @click="toggleRemindDay(opt.val)"
                class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all text-center"
                :class="selectedRemindDays.includes(opt.val)
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
              >
                {{ opt.label }}
              </button>
            </div>
            <p class="text-[10px] text-slate-500 italic">
              {{ formatSelectedRemindDaysText(selectedRemindDays) }}
            </p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Ghi chú (tùy chọn)</label>
            <textarea
              v-model="formDescription"
              rows="2"
              placeholder="Địa điểm, việc cần chuẩn bị trước..."
              class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          <!-- Form Buttons -->
          <div class="flex items-center gap-2 pt-1">
            <button
              type="button"
              @click="closeForm"
              class="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              @click="submitForm"
              class="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all"
            >
              {{ editingId ? 'Lưu thay đổi' : 'Tạo lịch nhắc' }}
            </button>
          </div>
        </div>

        <!-- Events List -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Danh sách sự kiện ({{ events.length }})</span>
            <span class="text-[10px] text-slate-400">Đếm ngược tự động</span>
          </div>

          <!-- Empty state -->
          <div v-if="events.length === 0 && !showForm" class="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <CalendarCheck class="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p class="text-xs font-bold text-slate-600 mb-1">Chưa có sự kiện nào</p>
            <p class="text-[11px] text-slate-400 max-w-xs mx-auto">
              Thêm các ngày quan trọng (sinh nhật, hạn nộp, lịch hẹn) để WaterMate tự động nhắc trước 2-3 ngày và đúng ngày nhé!
            </p>
          </div>

          <!-- Event Cards -->
          <div
            v-for="ev in sortedEvents"
            :key="ev.id"
            class="p-3.5 rounded-2xl border transition-all"
            :class="ev.is_completed
              ? 'bg-slate-50 border-slate-200 opacity-60'
              : getEventUrgencyStyle(ev.event_date).cardClass"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <!-- Title & Status Badge -->
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <h5
                    class="text-xs font-black text-slate-800"
                    :class="{ 'line-through text-slate-400': ev.is_completed }"
                  >
                    {{ ev.title }}
                  </h5>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    :class="ev.is_completed ? 'bg-slate-200 text-slate-600' : getEventUrgencyStyle(ev.event_date).badgeClass"
                  >
                    {{ ev.is_completed ? 'Đã xong' : getCountdownText(ev.event_date) }}
                  </span>
                </div>

                <!-- Description if any -->
                <p v-if="ev.description" class="text-[11px] text-slate-600 mb-1.5 font-medium">
                  {{ ev.description }}
                </p>

                <!-- Date & Reminder Details -->
                <div class="flex items-center gap-3 text-[10px] text-slate-500 font-semibold flex-wrap">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3 h-3 text-purple-500" />
                    {{ formatDisplayDate(ev.event_date) }} lúc {{ ev.event_time || '09:00' }}
                  </span>
                  <span class="flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
                    <BellRing class="w-2.5 h-2.5" />
                    {{ formatRemindDaysList(ev.remind_days) }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  @click="handleToggle(ev.id)"
                  :title="ev.is_completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'"
                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                  :class="ev.is_completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'"
                >
                  <Check class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="startEdit(ev)"
                  title="Chỉnh sửa"
                  class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-400 hover:text-purple-600 flex items-center justify-center transition-all active:scale-90"
                >
                  <Edit2 class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="$emit('delete-event', ev.id)"
                  title="Xóa sự kiện"
                  class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-all active:scale-90"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-[10px] text-slate-400 font-medium">WaterMate • Nhắc nhở sự kiện thông minh</span>
        <button
          @click="$emit('close')"
          class="py-2 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 active:scale-95 transition-all"
        >
          Đóng
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { EventReminder } from '../types';
import {
  CalendarDays,
  CalendarCheck,
  Calendar,
  Plus,
  X,
  Check,
  Edit2,
  Trash2,
  BellRing
} from 'lucide-vue-next';

const props = defineProps<{
  events: EventReminder[];
  autoDelete?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save-event', data: {
    id?: string;
    title: string;
    description?: string;
    event_date: string;
    event_time: string;
    remind_days: string;
  }): void;
  (e: 'toggle-completed', id: string, autoDelete: boolean): void;
  (e: 'delete-event', id: string): void;
}>();

const isAutoDelete = ref(props.autoDelete ?? true);
const showForm = ref(false);
const editingId = ref<string | null>(null);

function handleToggle(id: string) {
  emit('toggle-completed', id, isAutoDelete.value);
}

const formTitle = ref('');
const formDescription = ref('');
const formDate = ref('');
const formTime = ref('09:00');
const selectedRemindDays = ref<number[]>([3, 2, 1, 0]);

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function openAddForm() {
  editingId.value = null;
  formTitle.value = '';
  formDescription.value = '';
  formDate.value = getTodayString();
  formTime.value = '09:00';
  selectedRemindDays.value = [3, 2, 1, 0];
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
}

function toggleRemindDay(val: number) {
  if (selectedRemindDays.value.includes(val)) {
    if (selectedRemindDays.value.length > 1) {
      selectedRemindDays.value = selectedRemindDays.value.filter((n) => n !== val);
    }
  } else {
    selectedRemindDays.value = [...selectedRemindDays.value, val].sort((a, b) => b - a);
  }
}

function formatSelectedRemindDaysText(days: number[]): string {
  if (days.includes(3) && days.includes(2) && days.includes(1) && days.includes(0)) {
    return '🔔 Sẽ nhắc trước 3 ngày, 2 ngày, 1 ngày và đúng ngày diễn ra.';
  }
  const parts: string[] = [];
  if (days.includes(3)) parts.push('trước 3 ngày');
  if (days.includes(2)) parts.push('trước 2 ngày');
  if (days.includes(1)) parts.push('trước 1 ngày');
  if (days.includes(0)) parts.push('đúng ngày');
  return `🔔 Nhắc: ${parts.join(', ')}.`;
}

function formatRemindDaysList(remindDaysStr: string): string {
  const parts = (remindDaysStr || '3,2,1,0').split(',').map((s) => s.trim());
  const labels: string[] = [];
  if (parts.includes('3')) labels.push('3n');
  if (parts.includes('2')) labels.push('2n');
  if (parts.includes('1')) labels.push('1n');
  if (parts.includes('0')) labels.push('Đúng ngày');
  return `Nhắc: ${labels.join(', ')}`;
}

function startEdit(ev: EventReminder) {
  editingId.value = ev.id;
  formTitle.value = ev.title;
  formDescription.value = ev.description || '';
  formDate.value = ev.event_date;
  formTime.value = ev.event_time || '09:00';
  selectedRemindDays.value = (ev.remind_days || '3,2,1,0')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n));
  showForm.value = true;
}

function submitForm() {
  if (!formTitle.value.trim()) {
    alert('Vui lòng nhập tên sự kiện!');
    return;
  }
  if (!formDate.value) {
    alert('Vui lòng chọn ngày diễn ra sự kiện!');
    return;
  }

  const remindDaysStr = selectedRemindDays.value.sort((a, b) => b - a).join(',');

  emit('save-event', {
    id: editingId.value || undefined,
    title: formTitle.value.trim(),
    description: formDescription.value.trim(),
    event_date: formDate.value,
    event_time: formTime.value || '09:00',
    remind_days: remindDaysStr,
  });

  closeForm();
}

function calculateDiffDays(targetDateStr: string): number {
  const todayStr = getTodayString();
  const [tY, tM, tD] = todayStr.split('-').map(Number);
  const [eY, eM, eD] = targetDateStr.split('-').map(Number);
  const todayUtc = Date.UTC(tY, tM - 1, tD);
  const eventUtc = Date.UTC(eY, eM - 1, eD);
  return Math.round((eventUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

function getCountdownText(targetDateStr: string): string {
  const diff = calculateDiffDays(targetDateStr);
  if (diff === 0) return 'Hôm nay!';
  if (diff === 1) return 'Ngày mai';
  if (diff > 1) return `Còn ${diff} ngày`;
  return 'Đã qua';
}

function getEventUrgencyStyle(targetDateStr: string) {
  const diff = calculateDiffDays(targetDateStr);
  if (diff === 0) {
    return {
      cardClass: 'bg-rose-50/70 border-rose-200 shadow-sm',
      badgeClass: 'bg-rose-500 text-white animate-pulse',
    };
  }
  if (diff === 1) {
    return {
      cardClass: 'bg-amber-50/70 border-amber-200 shadow-sm',
      badgeClass: 'bg-amber-500 text-white',
    };
  }
  if (diff === 2 || diff === 3) {
    return {
      cardClass: 'bg-purple-50/50 border-purple-200',
      badgeClass: 'bg-purple-100 text-purple-700',
    };
  }
  if (diff > 3) {
    return {
      cardClass: 'bg-white border-slate-200',
      badgeClass: 'bg-sky-50 text-sky-700',
    };
  }
  return {
    cardClass: 'bg-slate-50 border-slate-200',
    badgeClass: 'bg-slate-200 text-slate-500',
  };
}

function formatDisplayDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

const sortedEvents = computed(() => {
  return [...props.events].sort((a, b) => {
    // Incomplete first
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    // Then nearest date first
    return a.event_date.localeCompare(b.event_date);
  });
});
</script>

