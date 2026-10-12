<template>
  <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
    <div class="bg-white w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col pb-safe sm:pb-6 animate-in slide-in-from-bottom-8 duration-200">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <BarChart3 class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-black text-slate-800">Thống kê uống nước</h3>
            <p class="text-xs text-slate-400">Theo dõi tiến độ theo từng ngày</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-3 gap-2.5 my-4">
        <div class="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
          <div class="text-[11px] font-semibold text-slate-400">Số ngày ghi</div>
          <div class="text-lg font-black text-slate-800 mt-0.5">{{ summaries.length }}</div>
        </div>
        <div class="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
          <div class="text-[11px] font-semibold text-slate-400">Tổng đã uống</div>
          <div class="text-lg font-black text-sky-600 mt-0.5">{{ totalAllMl.toLocaleString('vi-VN') }} <span class="text-[10px]">ml</span></div>
        </div>
        <div class="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
          <div class="text-[11px] font-semibold text-slate-400">Tổng số ngụm</div>
          <div class="text-lg font-black text-cyan-600 mt-0.5">{{ totalAllSips }}</div>
        </div>
      </div>

      <!-- List of Days -->
      <div class="flex-1 overflow-y-auto space-y-3 pr-1">
        <div v-if="summaries.length === 0" class="py-12 text-center text-slate-400 text-xs">
          Chưa có dữ liệu thống kê nào.
        </div>

        <div
          v-for="item in summaries"
          :key="item.local_date"
          class="p-4 rounded-2xl bg-slate-50/80 border border-slate-100"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="text-sm font-bold text-slate-800">
                {{ getRelativeDayLabel(item.local_date) }}
              </span>
              <span class="text-xs text-slate-400 ml-2">({{ item.local_date }})</span>
            </div>
            <div
              class="text-xs font-black px-2 py-0.5 rounded-full"
              :class="item.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'"
            >
              {{ item.percentage }}%
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="item.percentage >= 100 ? 'bg-emerald-500' : 'bg-sky-500'"
              :style="{ width: `${Math.min(100, item.percentage)}%` }"
            ></div>
          </div>

          <!-- Sub stats -->
          <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{{ item.total_ml.toLocaleString('vi-VN') }} ml / {{ item.total_sips }} ngụm</span>
            <span>{{ item.log_count }} lần ghi</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DaySummary } from '../types';
import { BarChart3, X } from 'lucide-vue-next';
import { getRelativeDayLabel } from '../utils/date';

const props = defineProps<{
  summaries: DaySummary[];
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const totalAllMl = computed(() => {
  return props.summaries.reduce((acc, cur) => acc + cur.total_ml, 0);
});

const totalAllSips = computed(() => {
  return props.summaries.reduce((acc, cur) => acc + cur.total_sips, 0);
});
</script>

