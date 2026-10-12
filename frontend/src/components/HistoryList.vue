<template>
  <div class="bg-white rounded-3xl p-5 shadow-ios-card border border-sky-50">
    <!-- Header with Clear All button -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <h2 class="text-base font-bold text-slate-800">Lịch sử hôm nay</h2>
        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {{ logs.length }} lần
        </span>
      </div>

      <!-- Delete All Button -->
      <button
        v-if="logs.length > 0"
        @click="showConfirmClearAll = true"
        type="button"
        class="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all select-none border border-rose-100"
      >
        <Trash2 class="w-3.5 h-3.5" />
        <span>Xóa tất cả</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="logs.length === 0" class="py-8 text-center flex flex-col items-center justify-center">
      <div class="w-14 h-14 rounded-full bg-sky-50 text-sky-400 flex items-center justify-center mb-2">
        <Droplet class="w-6 h-6 stroke-1" />
      </div>
      <p class="text-sm font-semibold text-slate-600">Chưa có lần uống nước nào hôm nay</p>
      <p class="text-xs text-slate-400 mt-1 max-w-[220px]">
        Bấm nút <span class="font-bold text-sky-600">+1 Ngụm</span> ở trên để bắt đầu ghi nhận nhé!
      </p>
    </div>

    <!-- Logs Timeline -->
    <div v-else class="space-y-2.5">
      <div
        v-for="log in logs"
        :key="log.id"
        class="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100/70 transition-all group"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
            :class="getSourceBadgeClass(log.source)"
          >
            <component :is="getSourceIcon(log.source)" class="w-5 h-5" />
          </div>

          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-black text-slate-800">
                +{{ log.amount_ml }} ml
              </span>
              <span class="text-xs font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/50">
                {{ log.sip_equivalent }} ngụm
              </span>
            </div>
            <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span>{{ formatTime(log.created_at) }}</span>
              <span>•</span>
              <span>{{ getSourceLabel(log.source) }}</span>
            </div>
          </div>
        </div>

        <!-- Action buttons: Edit & Delete (large touch targets to prevent accidental zooming) -->
        <div class="flex items-center gap-1">
          <button
            @click="startEdit(log)"
            type="button"
            aria-label="Sửa"
            class="w-9 h-9 rounded-xl text-slate-400 hover:text-sky-600 hover:bg-sky-50 active:scale-90 flex items-center justify-center transition-all select-none"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            @click="$emit('delete', log.id)"
            type="button"
            aria-label="Xóa"
            class="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 flex items-center justify-center transition-all select-none"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Clear All Modal Dialog -->
    <div
      v-if="showConfirmClearAll"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-center">
        <div class="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Trash2 class="w-6 h-6" />
        </div>
        <h3 class="text-base font-black text-slate-800 mb-1">Xóa toàn bộ lịch sử?</h3>
        <p class="text-xs text-slate-500 mb-5 leading-relaxed">
          Bạn có chắc chắn muốn xóa tất cả <strong>{{ logs.length }} lần</strong> ghi nhận hôm nay không?
        </p>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="showConfirmClearAll = false"
            class="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all select-none"
          >
            Hủy
          </button>
          <button
            type="button"
            @click="confirmClearAll"
            class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-all select-none"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal Dialog -->
    <div
      v-if="editingLog"
      class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        <h3 class="text-lg font-bold text-slate-800 mb-1">Chỉnh sửa lượng nước</h3>
        <p class="text-xs text-slate-500 mb-4">
          Thời gian: {{ formatTime(editingLog.created_at) }}
        </p>

        <div class="mb-4">
          <label class="block text-xs font-bold text-slate-600 mb-1.5">Dung tích (ml)</label>
          <div class="relative">
            <input
              type="number"
              v-model.number="editAmount"
              min="1"
              max="5000"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span class="absolute right-3.5 top-3.5 text-xs font-semibold text-slate-400">ml</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="editingLog = null"
            class="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all select-none"
          >
            Hủy
          </button>
          <button
            type="button"
            @click="saveEdit"
            class="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all select-none"
          >
            Lưu lại
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WaterLog } from '../types';
import { Droplet, CupSoda, Coffee, SlidersHorizontal, Trash2, Pencil } from 'lucide-vue-next';
import { formatTime } from '../utils/date';

defineProps<{
  logs: WaterLog[];
}>();

const emit = defineEmits<{
  (e: 'delete', id: string | number): void;
  (e: 'update', id: string | number, amount: number): void;
  (e: 'clear-all'): void;
}>();

const showConfirmClearAll = ref(false);
const editingLog = ref<WaterLog | null>(null);
const editAmount = ref<number>(0);

function confirmClearAll() {
  emit('clear-all');
  showConfirmClearAll.value = false;
}

function startEdit(log: WaterLog) {
  editingLog.value = log;
  editAmount.value = log.amount_ml;
}

function saveEdit() {
  if (editingLog.value && editAmount.value > 0) {
    emit('update', editingLog.value.id, editAmount.value);
    editingLog.value = null;
  }
}

function getSourceIcon(source: WaterLog['source']) {
  switch (source) {
    case 'sip': return Droplet;
    case 'half_cup': return CupSoda;
    case 'full_cup': return Coffee;
    default: return SlidersHorizontal;
  }
}

function getSourceBadgeClass(source: WaterLog['source']) {
  switch (source) {
    case 'sip': return 'bg-sky-100 text-sky-600';
    case 'half_cup': return 'bg-cyan-100 text-cyan-600';
    case 'full_cup': return 'bg-blue-100 text-blue-600';
    default: return 'bg-indigo-100 text-indigo-600';
  }
}

function getSourceLabel(source: WaterLog['source']): string {
  switch (source) {
    case 'sip': return 'Ngụm';
    case 'half_cup': return '1/2 Cốc';
    case 'full_cup': return '1 Cốc';
    case 'custom': return 'Tùy chỉnh';
    default: return 'Khác';
  }
}
</script>
