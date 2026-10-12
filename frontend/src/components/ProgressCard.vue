<template>
  <div class="bg-white rounded-3xl p-6 shadow-ios-card border border-sky-50 relative overflow-hidden transition-all">
    <!-- Subtle top right glow -->
    <div class="absolute -top-12 -right-12 w-36 h-36 bg-sky-200/40 rounded-full blur-2xl pointer-events-none"></div>

    <!-- Next Reminder Pill -->
    <div class="flex items-center justify-between mb-5">
      <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
        <Clock class="w-3.5 h-3.5 text-sky-500 animate-pulse" />
        <span>{{ nextReminderText }}</span>
      </div>

      <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Mục tiêu: <span class="text-slate-700 font-extrabold">{{ dailyGoal }} ml</span>
      </div>
    </div>

    <!-- Circular Progress & Water Visual -->
    <div class="flex flex-col items-center justify-center py-2 relative">
      <div class="relative w-48 h-48 flex items-center justify-center">
        <!-- SVG Progress Ring -->
        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <!-- Background track -->
          <circle
            cx="80"
            cy="80"
            r="68"
            stroke="currentColor"
            stroke-width="12"
            fill="transparent"
            class="text-sky-100"
          />
          <!-- Progress stroke -->
          <circle
            cx="80"
            cy="80"
            r="68"
            stroke="url(#waterGradient)"
            stroke-width="12"
            stroke-linecap="round"
            fill="transparent"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            class="transition-all duration-700 ease-out"
          />
          <!-- Gradient definition -->
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Center Content -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span class="text-4xl font-black text-slate-800 tracking-tight leading-none">
            {{ currentDayTotalMl.toLocaleString('vi-VN') }}
          </span>
          <span class="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wide">
            / {{ dailyGoal.toLocaleString('vi-VN') }} ml
          </span>
          <div class="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-sky-500 text-white shadow-sm shadow-sky-500/30">
            <span>{{ percentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats Breakdown: Sips & Remaining -->
    <div class="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
      <div class="bg-slate-50/80 rounded-2xl p-3 text-center border border-slate-100/60">
        <div class="flex items-center justify-center gap-1.5 text-sky-600 mb-1">
          <Sparkles class="w-3.5 h-3.5" />
          <span class="text-xs font-medium text-slate-500">Đã uống</span>
        </div>
        <div class="text-lg font-black text-slate-800">
          {{ currentDaySips }} <span class="text-xs font-semibold text-slate-500">ngụm</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">
          ~{{ sipMl }} ml / ngụm
        </div>
      </div>

      <div class="bg-slate-50/80 rounded-2xl p-3 text-center border border-slate-100/60">
        <div class="flex items-center justify-center gap-1.5 text-cyan-600 mb-1">
          <Droplet class="w-3.5 h-3.5" />
          <span class="text-xs font-medium text-slate-500">Còn lại</span>
        </div>
        <div class="text-lg font-black" :class="remainingMl === 0 ? 'text-emerald-600' : 'text-slate-800'">
          {{ remainingMl === 0 ? 'Đạt mục tiêu! 🎉' : `${remainingMl.toLocaleString('vi-VN')} ml` }}
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">
          {{ remainingMl === 0 ? 'Xuất sắc hôm nay' : `~${Math.ceil(remainingMl / sipMl)} ngụm nữa` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock, Droplet, Sparkles } from 'lucide-vue-next';

const props = defineProps<{
  currentDayTotalMl: number;
  dailyGoal: number;
  sipMl: number;
  currentDaySips: number;
  percentage: number;
  remainingMl: number;
  nextReminderText: string;
}>();

const radius = 68;
const circumference = 2 * Math.PI * radius;

const strokeDashoffset = computed(() => {
  const percent = Math.min(100, Math.max(0, props.percentage));
  return circumference - (percent / 100) * circumference;
});
</script>

