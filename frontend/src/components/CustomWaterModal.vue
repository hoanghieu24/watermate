<template>
  <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
    <div class="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 pb-safe sm:pb-6 animate-in slide-in-from-bottom-8 duration-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-black text-slate-800">Thêm lượng nước tùy chỉnh</h3>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector: ml or sips -->
      <div class="flex p-1 bg-slate-100 rounded-2xl mb-5">
        <button
          @click="mode = 'ml'"
          class="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
          :class="mode === 'ml' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          Theo Mililit (ml)
        </button>
        <button
          @click="mode = 'sip'"
          class="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
          :class="mode === 'sip' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        >
          Theo Số ngụm
        </button>
      </div>

      <!-- Value Input -->
      <div v-if="mode === 'ml'" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1.5">Nhập lượng nước (ml)</label>
          <div class="relative">
            <input
              type="number"
              v-model.number="customMl"
              min="1"
              max="5000"
              placeholder="VD: 300"
              class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span class="absolute right-4 top-4 text-sm font-bold text-slate-400">ml</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Tương đương ~{{ Number((customMl / sipMl).toFixed(1)) }} ngụm phồng miệng
          </p>
        </div>

        <!-- Quick ml chips -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in [100, 150, 200, 300, 500]"
            :key="preset"
            @click="customMl = preset"
            class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all"
            :class="customMl === preset ? 'bg-sky-50 border-sky-300 text-sky-700' : ''"
          >
            +{{ preset }} ml
          </button>
        </div>
      </div>

      <!-- Sips Input -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-600 mb-1.5">Số ngụm uống liên tiếp</label>
          <div class="relative">
            <input
              type="number"
              v-model.number="customSips"
              min="1"
              max="50"
              placeholder="VD: 5"
              class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <span class="absolute right-4 top-4 text-sm font-bold text-slate-400">ngụm</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">
            Tương đương ~{{ customSips * sipMl }} ml (với {{ sipMl }} ml/ngụm)
          </p>
        </div>

        <!-- Quick sip chips -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="sips in [2, 3, 5, 8, 10]"
            :key="sips"
            @click="customSips = sips"
            class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all"
            :class="customSips === sips ? 'bg-sky-50 border-sky-300 text-sky-700' : ''"
          >
            +{{ sips }} ngụm
          </button>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-3 mt-6">
        <button
          @click="$emit('close')"
          class="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
        >
          Hủy
        </button>
        <button
          @click="submit"
          :disabled="!isValid"
          class="flex-1 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
        >
          Xác nhận
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps<{
  sipMl: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', ml: number, source: 'sip' | 'custom'): void;
}>();

const mode = ref<'ml' | 'sip'>('ml');
const customMl = ref<number>(200);
const customSips = ref<number>(5);

const isValid = computed(() => {
  if (mode.value === 'ml') {
    return customMl.value > 0;
  }
  return customSips.value > 0;
});

function submit() {
  if (!isValid.value) return;

  if (mode.value === 'ml') {
    emit('submit', customMl.value, 'custom');
  } else {
    const ml = customSips.value * props.sipMl;
    emit('submit', ml, 'sip');
  }
  emit('close');
}
</script>

