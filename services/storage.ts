
import { LogEntry, WeeklyLogEntry, TodoItem } from '../types';

const DAILY_STORAGE_KEY = 'daily_craft_logs_v1';
const WEEKLY_STORAGE_KEY = 'daily_craft_weekly_logs_v1';
const TODO_STORAGE_KEY = 'daily_craft_todos_v1';

// --- ID Generator Polyfill ---
export const generateUUID = (): string => {
  // Try to use crypto.randomUUID if available (Secure Context)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if it fails
    }
  }
  
  // Fallback for non-secure contexts (http) or older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- Helper for Dates ---
const getWeekNumberFromDate = (dateObj: Date): string => {
  const date = new Date(dateObj.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

// --- Daily Logs ---

export const getLogs = (): LogEntry[] => {
  try {
    const data = localStorage.getItem(DAILY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load logs", e);
    return [];
  }
};

export const saveLog = (log: LogEntry): void => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === log.id);
  
  if (index >= 0) {
    logs[index] = log;
  } else {
    logs.unshift(log); // Add new logs to the top
  }
  
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(logs));
};

export const saveAllLogs = (logs: LogEntry[]): void => {
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(logs));
};

export const deleteLog = (id: string): void => {
  const logs = getLogs().filter(l => l.id !== id);
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(logs));
};

export const createEmptyLog = (dateStr?: string): LogEntry => ({
  id: generateUUID(),
  date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
  content: '',
  mood: {
    sentiment: 'Neutral',
    emoji: '😐',
    color: '#e2e8f0',
  },
  tags: [],
  stickers: [],
  highlights: [] // Initialize highlights
});

// --- Weekly Logs ---

export const getWeeklyLogs = (): WeeklyLogEntry[] => {
  try {
    const data = localStorage.getItem(WEEKLY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load weekly logs", e);
    return [];
  }
};

export const saveWeeklyLog = (log: WeeklyLogEntry): void => {
  const logs = getWeeklyLogs();
  const index = logs.findIndex(l => l.id === log.id);
  
  if (index >= 0) {
    logs[index] = log;
  } else {
    logs.unshift(log);
  }
  
  localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(logs));
};

export const saveAllWeeklyLogs = (logs: WeeklyLogEntry[]): void => {
  localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(logs));
};

export const deleteWeeklyLog = (id: string): void => {
  const logs = getWeeklyLogs().filter(l => l.id !== id);
  localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(logs));
};

export const createEmptyWeeklyLog = (dateStr?: string): WeeklyLogEntry => {
  const date = dateStr ? new Date(dateStr) : new Date();
  const weekString = getWeekNumberFromDate(date);

  // Calculate generic start of week (Monday) based on input date
  const day = date.getDay() || 7; 
  if(day !== 1) date.setHours(-24 * (day - 1)); 
  
  return {
    id: generateUUID(),
    weekNumber: weekString,
    weekStart: date.toISOString(),
    content: '',
    highlights: [],
    moodSummary: '',
    themeColor: '#d1fae5' // Default green for weeks
  };
};

// --- Sync Logic ---

export const syncDailyHighlightsToWeekly = (dailyLog: LogEntry, newHighlights: string[]) => {
  if (!newHighlights || newHighlights.length === 0) return;

  const logDate = new Date(dailyLog.date);
  const weekNum = getWeekNumberFromDate(logDate);
  const formattedDate = logDate.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });

  const weeklyLogs = getWeeklyLogs();
  let targetWeek = weeklyLogs.find(w => w.weekNumber === weekNum);

  // Create if not exists
  if (!targetWeek) {
    targetWeek = createEmptyWeeklyLog(dailyLog.date);
    weeklyLogs.unshift(targetWeek);
  }

  // Format lines to append: "- [MM/DD] Content"
  const linesToAdd = newHighlights.map(h => `- ${formattedDate} ${h}`);
  
  // Append only unique lines to avoid duplication on multi-save
  const currentContent = targetWeek.content || '';
  const uniqueLines = linesToAdd.filter(line => !currentContent.includes(line));

  if (uniqueLines.length > 0) {
    const prefix = currentContent ? '\n' : '';
    targetWeek.content = currentContent + prefix + uniqueLines.join('\n');
    localStorage.setItem(WEEKLY_STORAGE_KEY, JSON.stringify(weeklyLogs));
  }
};


// Helper to find logs within a week range
export const getLogsForWeek = (weekStartStr: string): LogEntry[] => {
  const allLogs = getLogs();
  const start = new Date(weekStartStr);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return allLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= start && logDate <= end;
  });
};

// --- Todos ---

export const getTodos = (): TodoItem[] => {
  try {
    const data = localStorage.getItem(TODO_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveTodos = (todos: TodoItem[]): void => {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
};

// --- Backup ---

export interface BackupData {
  dailyLogs: LogEntry[];
  weeklyLogs: WeeklyLogEntry[];
  todos: TodoItem[];
  exportDate: string;
  version: string;
}

export const getAllDataForExport = (): BackupData => {
  return {
    dailyLogs: getLogs(),
    weeklyLogs: getWeeklyLogs(),
    todos: getTodos(),
    exportDate: new Date().toISOString(),
    version: '1.2'
  };
};