<template>
  <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
    <div class="bg-white w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col pb-safe sm:pb-6 animate-in slide-in-from-bottom-8 duration-200">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <Settings class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-black text-slate-800">Cài đặt WaterMate</h3>
            <p class="text-xs text-slate-400">Tùy chỉnh mục tiêu & nhắc nhở</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
        <!-- Section 1: User & Daily Goals -->
        <div class="space-y-3">
          <h4 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target class="w-3.5 h-3.5" />
            Mục tiêu & Quy đổi
          </h4>

          <!-- Daily Goal -->
          <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-700">Mục tiêu hằng ngày</label>
              <span class="text-xs font-extrabold text-sky-600">{{ formPrefs.daily_goal_ml }} ml</span>
            </div>
            <input
              type="range"
              v-model.number="formPrefs.daily_goal_ml"
              min="1000"
              max="4500"
              step="100"
              class="w-full accent-sky-500 cursor-pointer"
            />
            <div class="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1.000 ml</span>
              <span>2.000 ml (chuẩn)</span>
              <span>4.500 ml</span>
            </div>
          </div>

          <!-- Sip size -->
          <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div class="flex items-center justify-between mb-1.5">
              <div>
                <label class="text-xs font-bold text-slate-700 block">Dung tích 1 ngụm</label>
                <span class="text-[10px] text-slate-400">Ước tính một ngụm phồng miệng</span>
              </div>
              <div class="flex items-center gap-1">
                <input
                  type="number"
                  v-model.number="formPrefs.sip_ml"
                  min="20"
                  max="150"
                  class="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-right text-slate-800"
                />
                <span class="text-xs font-bold text-slate-500">ml</span>
              </div>
            </div>
          </div>

          <!-- Cup size -->
          <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div class="flex items-center justify-between mb-1.5">
              <div>
                <label class="text-xs font-bold text-slate-700 block">Dung tích 1 cốc mẫu</label>
                <span class="text-[10px] text-slate-400">1 cốc = {{ formPrefs.cup_ml }}ml, 1/2 cốc = {{ Math.round(formPrefs.cup_ml/2) }}ml</span>
              </div>
              <div class="flex items-center gap-1">
                <input
                  type="number"
                  v-model.number="formPrefs.cup_ml"
                  min="200"
                  max="1000"
                  class="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-right text-slate-800"
                />
                <span class="text-xs font-bold text-slate-500">ml</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Reminders & Web Push -->
        <div class="space-y-3 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bell class="w-3.5 h-3.5" />
              Lịch nhắc uống nước (Web Push)
            </h4>

            <!-- Toggle reminder -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="formSettings.enabled" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
            </label>
          </div>

          <div v-if="formSettings.enabled" class="space-y-3">
            <!-- Time Window -->
            <div class="grid grid-cols-2 gap-2.5">
              <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label class="block text-[11px] font-bold text-slate-500 mb-1">Giờ bắt đầu</label>
                <input
                  type="time"
                  v-model="formSettings.start_time"
                  class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-800"
                />
              </div>

              <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label class="block text-[11px] font-bold text-slate-500 mb-1">Giờ kết thúc</label>
                <input
                  type="time"
                  v-model="formSettings.end_time"
                  class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            <!-- Interval -->
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <label class="block text-xs font-bold text-slate-700 mb-2">Khoảng cách nhắc</label>
              <div class="grid grid-cols-5 gap-1.5">
                <button
                  v-for="mins in [15, 30, 45, 60, 90]"
                  :key="mins"
                  type="button"
                  @click="formSettings.interval_minutes = mins"
                  class="py-2 text-xs font-bold rounded-xl border transition-all"
                  :class="formSettings.interval_minutes === mins ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                >
                  {{ mins }}p
                </button>
              </div>
            </div>

            <!-- Quiet Hours (Không nhắc từ mấy giờ đến mấy giờ) -->
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <label class="text-xs font-bold text-slate-800 block">Không nhắc từ mấy giờ đến mấy giờ</label>
                  <span class="text-[10px] text-slate-400">Tắt thông báo trong khoảng thời gian này</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="formSettings.quiet_hours_enabled" class="sr-only peer" />
                  <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              <!-- Quiet Time Range Input -->
              <div v-if="formSettings.quiet_hours_enabled" class="space-y-2.5 pt-2 border-t border-slate-200/50">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-1">Từ mấy giờ (Bắt đầu tắt)</label>
                    <input
                      type="time"
                      v-model="formSettings.quiet_start_time"
                      class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-slate-600 mb-1">Đến mấy giờ (Bật lại)</label>
                    <input
                      type="time"
                      v-model="formSettings.quiet_end_time"
                      class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <!-- Quick Presets -->
                <div class="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    @click="formSettings.quiet_start_time = '12:00'; formSettings.quiet_end_time = '13:30'"
                    class="flex-1 py-1 px-1.5 text-[10px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all"
                  >
                    Nghỉ trưa (12h-13h30)
                  </button>
                  <button
                    type="button"
                    @click="formSettings.quiet_start_time = '22:00'; formSettings.quiet_end_time = '07:00'"
                    class="flex-1 py-1 px-1.5 text-[10px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-sky-50 hover:text-sky-600 active:scale-95 transition-all"
                  >
                    Ngủ đêm (22h-7h)
                  </button>
                </div>
              </div>
            </div>

            <!-- Notification Message -->
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <label class="block text-xs font-bold text-slate-700 mb-1">Nội dung thông báo nhắc</label>
              <textarea
                v-model="formSettings.notification_message"
                rows="2"
                class="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              ></textarea>
            </div>

            <!-- Pause Options -->
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <label class="block text-xs font-bold text-slate-700 mb-2">Tạm dừng nhắc</label>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="$emit('pause', 60)"
                  class="flex-1 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  1 Giờ
                </button>
                <button
                  type="button"
                  @click="$emit('pause', 120)"
                  class="flex-1 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  2 Giờ
                </button>
                <button
                  v-if="formSettings.paused_until"
                  type="button"
                  @click="$emit('resume')"
                  class="flex-1 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600 active:scale-95 transition-all"
                >
                  Bỏ tạm dừng
                </button>
              </div>
            </div>

            <!-- Web Push Actions -->
            <div class="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-sky-900">Trạng thái Web Push</span>
                <span
                  class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  :class="isPushSubscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                >
                  {{ isPushSubscribed ? 'Đã kích hoạt' : 'Chưa bật' }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="$emit('request-push')"
                  class="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <BellRing class="w-3.5 h-3.5" />
                  <span>{{ isPushSubscribed ? 'Cập nhật Push' : 'Kích hoạt Web Push' }}</span>
                </button>

                <button
                  type="button"
                  @click="$emit('test-push')"
                  class="py-2.5 px-3 rounded-xl bg-white border border-sky-200 hover:bg-sky-50 text-sky-700 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <Send class="w-3.5 h-3.5" />
                  <span>Test Push</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-3 border-t border-slate-100 flex items-center gap-3">
        <button
          @click="$emit('close')"
          class="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
        >
          Đóng
        </button>
        <button
          @click="save"
          class="flex-1 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
        >
          Lưu cài đặt
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UserPreferences, ReminderSettings } from '../types';
import { Settings, Target, Bell, BellRing, Send, X } from 'lucide-vue-next';

const props = defineProps<{
  preferences: UserPreferences;
  settings: ReminderSettings;
  isPushSubscribed: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save-prefs', prefs: Partial<UserPreferences>): void;
  (e: 'save-settings', settings: Partial<ReminderSettings>): void;
  (e: 'pause', minutes: number): void;
  (e: 'resume'): void;
  (e: 'request-push'): void;
  (e: 'test-push'): void;
}>();

const formPrefs = ref<UserPreferences>({ ...props.preferences });
const formSettings = ref<ReminderSettings>({ ...props.settings });

function save() {
  emit('save-prefs', formPrefs.value);
  emit('save-settings', formSettings.value);
  emit('close');
}
</script>

