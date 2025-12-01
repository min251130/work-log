
export interface LogEntry {
  id: string;
  date: string; // ISO string
  content: string;
  summary?: string;
  mood: MoodAnalysis;
  tags: string[];
  stickers: StickerData[];
  highlights: string[]; // New field for daily key events
}

export interface WeeklyLogEntry {
  id: string;
  weekStart: string; // ISO string of the Monday of the week
  weekNumber: string; // e.g. "2023-W42"
  content: string;
  highlights: string[];
  moodSummary: string;
  themeColor: string;
}

export interface MindMapEntry {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface MoodAnalysis {
  sentiment: string; // e.g., "Productive", "Stressed", "Creative"
  emoji: string;
  color: string; // Hex code
  quote?: string;
}

export interface StickerData {
  id: string;
  type: 'star' | 'heart' | 'check' | 'coffee' | 'idea' | 'tape';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
}

export interface TodoItem {
  id: string;
  task: string;
  date?: string; // YYYY-MM-DD, added for calendar sync
  time?: string;
  location?: string;
  people?: string;
  completed: boolean;
}

export interface CalendarMarker {
  date: string; // YYYY-MM-DD
  color: string;
  label: string;
}

export type ViewMode = 'list' | 'edit-daily' | 'edit-weekly' | 'edit-mindmap';
