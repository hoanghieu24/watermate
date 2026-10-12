import { ref, computed, watch } from 'vue';
import type { WaterLog, UserPreferences, DaySummary } from '../types';
import { getTodayLocalDate } from '../utils/date';
import confetti from 'canvas-confetti';

const STORAGE_KEYS = {
  LOGS: 'watermate_logs',
  PREFS: 'watermate_prefs',
  LAST_UNDO: 'watermate_last_undo',
};

const defaultPreferences: UserPreferences = {
  daily_goal_ml: 2000,
  sip_ml: 50,
  cup_ml: 450,
  user_name: 'Bạn',
};

// Global state so state is shared between components
const logs = ref<WaterLog[]>([]);
const preferences = ref<UserPreferences>({ ...defaultPreferences });
const currentDate = ref<string>(getTodayLocalDate());
const isLoaded = ref<boolean>(false);
const lastRemovedLog = ref<WaterLog | null>(null);
const celebratedDates = ref<Set<string>>(new Set());

// Load from LocalStorage
function loadFromStorage() {
  try {
    const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (savedPrefs) {
      preferences.value = { ...defaultPreferences, ...JSON.parse(savedPrefs) };
    }

    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (savedLogs) {
      logs.value = JSON.parse(savedLogs);
    }
  } catch (err) {
    console.error('Failed to load local storage:', err);
  } finally {
    isLoaded.value = true;
  }
}

// Save to LocalStorage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(preferences.value));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.value));
  } catch (err) {
    console.error('Failed to save to local storage:', err);
  }
}

export function useWaterTracker() {
  if (!isLoaded.value) {
    loadFromStorage();
  }

  // Watch and persist
  watch([preferences, logs], () => {
    saveToStorage();
  }, { deep: true });

  // Today's logs
  const todayDate = computed(() => getTodayLocalDate());

  // Logs for current viewed date
  const currentDayLogs = computed(() => {
    return logs.value
      .filter(log => log.local_date === currentDate.value)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });

  // Today's total ml
  const currentDayTotalMl = computed(() => {
    return currentDayLogs.value.reduce((acc, log) => acc + log.amount_ml, 0);
  });

  // Equivalent sips for current day
  const currentDaySips = computed(() => {
    const sipUnit = preferences.value.sip_ml || 50;
    // Calculated as total ml / sip_ml, rounded to 1 decimal if fraction, or exact
    const sips = currentDayTotalMl.value / sipUnit;
    return Number.isInteger(sips) ? sips : Number(sips.toFixed(1));
  });

  // Daily goal
  const dailyGoal = computed(() => preferences.value.daily_goal_ml || 2000);

  // Percentage complete (capped at 100 for basic bar, but true value for display)
  const percentage = computed(() => {
    if (dailyGoal.value <= 0) return 0;
    return Math.round((currentDayTotalMl.value / dailyGoal.value) * 100);
  });

  // Progress percentage capped at 100 for progress ring/bar width
  const progressPercent = computed(() => {
    return Math.min(100, Math.max(0, percentage.value));
  });

  // Remaining ml
  const remainingMl = computed(() => {
    const rem = dailyGoal.value - currentDayTotalMl.value;
    return Math.max(0, rem);
  });

  // Trigger celebration if reached goal
  function checkCelebration() {
    if (percentage.value >= 100 && !celebratedDates.value.has(currentDate.value)) {
      celebratedDates.value.add(currentDate.value);
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#38bdf8', '#0284c7', '#0ea5e9', '#67e8f9']
        });
      } catch {
        // ignore if confetti fails
      }
    }
  }

  // Add water record
  function addWater(amount_ml: number, source: WaterLog['source'] = 'custom') {
    if (amount_ml <= 0) return null;

    const sipUnit = preferences.value.sip_ml || 50;
    const now = new Date();
    const newLog: WaterLog = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount_ml: Math.round(amount_ml),
      sip_equivalent: Number((amount_ml / sipUnit).toFixed(1)),
      source,
      created_at: now.toISOString(),
      local_date: getTodayLocalDate(now),
    };

    logs.value.unshift(newLog);
    lastRemovedLog.value = null; // reset undo stack
    checkCelebration();
    return newLog;
  }

  // Quick actions
  function addOneSip() {
    return addWater(preferences.value.sip_ml, 'sip');
  }

  function addHalfCup() {
    const halfCup = Math.round(preferences.value.cup_ml / 2);
    return addWater(halfCup, 'half_cup');
  }

  function addFullCup() {
    return addWater(preferences.value.cup_ml, 'full_cup');
  }

  function addMultipleSips(count: number) {
    if (count <= 0) return;
    const ml = count * preferences.value.sip_ml;
    return addWater(ml, 'sip');
  }

  // Delete a specific log
  function deleteLog(id: string | number) {
    const index = logs.value.findIndex(l => l.id === id);
    if (index !== -1) {
      lastRemovedLog.value = logs.value[index];
      logs.value.splice(index, 1);
      return true;
    }
    return false;
  }

  // Clear all logs for current viewed day
  function clearCurrentDayLogs() {
    logs.value = logs.value.filter(l => l.local_date !== currentDate.value);
    lastRemovedLog.value = null;
    saveToStorage();
  }

  // Edit a specific log
  function updateLog(id: string | number, updatedAmountMl: number) {
    if (updatedAmountMl <= 0) return false;
    const index = logs.value.findIndex(l => l.id === id);
    if (index !== -1) {
      const sipUnit = preferences.value.sip_ml || 50;
      logs.value[index].amount_ml = Math.round(updatedAmountMl);
      logs.value[index].sip_equivalent = Number((updatedAmountMl / sipUnit).toFixed(1));
      return true;
    }
    return false;
  }

  // Undo the last added record (or restore last deleted)
  function undoLastAction(): boolean {
    // If we have a deleted item to restore
    if (lastRemovedLog.value) {
      logs.value.unshift(lastRemovedLog.value);
      lastRemovedLog.value = null;
      return true;
    }

    // Otherwise, remove the most recent log of today
    const latestTodayLog = currentDayLogs.value[0];
    if (latestTodayLog) {
      deleteLog(latestTodayLog.id);
      return true;
    }
    return false;
  }

  // History summary grouped by day
  const historySummaries = computed<DaySummary[]>(() => {
    const map = new Map<string, { total_ml: number; total_sips: number; count: number }>();
    const sipUnit = preferences.value.sip_ml || 50;

    for (const log of logs.value) {
      const cur = map.get(log.local_date) || { total_ml: 0, total_sips: 0, count: 0 };
      cur.total_ml += log.amount_ml;
      cur.total_sips += log.sip_equivalent;
      cur.count += 1;
      map.set(log.local_date, cur);
    }

    const goal = dailyGoal.value;
    const summaries: DaySummary[] = [];

    map.forEach((val, dateKey) => {
      summaries.push({
        local_date: dateKey,
        total_ml: val.total_ml,
        total_sips: Number((val.total_ml / sipUnit).toFixed(1)),
        log_count: val.count,
        percentage: Math.round((val.total_ml / goal) * 100),
      });
    });

    // Sort descending by date
    return summaries.sort((a, b) => b.local_date.localeCompare(a.local_date));
  });

  // Source label helper
  function getSourceLabel(source: WaterLog['source']): string {
    switch (source) {
      case 'sip': return 'Ngụm nước';
      case 'half_cup': return 'Nửa cốc (1/2)';
      case 'full_cup': return 'Một cốc (1 ly)';
      case 'custom': return 'Tùy chỉnh';
      default: return 'Khác';
    }
  }

  return {
    logs,
    preferences,
    currentDate,
    currentDayLogs,
    currentDayTotalMl,
    currentDaySips,
    dailyGoal,
    percentage,
    progressPercent,
    remainingMl,
    historySummaries,
    todayDate,
    lastRemovedLog,
    addWater,
    addOneSip,
    addHalfCup,
    addFullCup,
    addMultipleSips,
    deleteLog,
    clearCurrentDayLogs,
    updateLog,
    undoLastAction,
    getSourceLabel,
    setPreferences: (newPrefs: Partial<UserPreferences>) => {
      preferences.value = { ...preferences.value, ...newPrefs };
      saveToStorage();
    },
    syncBackendLogs: (backendLogs: WaterLog[]) => {
      logs.value = backendLogs;
      saveToStorage();
    }
  };
}

