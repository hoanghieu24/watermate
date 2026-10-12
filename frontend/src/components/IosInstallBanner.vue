<template>
  <div
    v-if="showBanner"
    class="bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-3xl p-4.5 p-4 shadow-lg border border-sky-400/30 relative overflow-hidden transition-all"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
          <Smartphone class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-sm font-black leading-tight">Cài đặt WaterMate lên iPhone</h3>
          <p class="text-xs text-sky-100 mt-0.5 leading-snug">
            Cần thêm vào Màn hình chính để nhận Web Push khi tắt ứng dụng
          </p>
        </div>
      </div>

      <button
        @click="dismiss"
        class="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 transition-all"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- 3 Steps Guide -->
    <div class="mt-3.5 pt-3 border-t border-white/15 grid grid-cols-3 gap-2 text-center">
      <div class="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
        <span class="text-[10px] font-bold text-sky-200 block">Bước 1</span>
        <div class="my-1 flex justify-center">
          <Share class="w-4 h-4 text-white" />
        </div>
        <span class="text-[10px] font-semibold leading-tight block">Bấm 'Chia sẻ'</span>
      </div>

      <div class="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
        <span class="text-[10px] font-bold text-sky-200 block">Bước 2</span>
        <div class="my-1 flex justify-center">
          <PlusSquare class="w-4 h-4 text-white" />
        </div>
        <span class="text-[10px] font-semibold leading-tight block">Thêm vào MH chính</span>
      </div>

      <div class="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
        <span class="text-[10px] font-bold text-sky-200 block">Bước 3</span>
        <div class="my-1 flex justify-center">
          <Bell class="w-4 h-4 text-white" />
        </div>
        <span class="text-[10px] font-semibold leading-tight block">Bật nhận thông báo</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Smartphone, Share, PlusSquare, Bell, X } from 'lucide-vue-next';

const showBanner = ref(false);

onMounted(() => {
  // Check if running on iOS and not in standalone mode
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  const isDismissed = localStorage.getItem('watermate_ios_banner_dismissed') === 'true';

  if (!isStandalone && !isDismissed && (isIos || window.innerWidth <= 768)) {
    // Show banner on iOS Safari or mobile view to guide Home Screen install
    showBanner.value = true;
  }
});

function dismiss() {
  showBanner.value = false;
  localStorage.setItem('watermate_ios_banner_dismissed', 'true');
}
</script>
