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
            <p class="text-xs text-slate-400">Tùy chỉnh thông báo & lưu trữ</p>
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

        <!-- Storage Mode & Account Banner -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-slate-200 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-xl flex items-center justify-center"
              :class="currentUser ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'"
            >
              <Cloud v-if="currentUser" class="w-4 h-4" />
              <Smartphone v-else class="w-4 h-4" />
            </div>
            <div>
              <p class="text-xs font-black text-slate-800 flex items-center gap-1">
                {{ currentUser ? `Tài khoản: ${currentUser.username}` : 'Lưu trên máy này (Local)' }}
              </p>
              <p class="text-[10px] text-slate-400">
                {{ currentUser ? 'Đang đồng bộ Cloud đa thiết bị' : 'Chưa đăng nhập • Dữ liệu lưu offline' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="$emit('open-auth')"
            class="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-indigo-700 font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            {{ currentUser ? 'Tài khoản' : 'Đăng nhập' }}
          </button>
        </div>

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

        <!-- Section 2: 3 DISTINCT REMINDER FEATURES -->
        <div class="space-y-4 pt-2 border-t border-slate-100">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Bell class="w-3.5 h-3.5 text-sky-600" />
              Quản lý các loại thông báo
            </h4>
          </div>

          <!-- ================= REMINDER 1: WATER REMINDERS ================= -->
          <div class="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                  <Droplet class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-bold text-slate-800">1. Thông báo uống nước</h5>
                  <p class="text-[10px] text-slate-400">Nhắc định kỳ và tự động cộng ngụm</p>
                </div>
              </div>

              <!-- Toggle -->
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formSettings.water_enabled" class="sr-only peer" />
                <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            <!-- Details when water reminder is enabled -->
            <div v-if="formSettings.water_enabled" class="space-y-3 pt-2 border-t border-sky-100/70">
              <!-- Time Window -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    v-model="formSettings.start_time"
                    class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    v-model="formSettings.end_time"
                    class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <!-- Interval -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1.5">Khoảng cách nhắc</label>
                <div class="grid grid-cols-6 gap-1">
                  <button
                    v-for="mins in [10, 15, 30, 45, 60, 90]"
                    :key="mins"
                    type="button"
                    @click="formSettings.interval_minutes = mins"
                    class="py-1.5 text-[10px] font-bold rounded-xl border transition-all"
                    :class="formSettings.interval_minutes === mins ? 'bg-sky-500 text-white border-sky-500 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                  >
                    {{ mins }}p
                  </button>
                </div>
              </div>

              <!-- Quiet Hours -->
              <div class="bg-white/80 p-2.5 rounded-xl border border-sky-100 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-slate-700">Khung giờ yên tĩnh (Không nhắc)</span>
                  <input type="checkbox" v-model="formSettings.quiet_hours_enabled" class="rounded text-sky-600 focus:ring-sky-500" />
                </div>
                <div v-if="formSettings.quiet_hours_enabled" class="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label class="text-[9px] text-slate-400 block mb-0.5">Từ</label>
                    <input type="time" v-model="formSettings.quiet_start_time" class="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-bold text-slate-800" />
                  </div>
                  <div>
                    <label class="text-[9px] text-slate-400 block mb-0.5">Đến</label>
                    <input type="time" v-model="formSettings.quiet_end_time" class="w-full bg-white border border-slate-200 rounded-lg p-1 text-[11px] font-bold text-slate-800" />
                  </div>
                </div>
              </div>

              <!-- Notification Message -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Lời nhắc uống nước</label>
                <input
                  type="text"
                  v-model="formSettings.notification_message"
                  class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <!-- Pause Options -->
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="$emit('pause', 60)"
                  class="flex-1 py-1 text-[10px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  Tạm dừng 1h
                </button>
                <button
                  type="button"
                  @click="$emit('pause', 120)"
                  class="flex-1 py-1 text-[10px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95"
                >
                  Tạm dừng 2h
                </button>
                <button
                  v-if="formSettings.paused_until"
                  type="button"
                  @click="$emit('resume')"
                  class="flex-1 py-1 text-[10px] font-bold bg-amber-500 text-white rounded-lg active:scale-95"
                >
                  Bỏ tạm dừng
                </button>
              </div>
            </div>
          </div>

          <!-- ================= REMINDER 2: EVENT REMINDERS ================= -->
          <div class="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <CalendarDays class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-bold text-slate-800">2. Thông báo nhắc nhở lịch</h5>
                  <p class="text-[10px] text-slate-400">Nhắc trước 2-3 ngày & đúng ngày diễn ra</p>
                </div>
              </div>

              <!-- Toggle -->
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formSettings.event_enabled" class="sr-only peer" />
                <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <!-- Details when event reminder is enabled -->
            <div v-if="formSettings.event_enabled" class="space-y-2.5 pt-2 border-t border-purple-100/70">
              <!-- Auto delete toggle ("Khi nào xong tự xoá") -->
              <div class="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between">
                <div>
                  <label class="text-xs font-bold text-purple-900 block">Khi nào xong tự xoá</label>
                  <span class="text-[10px] text-slate-400">Tự động dọn dẹp khi bạn tích hoàn thành hoặc sự kiện đã qua</span>
                </div>
                <input
                  type="checkbox"
                  v-model="formSettings.event_auto_delete"
                  class="rounded text-purple-600 focus:ring-purple-500"
                />
              </div>

              <button
                type="button"
                @click="$emit('open-events')"
                class="w-full py-2 rounded-xl bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <CalendarDays class="w-3.5 h-3.5" />
                <span>Mở quản lý danh sách sự kiện</span>
              </button>
            </div>
          </div>

          <!-- ================= REMINDER 3: TRASH REMINDER ================= -->
          <div class="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Trash2 class="w-4 h-4" />
                </div>
                <div>
                  <h5 class="text-xs font-bold text-slate-800">3. Thông báo lịch đổ rác</h5>
                  <p class="text-[10px] text-slate-400">Nhắc đổ rác theo ngày (chẵn, lẻ, chu kỳ hoặc ngày trong tháng)</p>
                </div>
              </div>

              <!-- Toggle -->
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="formSettings.trash_enabled" class="sr-only peer" />
                <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <!-- Details when trash reminder is enabled -->
            <div v-if="formSettings.trash_enabled" class="space-y-3 pt-2 border-t border-emerald-100/70">
              
              <!-- Quick Presets -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1.5">Chọn nhanh lịch nhắc theo ngày:</label>
                <div class="grid grid-cols-3 gap-1.5 mb-1.5">
                  <button
                    type="button"
                    @click="applyTrashPreset('every_day')"
                    class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all text-center"
                    :class="trashPreset === 'every_day' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    Mỗi ngày
                  </button>
                  <button
                    type="button"
                    @click="applyTrashPreset('every_2_days')"
                    class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all text-center"
                    :class="trashPreset === 'every_2_days' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    2 ngày / lần
                  </button>
                  <button
                    type="button"
                    @click="applyTrashPreset('every_3_days')"
                    class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all text-center"
                    :class="trashPreset === 'every_3_days' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    3 ngày / lần
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    @click="applyTrashPreset('even')"
                    class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all text-center"
                    :class="trashPreset === 'even' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    Ngày chẵn (2, 4, 6...)
                  </button>
                  <button
                    type="button"
                    @click="applyTrashPreset('odd')"
                    class="py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all text-center"
                    :class="trashPreset === 'odd' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                  >
                    Ngày lẻ (1, 3, 5...)
                  </button>
                </div>
              </div>

              <!-- Days of Month Grid (1 to 31) -->
              <div class="bg-white/80 p-2.5 rounded-2xl border border-emerald-100 space-y-1.5">
                <div class="flex items-center justify-between text-[10px] font-bold text-slate-600">
                  <span>Hoặc chọn ngày cụ thể trong tháng (1 - 31):</span>
                  <span class="text-emerald-700 font-extrabold">{{ selectedTrashDays.length }} ngày</span>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <button
                    v-for="d in 31"
                    :key="d"
                    type="button"
                    @click="toggleTrashDay(d)"
                    class="w-full h-7 rounded-lg text-[10px] font-extrabold border transition-all flex items-center justify-center"
                    :class="selectedTrashDays.includes(d)
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                  >
                    {{ d }}
                  </button>
                </div>
                <p class="text-[10px] text-slate-500 font-medium italic pt-0.5">
                  {{ trashDaysSummaryText }}
                </p>
              </div>

              <!-- Time of day -->
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-slate-600 mb-1">Giờ nhắc đổ rác</label>
                  <input
                    type="time"
                    v-model="formSettings.trash_time"
                    class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div class="flex items-end">
                  <button
                    type="button"
                    @click="$emit('test-trash', formSettings.trash_message)"
                    class="w-full py-2 px-2 rounded-xl bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-[10px] font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Send class="w-3 h-3" />
                    <span>Test báo đổ rác</span>
                  </button>
                </div>
              </div>

              <!-- Trash message -->
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Nội dung thông báo đổ rác</label>
                <input
                  type="text"
                  v-model="formSettings.trash_message"
                  placeholder="🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ nhé."
                  class="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          <!-- ================= REMINDER 4: CUSTOM TEST NOTIFICATION ================= -->
          <div class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2.5">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                <MessageSquarePlus class="w-4 h-4" />
              </div>
              <div>
                <h5 class="text-xs font-bold text-slate-800">4. Test thông báo (Tự ghi nội dung)</h5>
                <p class="text-[10px] text-slate-500">Nhập nội dung bất kỳ và ấn gửi để nhận thông báo ngay</p>
              </div>
            </div>

            <div class="space-y-2 pt-1">
              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Tiêu đề thông báo (tùy chọn)</label>
                <input
                  type="text"
                  v-model="customTestTitle"
                  placeholder="WaterMate - Thông báo! 🔔"
                  class="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-600 mb-1">Nội dung thông báo tự ghi</label>
                <textarea
                  v-model="customTestMessage"
                  rows="2"
                  placeholder="Nhập nội dung bạn muốn hiển thị trên thông báo..."
                  class="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-400 resize-none"
                  @keydown.ctrl.enter="triggerCustomTest"
                ></textarea>
              </div>

              <button
                type="button"
                @click="triggerCustomTest"
                class="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Send class="w-3.5 h-3.5" />
                <span>Ấn Test Thông Báo Ngay</span>
              </button>
            </div>
          </div>

          <!-- Web Push status & Global trigger -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-700">Trạng thái Web Push</span>
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
                class="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <BellRing class="w-3.5 h-3.5" />
                <span>{{ isPushSubscribed ? 'Cập nhật Push' : 'Kích hoạt Web Push' }}</span>
              </button>

              <button
                type="button"
                @click="$emit('test-push')"
                class="py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <Send class="w-3.5 h-3.5" />
                <span>Test uống nước</span>
              </button>
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
import { ref, computed } from 'vue';
import type { UserPreferences, ReminderSettings, User } from '../types';
import {
  Settings,
  Target,
  Bell,
  BellRing,
  Send,
  X,
  Droplet,
  CalendarDays,
  Trash2,
  Cloud,
  Smartphone,
  MessageSquarePlus
} from 'lucide-vue-next';

const props = defineProps<{
  preferences: UserPreferences;
  settings: ReminderSettings;
  isPushSubscribed: boolean;
  currentUser?: User | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save-prefs', prefs: Partial<UserPreferences>): void;
  (e: 'save-settings', settings: Partial<ReminderSettings>): void;
  (e: 'pause', minutes: number): void;
  (e: 'resume'): void;
  (e: 'request-push'): void;
  (e: 'test-push'): void;
  (e: 'test-trash', message?: string): void;
  (e: 'test-custom', payload: { title?: string; message: string }): void;
  (e: 'open-auth'): void;
  (e: 'open-events'): void;
}>();

const customTestTitle = ref('WaterMate - Thông báo! 🔔');
const customTestMessage = ref('');

function triggerCustomTest() {
  emit('test-custom', {
    title: customTestTitle.value,
    message: customTestMessage.value,
  });
}

const formPrefs = ref<UserPreferences>({ ...props.preferences });
const formSettings = ref<ReminderSettings>({
  ...props.settings,
  water_enabled: props.settings.water_enabled !== undefined ? props.settings.water_enabled : props.settings.enabled,
  event_enabled: props.settings.event_enabled !== undefined ? props.settings.event_enabled : true,
  event_auto_delete: props.settings.event_auto_delete !== undefined ? props.settings.event_auto_delete : true,
  trash_enabled: props.settings.trash_enabled !== undefined ? props.settings.trash_enabled : false,
  trash_days: props.settings.trash_days || '1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31',
  trash_mode: props.settings.trash_mode || 'days_of_month',
  trash_interval_days: props.settings.trash_interval_days || 1,
  trash_time: props.settings.trash_time || '19:00',
  trash_message: props.settings.trash_message || '🗑️ Đến giờ đổ rác rồi! Gom rác mang đi đổ để nhà sạch sẽ nhé.',
});

// Selected trash days helper (days of month 1 to 31)
const selectedTrashDays = ref<number[]>(
  (formSettings.value.trash_days || '1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31')
    .split(',')
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 1 && n <= 31)
);

const trashPreset = ref<'every_day' | 'every_2_days' | 'every_3_days' | 'even' | 'odd' | 'custom'>('custom');

// Detect initial preset
if (selectedTrashDays.value.length === 31) {
  trashPreset.value = 'every_day';
} else if (selectedTrashDays.value.length === 15 && selectedTrashDays.value.every(d => d % 2 === 0)) {
  trashPreset.value = 'even';
} else if (selectedTrashDays.value.length === 16 && selectedTrashDays.value.every(d => d % 2 === 1)) {
  trashPreset.value = 'odd';
}

function applyTrashPreset(preset: 'every_day' | 'every_2_days' | 'every_3_days' | 'even' | 'odd') {
  trashPreset.value = preset;
  if (preset === 'every_day') {
    selectedTrashDays.value = Array.from({ length: 31 }, (_, i) => i + 1);
    formSettings.value.trash_mode = 'interval';
    formSettings.value.trash_interval_days = 1;
  } else if (preset === 'every_2_days') {
    selectedTrashDays.value = Array.from({ length: 31 }, (_, i) => i + 1).filter(n => n % 2 === 1);
    formSettings.value.trash_mode = 'interval';
    formSettings.value.trash_interval_days = 2;
  } else if (preset === 'every_3_days') {
    selectedTrashDays.value = Array.from({ length: 31 }, (_, i) => i + 1).filter(n => n % 3 === 1);
    formSettings.value.trash_mode = 'interval';
    formSettings.value.trash_interval_days = 3;
  } else if (preset === 'even') {
    selectedTrashDays.value = Array.from({ length: 31 }, (_, i) => i + 1).filter(n => n % 2 === 0);
    formSettings.value.trash_mode = 'days_of_month';
  } else if (preset === 'odd') {
    selectedTrashDays.value = Array.from({ length: 31 }, (_, i) => i + 1).filter(n => n % 2 === 1);
    formSettings.value.trash_mode = 'days_of_month';
  }
  formSettings.value.trash_days = selectedTrashDays.value.join(',');
}

function toggleTrashDay(dayVal: number) {
  trashPreset.value = 'custom';
  if (selectedTrashDays.value.includes(dayVal)) {
    if (selectedTrashDays.value.length > 1) {
      selectedTrashDays.value = selectedTrashDays.value.filter((d) => d !== dayVal);
    }
  } else {
    selectedTrashDays.value = [...selectedTrashDays.value, dayVal].sort((a, b) => a - b);
  }
  formSettings.value.trash_mode = 'days_of_month';
  formSettings.value.trash_days = selectedTrashDays.value.join(',');
}

const trashDaysSummaryText = computed(() => {
  if (selectedTrashDays.value.length === 31) return '🔔 Sẽ nhắc đổ rác hằng ngày.';
  if (selectedTrashDays.value.length === 15 && selectedTrashDays.value.every(d => d % 2 === 0)) return '🔔 Sẽ nhắc vào các ngày chẵn trong tháng.';
  if (selectedTrashDays.value.length === 16 && selectedTrashDays.value.every(d => d % 2 === 1)) return '🔔 Sẽ nhắc vào các ngày lẻ trong tháng.';
  return `🔔 Sẽ nhắc vào ${selectedTrashDays.value.length} ngày trong tháng: ${selectedTrashDays.value.join(', ')}.`;
});

function save() {
  formSettings.value.trash_days = selectedTrashDays.value.join(',');
  formSettings.value.enabled = Boolean(formSettings.value.water_enabled);
  emit('save-prefs', formPrefs.value);
  emit('save-settings', formSettings.value);
  emit('close');
}
</script>
