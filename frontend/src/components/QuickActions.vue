<template>
  <div class="space-y-3">
    <!-- Huge 1-Tap Primary Button: +1 Sip -->
    <button
      @click="$emit('add-sip')"
      class="w-full relative group overflow-hidden bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-500 text-white rounded-3xl py-5 px-6 shadow-ios-button active:scale-[0.98] transition-all duration-200 flex items-center justify-between"
    >
      <!-- Subtle wave background ripple -->
      <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <div class="flex items-center gap-4 text-left">
        <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
          <Droplet class="w-7 h-7 text-white fill-white animate-bounce" />
        </div>
        <div>
          <span class="block text-2xl font-black tracking-tight leading-tight">
            + 1 Ngụm
          </span>
          <span class="text-xs font-semibold text-sky-100 uppercase tracking-wider">
            Một ngụm phồng miệng ({{ sipMl }} ml)
          </span>
        </div>
      </div>

      <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
        <Plus class="w-6 h-6 stroke-[3]" />
      </div>
    </button>

    <!-- Secondary Quick Actions Grid -->
    <div class="grid grid-cols-2 gap-2.5">
      <!-- + 1/2 Cup -->
      <button
        @click="$emit('add-half-cup')"
        class="bg-white hover:bg-sky-50/50 active:scale-[0.97] border border-slate-100 rounded-2xl p-3.5 shadow-sm transition-all flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-sky-100/70 text-sky-600 flex items-center justify-center">
            <CupSoda class="w-4 h-4" />
          </div>
          <div>
            <div class="text-sm font-bold text-slate-800 leading-tight">+ 1/2 Cốc</div>
            <div class="text-[11px] text-slate-400 font-medium">{{ halfCupMl }} ml</div>
          </div>
        </div>
        <Plus class="w-4 h-4 text-slate-400" />
      </button>

      <!-- + 1 Full Cup -->
      <button
        @click="$emit('add-full-cup')"
        class="bg-white hover:bg-sky-50/50 active:scale-[0.97] border border-slate-100 rounded-2xl p-3.5 shadow-sm transition-all flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-cyan-100/70 text-cyan-600 flex items-center justify-center">
            <Coffee class="w-4 h-4" />
          </div>
          <div>
            <div class="text-sm font-bold text-slate-800 leading-tight">+ 1 Cốc</div>
            <div class="text-[11px] text-slate-400 font-medium">{{ cupMl }} ml</div>
          </div>
        </div>
        <Plus class="w-4 h-4 text-slate-400" />
      </button>
    </div>

    <!-- Custom & Undo row -->
    <div class="flex items-center gap-2.5">
      <!-- Custom water button -->
      <button
        @click="$emit('open-custom')"
        class="flex-1 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200/80 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-700 shadow-sm flex items-center justify-center gap-2 transition-all"
      >
        <SlidersHorizontal class="w-4 h-4 text-sky-600" />
        <span>Nhập tùy chỉnh</span>
      </button>

      <!-- Undo button -->
      <button
        @click="$emit('undo')"
        :disabled="!canUndo"
        class="bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200/80 rounded-2xl py-3 px-4 text-sm font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none"
        :class="canUndo ? 'text-amber-600 border-amber-200 bg-amber-50/30' : 'text-slate-400'"
      >
        <RotateCcw class="w-4 h-4" />
        <span>Hoàn tác</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Droplet, Plus, Coffee, RotateCcw, SlidersHorizontal, CupSoda } from 'lucide-vue-next';

const props = defineProps<{
  sipMl: number;
  cupMl: number;
  canUndo: boolean;
}>();

defineEmits<{
  (e: 'add-sip'): void;
  (e: 'add-half-cup'): void;
  (e: 'add-full-cup'): void;
  (e: 'open-custom'): void;
  (e: 'undo'): void;
}>();

const halfCupMl = computed(() => Math.round(props.cupMl / 2));
</script>

