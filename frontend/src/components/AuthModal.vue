<template>
  <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
    <div class="bg-white w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col pb-safe sm:pb-6 animate-in slide-in-from-bottom-8 duration-200">
      
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <UserCircle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-black text-slate-800">Tài khoản & Lưu trữ</h3>
            <p class="text-xs text-slate-400">Chọn lưu Local trên máy hoặc lưu Cloud</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-95"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto space-y-4 py-4 pr-1">

        <!-- When User is Logged In -->
        <div v-if="currentUser" class="space-y-4">
          <div class="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-indigo-900">Chế độ hiện tại</span>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                ☁️ Đang đồng bộ Cloud
              </span>
            </div>
            <p class="text-sm font-black text-slate-800">
              Tài khoản: <span class="text-indigo-600">{{ currentUser.username }}</span>
            </p>
            <p class="text-xs text-slate-500 font-medium leading-relaxed">
              Dữ liệu uống nước, sự kiện và lịch nhắc nhở của bạn được sao lưu và đồng bộ tự động 24/7 trên máy chủ đám mây.
            </p>
          </div>

          <div class="space-y-2">
            <button
              type="button"
              @click="$emit('logout')"
              class="w-full py-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <LogOut class="w-4 h-4" />
              <span>Đăng xuất (Chuyển về chế độ Lưu trên máy)</span>
            </button>
          </div>
        </div>

        <!-- When in Local Mode -->
        <div v-else class="space-y-4">
          <!-- Mode Choice Info Banner -->
          <div class="grid grid-cols-2 gap-2 text-left">
            <div
              @click="activeModeTab = 'local'"
              class="p-3 rounded-2xl border transition-all cursor-pointer"
              :class="activeModeTab === 'local' ? 'border-sky-500 bg-sky-50/70 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'"
            >
              <div class="flex items-center gap-1.5 mb-1 text-sky-700 font-bold text-xs">
                <Smartphone class="w-4 h-4" />
                <span>1. Lưu Local</span>
              </div>
              <p class="text-[10px] text-slate-500 font-medium leading-tight">
                Lưu trên thiết bị này, dùng ngay không cần đăng nhập.
              </p>
            </div>

            <div
              @click="activeModeTab = 'cloud'"
              class="p-3 rounded-2xl border transition-all cursor-pointer"
              :class="activeModeTab === 'cloud' ? 'border-indigo-500 bg-indigo-50/70 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'"
            >
              <div class="flex items-center gap-1.5 mb-1 text-indigo-700 font-bold text-xs">
                <Cloud class="w-4 h-4" />
                <span>2. Lưu Tài khoản</span>
              </div>
              <p class="text-[10px] text-slate-500 font-medium leading-tight">
                Đồng bộ đa thiết bị (iPhone, iPad, PC) an toàn.
              </p>
            </div>
          </div>

          <!-- If Local Tab is picked -->
          <div v-if="activeModeTab === 'local'" class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div class="flex items-center gap-2 text-slate-700 font-bold text-xs">
              <CheckCircle class="w-4 h-4 text-emerald-500" />
              <span>Bạn đang ở chế độ Lưu trên máy này (Local)</span>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Mọi lịch sử uống nước, mục tiêu và sự kiện được lưu trong bộ nhớ máy. Khi muốn đổi sang điện thoại hoặc máy khác, bạn có thể tạo tài khoản bất kỳ lúc nào để chuyển dữ liệu lên mây!
            </p>
            <button
              type="button"
              @click="$emit('close')"
              class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all active:scale-95"
            >
              Tiếp tục sử dụng trên máy này
            </button>
          </div>

          <!-- If Cloud Tab is picked: Login / Register Form -->
          <div v-if="activeModeTab === 'cloud'" class="space-y-3">
            <!-- Sub tabs: Login vs Register -->
            <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                @click="authTab = 'login'"
                class="flex-1 py-1.5 rounded-lg transition-all"
                :class="authTab === 'login' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                @click="authTab = 'register'"
                class="flex-1 py-1.5 rounded-lg transition-all"
                :class="authTab === 'register' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
              >
                Tạo tài khoản mới
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Tên tài khoản</label>
                <input
                  type="text"
                  v-model="username"
                  required
                  placeholder="VD: hieu24, watermate..."
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  v-model="password"
                  required
                  placeholder="Nhập mật khẩu..."
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <!-- Sync checkbox -->
              <label class="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="shouldSyncLocal"
                  class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span class="text-[11px] font-medium text-slate-600 leading-tight">
                  Tải và đồng bộ dữ liệu hiện tại từ máy này lên tài khoản sau khi đăng nhập.
                </span>
              </label>

              <!-- Error message -->
              <div v-if="errorMessage" class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {{ errorMessage }}
              </div>

              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span v-if="isLoading">Đang xử lý...</span>
                <span v-else>{{ authTab === 'login' ? 'Đăng nhập vào tài khoản' : 'Đăng ký tài khoản mới' }}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-[10px] text-slate-400 font-medium">WaterMate • Lưu trữ an toàn & linh hoạt</span>
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
import { ref } from 'vue';
import type { User } from '../types';
import { UserCircle, X, LogOut, Smartphone, Cloud, CheckCircle } from 'lucide-vue-next';

const props = defineProps<{
  currentUser: User | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'login', data: { username: string; password: string; syncLocal: boolean }): void;
  (e: 'register', data: { username: string; password: string; syncLocal: boolean }): void;
  (e: 'logout'): void;
}>();

const activeModeTab = ref<'local' | 'cloud'>(props.currentUser ? 'cloud' : 'cloud');
const authTab = ref<'login' | 'register'>('login');
const username = ref('');
const password = ref('');
const shouldSyncLocal = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');

function handleSubmit() {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!';
    return;
  }
  errorMessage.value = '';
  isLoading.value = true;

  const payload = {
    username: username.value.trim(),
    password: password.value,
    syncLocal: shouldSyncLocal.value,
  };

  if (authTab.value === 'login') {
    emit('login', payload);
  } else {
    emit('register', payload);
  }

  // Reset loading after dispatch
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
}
</script>

