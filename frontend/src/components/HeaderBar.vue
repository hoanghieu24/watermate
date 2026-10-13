<template>
  <header class="pt-safe px-5 pb-3 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-sky-100 flex items-center justify-between transition-all">
    <div class="flex items-center gap-2.5">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-md shadow-sky-500/20 text-white">
        <Droplets class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-xl font-black text-slate-800 tracking-tight leading-none flex items-center gap-1.5">
          WaterMate
          <span class="text-[10px] font-semibold uppercase tracking-wider bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">PWA</span>
        </h1>
        <p class="text-xs font-medium text-slate-500 mt-0.5 capitalize">
          {{ displayDate }}
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <button
        @click="$emit('open-events')"
        aria-label="Lịch nhắc sự kiện"
        class="w-9 h-9 rounded-full bg-slate-100 hover:bg-purple-50 active:scale-95 text-slate-600 hover:text-purple-600 flex items-center justify-center transition-all relative"
      >
        <CalendarDays class="w-4 h-4" />
        <span
          v-if="eventsCount && eventsCount > 0"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-purple-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm"
        >
          {{ eventsCount }}
        </span>
      </button>

      <button
        @click="$emit('open-stats')"
        aria-label="Thống kê"
        class="w-9 h-9 rounded-full bg-slate-100 hover:bg-sky-50 active:scale-95 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-all"
      >
        <BarChart3 class="w-4 h-4" />
      </button>

      <button
        @click="$emit('open-settings')"
        aria-label="Cài đặt"
        class="w-9 h-9 rounded-full bg-slate-100 hover:bg-sky-50 active:scale-95 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-all"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Droplets, BarChart3, Settings, CalendarDays } from 'lucide-vue-next';
import { formatReadableDate, getTodayLocalDate } from '../utils/date';

defineProps<{
  eventsCount?: number;
}>();

defineEmits<{
  (e: 'open-events'): void;
  (e: 'open-stats'): void;
  (e: 'open-settings'): void;
}>();

const displayDate = computed(() => {
  return formatReadableDate(getTodayLocalDate());
});
</script>

