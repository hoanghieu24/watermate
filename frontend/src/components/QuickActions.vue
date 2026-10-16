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

    <!-- Quick Test Custom Notification Card -->
    <div class="bg-white border border-amber-200/90 rounded-2xl p-3 shadow-sm space-y-2.5">
      <button
        type="button"
        @click="showQuickTest = !showQuickTest"
        class="w-full flex items-center justify-between text-left"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <BellRing class="w-4 h-4" />
          </div>
          <div>
            <div class="text-xs font-extrabold text-slate-800">Test thông báo (Tự ghi nội dung)</div>
            <div class="text-[10px] text-slate-400">Nhập nội dung bất kỳ & ấn gửi thông báo ngay</div>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          {{ showQuickTest ? 'Thu gọn' : 'Mở test' }}
        </span>
      </button>

      <div v-if="showQuickTest" class="pt-2 border-t border-slate-100 space-y-2">
        <input
          type="text"
          v-model="quickTitle"
          placeholder="Tiêu đề (Mặc định: WaterMate - Thông báo! 🔔)"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
        />
        <div class="flex items-center gap-2">
          <input
            type="text"
            v-model="quickMessage"
            placeholder="Nhập nội dung thông báo bạn muốn ghi..."
            class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
            @keyup.enter="submitQuickTest"
          />
          <button
            type="button"
            @click="submitQuickTest"
            class="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Send class="w-3.5 h-3.5" />
            <span>Test thông báo</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Droplet, Plus, Coffee, RotateCcw, SlidersHorizontal, CupSoda, BellRing, Send } from 'lucide-vue-next';

const props = defineProps<{
  sipMl: number;
  cupMl: number;
  canUndo: boolean;
}>();

const emit = defineEmits<{
  (e: 'add-sip'): void;
  (e: 'add-half-cup'): void;
  (e: 'add-full-cup'): void;
  (e: 'open-custom'): void;
  (e: 'undo'): void;
  (e: 'test-custom', payload: { title?: string; message: string }): void;
}>();

const halfCupMl = computed(() => Math.round(props.cupMl / 2));

const showQuickTest = ref(false);
const quickTitle = ref('WaterMate - Thông báo! 🔔');
const quickMessage = ref('');

function submitQuickTest() {
  emit('test-custom', {
    title: quickTitle.value,
    message: quickMessage.value,
  });
}
</script>

