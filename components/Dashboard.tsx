
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LogEntry, WeeklyLogEntry, CalendarMarker, TodoItem } from '../types';
import { Plus, Search, Calendar, Book, Edit2, Filter, X, LayoutGrid, List as ListIcon, GripVertical, ChevronLeft, ChevronRight, Download, Wand2, Archive, Dice5 as Dice, CheckCircle, Clock } from 'lucide-react';
import { WashiTape } from './WashiTape';
import { Sticker } from './Sticker';
import { DailyLogModal } from './DailyLogModal';
import { WeeklyLogModal } from './WeeklyLogModal';
import { getMarkers, saveMarker, deleteMarker, getWeekNumberFromDate, getTodos, saveWeeklyLog } from '../services/storage';

interface DashboardProps {
  logs: LogEntry[];
  weeklyLogs: WeeklyLogEntry[];
  onNewDaily: (date?: string) => void;
  onNewWeekly: (date?: string) => void;
  onEditDaily: (entry: LogEntry) => void;
  onEditWeekly: (entry: WeeklyLogEntry) => void;
  onReorderDaily: (logs: LogEntry[]) => void;
  onReorderWeekly: (logs: WeeklyLogEntry[]) => void;
  onExport: () => void;
  onExportAllWeekly: () => void; // New prop for exporting aggregated weekly report
  onQuickSaveDaily: (entry: LogEntry) => void;
}

// Define Dopamine Color Palette for Weeks (Rows)
const WEEK_THEMES = [
  { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200', hover: 'hover:bg-rose-200', icon: 'text-rose-500' },
  { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', hover: 'hover:bg-orange-200', icon: 'text-orange-500' },
  { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:bg-amber-200', icon: 'text-amber-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:bg-emerald-200', icon: 'text-emerald-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200', hover: 'hover:bg-cyan-200', icon: 'text-cyan-500' },
  { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', hover: 'hover:bg-blue-200', icon: 'text-blue-500' },
  { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200', hover: 'hover:bg-violet-200', icon: 'text-violet-500' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', border: 'border-fuchsia-200', hover: 'hover:bg-fuchsia-200', icon: 'text-fuchsia-500' },
];

// Define Day Headers (Columns)
const DAY_STYLES = [
  { label: 'SUN', full: 'Sunday', bg: 'bg-rose-50', text: 'text-rose-500' },
  { label: 'MON', full: 'Monday', bg: 'bg-orange-50', text: 'text-orange-500' },
  { label: 'TUE', full: 'Tuesday', bg: 'bg-amber-50', text: 'text-amber-500' },
  { label: 'WED', full: 'Wednesday', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  { label: 'THU', full: 'Thursday', bg: 'bg-cyan-50', text: 'text-cyan-500' },
  { label: 'FRI', full: 'Friday', bg: 'bg-blue-50', text: 'text-blue-500' },
  { label: 'SAT', full: 'Saturday', bg: 'bg-violet-50', text: 'text-violet-500' },
];

export const Dashboard: React.FC<DashboardProps> = ({ 
  logs, 
  weeklyLogs, 
  onNewDaily, 
  onNewWeekly, 
  onEditDaily,
  onEditWeekly,
  onReorderDaily,
  onReorderWeekly,
  onExport,
  onExportAllWeekly,
  onQuickSaveDaily
}) => {
  // Default to Calendar view as requested
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const dragType = useRef<'daily' | 'weekly' | null>(null);
  
  // New Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Calendar & Modal State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalLog, setModalLog] = useState<LogEntry | undefined>(undefined);
  
  // Weekly Modal State
  const [modalWeekNumber, setModalWeekNumber] = useState<string | null>(null);
  const [modalWeeklyLog, setModalWeeklyLog] = useState<WeeklyLogEntry | undefined>(undefined);

  // Markers & Todos State
  const [markers, setMarkers] = useState<CalendarMarker[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  // Surprise Dice State
  const [surpriseItem, setSurpriseItem] = useState<{ text: string; date: string; mood: string } | null>(null);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Refresh local data
    setMarkers(getMarkers());
    setTodos(getTodos());

    return () => clearInterval(timer);
  }, []);

  // Force refresh aux data when needed
  useEffect(() => {
    setMarkers(getMarkers());
    setTodos(getTodos());
  }, [logs, weeklyLogs]); 

  const refreshAuxData = () => {
    setMarkers(getMarkers());
    setTodos(getTodos());
  }

  // Extract unique moods for dropdown
  const uniqueMoods = useMemo(() => {
    const moods = new Set(logs.map(l => l.mood.sentiment));
    return Array.from(moods).filter(Boolean);
  }, [logs]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };
  
  const formatTimeSimple = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setSelectedMood('');
  };

  const hasActiveFilters = searchTerm || startDate || endDate || selectedMood;

  // Filter Logic for Daily Logs
  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.mood.sentiment.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
        const start = new Date(startDate).setHours(0,0,0,0);
        const current = new Date(l.date).setHours(0,0,0,0);
        matchesDate = matchesDate && current >= start;
    }
    if (endDate) {
        const end = new Date(endDate).setHours(23,59,59,999);
        const current = new Date(l.date).getTime();
        matchesDate = matchesDate && current <= end;
    }

    const matchesMood = selectedMood ? l.mood.sentiment === selectedMood : true;

    return matchesSearch && matchesDate && matchesMood;
  });

  // Filter Logic for Weekly Logs
  const filteredWeekly = weeklyLogs.filter(l => {
    const matchesSearch = l.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.moodSummary.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
        const start = new Date(startDate).setHours(0,0,0,0);
        const current = new Date(l.weekStart).setHours(0,0,0,0);
        matchesDate = matchesDate && current >= start;
    }
    if (endDate) {
         const end = new Date(endDate).setHours(23, 59, 59, 999);
         const current = new Date(l.weekStart).getTime();
         matchesDate = matchesDate && current <= end;
    }

    return matchesSearch && matchesDate;
  });

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number, type: 'daily' | 'weekly') => {
    dragItem.current = position;
    dragType.current = type;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedIdx = dragItem.current;
    const overIdx = dragOverItem.current;
    const type = dragType.current;

    if (draggedIdx === null || overIdx === null || draggedIdx === overIdx) {
      dragItem.current = null;
      dragOverItem.current = null;
      dragType.current = null;
      return;
    }

    if (type === 'daily') {
      const _logs = [...filteredLogs];
      const draggedItemContent = _logs[draggedIdx];
      _logs.splice(draggedIdx, 1);
      _logs.splice(overIdx, 0, draggedItemContent);
      onReorderDaily(_logs);
    } else if (type === 'weekly') {
      const _logs = [...filteredWeekly];
      const draggedItemContent = _logs[draggedIdx];
      _logs.splice(draggedIdx, 1);
      _logs.splice(overIdx, 0, draggedItemContent);
      onReorderWeekly(_logs);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
    dragType.current = null;
  };

  const canDrag = !hasActiveFilters;

  // --- Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  // Helper to get local date string YYYY-MM-DD
  const getLocalISODate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCalendarDate(newDate);
  };

  const jumpToToday = () => {
    setCalendarDate(new Date());
  };

  const handleDateClick = (day: number) => {
    // Construct local date string correctly
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const dateObj = new Date(year, month, day);
    const dateStr = getLocalISODate(dateObj);
    
    const dailyLog = logs.find(l => l.date.startsWith(dateStr));
    
    setModalDate(dateStr);
    setModalLog(dailyLog);
  };

  const handleWeekClick = (weekNumStr: string) => {
    const foundLog = weeklyLogs.find(w => w.weekNumber === weekNumStr);
    setModalWeekNumber(weekNumStr);
    setModalWeeklyLog(foundLog);
  };

  const handleModalSave = (log: LogEntry) => {
    onQuickSaveDaily(log);
    setModalDate(null);
    setModalLog(undefined);
    refreshAuxData();
  };
  
  const handleWeeklyModalSave = (log: WeeklyLogEntry) => {
    saveWeeklyLog(log);
    setModalWeekNumber(null);
    setModalWeeklyLog(undefined);
    window.location.reload(); 
  };

  const handleMarkerSave = (marker: CalendarMarker | null) => {
    if (modalDate) {
      if (marker) {
        saveMarker(marker);
      } else {
        deleteMarker(modalDate);
      }
      refreshAuxData();
    }
  };

  // --- Dice Logic ---
  const handleRollDice = () => {
    const allHighlights: { text: string; date: string; mood: string }[] = [];
    logs.forEach(log => {
      if (log.highlights && log.highlights.length > 0) {
        log.highlights.forEach(h => {
          allHighlights.push({
            text: h,
            date: log.date,
            mood: log.mood.emoji
          });
        });
      }
    });

    if (allHighlights.length === 0) {
      alert("还没有记录下闪光点哦，快去日记里写下美好的小确幸吧！✨");
      return;
    }

    // Random selection
    const random = allHighlights[Math.floor(Math.random() * allHighlights.length)];
    setSurpriseItem(random);
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];
    
    // Check "Today"
    const todayStr = getLocalISODate(new Date());

    // Week Number Logic
    // Start from the first week of the month view (which might start in previous month)
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go to Sunday

    // Headers - Row 1 (Day Names)
    // Corner Cell
    cells.push(
      <div key="h-corner" className="flex items-end justify-center pb-2">
         <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-marker">WEEK</div>
      </div>
    );
    // Day Name Cells
    DAY_STYLES.forEach((style) => {
        cells.push(
            <div key={`h-${style.label}`} className={`text-center py-2 rounded-lg mb-2 ${style.bg}`}>
                <div className={`font-cute font-bold text-xl ${style.text}`}>{style.label}</div>
            </div>
        );
    });

    // Calendar Grid Construction
    let currentDay = 1;
    
    // Calculate total rows needed
    const totalSlots = firstDay + daysInMonth;
    const totalRows = Math.ceil(totalSlots / 7);

    for (let row = 0; row < totalRows; row++) {
      // 1. Week Number Column (Row Header)
      const weekDate = new Date(year, month, 1 + (row * 7) - firstDay + 1); 
      // Adjust if we are in the padding zone of previous month
      if (row === 0 && firstDay > 1) {
         // rough approx is fine for visual
      }
      const weekNumStr = getWeekNumberFromDate(weekDate);
      const shortWeekNum = weekNumStr.split('-W')[1];
      const hasWeeklyLog = weeklyLogs.some(w => w.weekNumber === weekNumStr);
      
      // Select Color Theme based on Week Number
      const weekInt = parseInt(shortWeekNum, 10) || 0;
      const theme = WEEK_THEMES[weekInt % WEEK_THEMES.length];

      cells.push(
        <div 
          key={`week-${row}`} 
          onClick={() => handleWeekClick(weekNumStr)}
          className={`h-32 flex flex-col items-center justify-center font-marker cursor-pointer transition-all group relative rounded-xl mx-1
            ${theme.bg} ${theme.border} border-2
            ${hasWeeklyLog ? 'shadow-md scale-105 z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}
          `}
          title="点击查看/编辑周报"
        >
          <span className={`text-xs font-bold ${theme.text}`}>WEEK</span>
          <span className={`text-2xl font-bold font-cute -mt-1 ${theme.text}`}>{shortWeekNum}</span>
          
          <div className="mt-1">
             {hasWeeklyLog 
                ? <Book className={`w-4 h-4 ${theme.icon}`} /> 
                : <Plus className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${theme.icon}`} />
             }
          </div>
        </div>
      );

      // 2. Days Columns
      for (let i = 0; i < 7; i++) {
        // Empty cells before start of month
        if (row === 0 && i < firstDay) {
          cells.push(<div key={`empty-${i}`} className="h-32 bg-transparent"></div>);
        } 
        // Valid days
        else if (currentDay <= daysInMonth) {
          const d = currentDay;
          // Local ISO string construction
          const dateStr = getLocalISODate(new Date(year, month, d));
          
          const log = logs.find(l => l.date.startsWith(dateStr));
          const marker = markers.find(m => m.date === dateStr);
          const dayTodos = todos.filter(t => t.date === dateStr && !t.completed);
          
          const isToday = dateStr === todayStr;

          // Get day style for border/color hints
          const dayStyle = DAY_STYLES[i];

          cells.push(
            <div 
              key={d} 
              onClick={() => handleDateClick(d)}
              className={`h-32 border-2 ${log ? 'border-dashed border-gray-300' : 'border-dashed border-gray-100'} 
                 p-2 relative hover:bg-white hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 
                 cursor-pointer transition-all group flex flex-col items-center justify-start rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm
                 ${isToday ? 'ring-4 ring-blue-100 border-blue-300 bg-blue-50/50' : ''}
                 `}
              style={marker ? { backgroundColor: marker.color + '15', borderColor: marker.color } : {}}
            >
               {/* Today Indicator */}
               {isToday && (
                 <span className="absolute top-2 right-2 flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
               )}

               {/* Marker Tape (Top Center) if present, else empty */}
               {marker && (
                 <div 
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-4 shadow-sm z-10 opacity-90 transform -rotate-1" 
                    style={{ backgroundColor: marker.color, maskImage: 'radial-gradient(circle, black 2px, transparent 2.5px)', maskSize: '8px 8px' }} 
                 ></div>
               )}

               {/* Date Number - Center Aligned & Big */}
               <div className={`mt-2 font-cute text-3xl transition-transform duration-300 ${log ? dayStyle.text + ' font-bold scale-110' : (isToday ? 'text-blue-600 font-bold' : 'text-gray-400')}`}>
                  {d}
               </div>

               {/* Marker Label */}
               {marker && (
                 <span 
                   className="text-[10px] px-2 py-0.5 rounded-full text-white truncate max-w-full shadow-sm mt-0.5 leading-none"
                   style={{ backgroundColor: marker.color }}
                 >
                   {marker.label}
                 </span>
               )}

               {/* Log Content Preview */}
               <div className="flex-grow flex flex-col items-center justify-center w-full mt-1">
                  {log ? (
                    <>
                      <span className="text-2xl animate-in zoom-in spin-in-3 duration-500 filter drop-shadow-sm">{log.mood.emoji}</span>
                      {log.content && <div className="h-1 w-8 bg-gray-200 rounded-full mt-1"></div>}
                    </>
                  ) : (
                    !marker && <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <Plus className="w-6 h-6 text-gray-200" />
                    </div>
                  )}
               </div>

               {/* Todo Indicators - Bottom Center */}
               {dayTodos.length > 0 && (
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center bg-yellow-50 px-1.5 py-0.5 rounded-full border border-yellow-100 gap-1 shadow-sm">
                    {dayTodos.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                    ))}
                    {dayTodos.length > 3 && <span className="text-[8px] text-gray-400 leading-none">+</span>}
                 </div>
               )}
            </div>
          );
          currentDay++;
        } 
        // Empty cells after end of month
        else {
          cells.push(<div key={`empty-end-${row}-${i}`} className="h-32 bg-transparent"></div>);
        }
      }
    }

    return (
      <div className="bg-white/80 p-6 rounded-[2rem] shadow-xl border-4 border-white/50 relative overflow-hidden">
         {/* Background Texture */}
         <div className="absolute inset-0 bg-dot-paper opacity-30 pointer-events-none"></div>

         <div className="flex justify-between items-center mb-8 relative z-10">
            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-blue-500 transition-all"><ChevronLeft /></button>
            
            <div className="flex flex-col items-center">
                <h2 className="text-4xl font-cute font-bold text-gray-700 tracking-wide flex items-center gap-2">
                  <span className="text-blue-400">{calendarDate.toLocaleDateString('en-US', { month: 'long' })}</span>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-600">{calendarDate.getFullYear()}</span>
                </h2>
                
                {/* Back to Today Button */}
                <button 
                  onClick={jumpToToday}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-600 font-marker hover:bg-blue-50 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                >
                  回到今天
                </button>
            </div>

            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-blue-500 transition-all"><ChevronRight /></button>
         </div>
         
         {/* Calendar Grid with 8 columns (1 for week num + 7 for days) */}
         <div className="grid grid-cols-[60px_repeat(7,_1fr)] gap-3 relative z-10">
            {cells}
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      
      {/* --- Floating Daily Log Modal --- */}
      {modalDate && (
        <DailyLogModal 
          dateStr={modalDate}
          existingLog={modalLog}
          onSave={handleModalSave}
          onSaveMarker={handleMarkerSave}
          onClose={() => { setModalDate(null); setModalLog(undefined); }}
          availableLogs={logs}
          availableWeeklyLogs={weeklyLogs}
          marker={markers.find(m => m.date === modalDate)}
        />
      )}

      {/* --- Floating Weekly Log Modal --- */}
      {modalWeekNumber && (
        <WeeklyLogModal
          weekNumber={modalWeekNumber}
          existingLog={modalWeeklyLog}
          onSave={handleWeeklyModalSave}
          onClose={() => { setModalWeekNumber(null); setModalWeeklyLog(undefined); }}
          availableLogs={logs}
          availableWeeklyLogs={weeklyLogs}
        />
      )}

      {/* --- Surprise Memory Card Modal --- */}
      {surpriseItem && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSurpriseItem(null)}
        >
          <div 
            className="bg-white p-6 pb-8 rounded-sm shadow-2xl max-w-sm w-full transform rotate-2 transition-transform hover:scale-105 duration-300 relative border-[12px] border-white"
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
             {/* Tape */}
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-8 bg-pink-300/80 rotate-1 shadow-sm" style={{ clipPath: 'polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)' }}></div>
             
             {/* Photo Area */}
             <div className="aspect-[4/3] bg-gray-100 mb-6 flex items-center justify-center rounded-sm overflow-hidden relative border border-gray-200">
                <div className="absolute inset-0 opacity-20 bg-dot-paper"></div>
                <div className="text-8xl animate-bounce-slow filter drop-shadow-md">{surpriseItem.mood}</div>
             </div>
             
             {/* Text */}
             <div className="text-center">
               <p className="font-hand text-2xl text-gray-800 leading-relaxed mb-4 line-clamp-4">
                 “ {surpriseItem.text} ”
               </p>
               <div className="flex items-center justify-center gap-2 text-gray-400 font-marker">
                  <span>—</span>
                  <span>{new Date(surpriseItem.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>—</span>
               </div>
             </div>

             <button 
               onClick={() => setSurpriseItem(null)}
               className="absolute -top-3 -right-3 bg-red-400 text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 mt-6">
        <div className="relative mb-6 md:mb-0 text-center md:text-left flex items-center gap-6">
           <div className="relative">
             <div className="absolute -top-6 -left-6 animate-wiggle">
                <Sticker type="bow" size={36} color="#fca5a5" rotation={-15} />
             </div>
             
             <h1 className="text-5xl font-cute font-bold text-gray-800 relative z-10 transform -rotate-1 drop-shadow-sm">
              Daily Craft
             </h1>
             <div className="absolute -bottom-2 left-0 w-full h-3 bg-yellow-200 -rotate-1 z-0 rounded-full opacity-60"></div>
           </div>

            {/* Realtime Clock Display */}
            <div className="hidden sm:flex flex-col items-start border-l-2 border-dashed border-gray-200 pl-4 text-gray-500 font-marker">
              <div className="flex items-center gap-1.5 text-xl font-bold text-gray-700">
                <Clock className="w-4 h-4 text-blue-400" />
                {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs">
                {currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
              </div>
            </div>
        </div>

        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          <div className="flex gap-3 w-full md:w-auto items-center">
            <div className="relative group flex-grow md:flex-grow-0">
              <input 
                type="text" 
                placeholder="搜索记忆..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-56 pl-9 pr-4 py-2 rounded-full border border-gray-300 bg-white focus:border-blue-400 focus:outline-none font-hand text-gray-700 transition-all shadow-sm focus:shadow-md"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex bg-white rounded-full border border-gray-200 p-0.5 shadow-sm">
               <button 
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-full transition-all ${viewMode === 'calendar' ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}
                title="日历视图"
               >
                 <Calendar className="w-4 h-4" />
               </button>
               <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}
                title="列表视图"
               >
                 <ListIcon className="w-4 h-4" />
               </button>
               <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}
                title="网格视图"
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
            </div>

            <button 
              onClick={handleRollDice}
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-all shadow-sm group"
              title="随机回忆 (惊喜骰子)"
            >
              <Dice className="w-5 h-5 group-hover:animate-spin" />
            </button>

            <button 
              onClick={onExportAllWeekly}
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm"
              title="汇总周报导出"
            >
              <Archive className="w-5 h-5" />
            </button>

            <button 
              onClick={onExport}
              className="p-2 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200 transition-all shadow-sm"
              title="备份全部数据"
            >
              <Download className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full border transition-all shadow-sm ${showFilters || hasActiveFilters ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600'}`}
              title="筛选"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-white rounded-xl border-2 border-dashed border-blue-200 flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-between animate-in fade-in slide-in-from-top-2 relative shadow-sm">
          <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="font-cute text-lg text-gray-600">日期:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm font-hand text-gray-700 focus:border-blue-300 outline-none"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm font-hand text-gray-700 focus:border-blue-300 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-cute text-lg text-gray-600">心情:</span>
              <select 
                value={selectedMood} 
                onChange={(e) => setSelectedMood(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-sm font-hand text-gray-700 focus:border-blue-300 outline-none min-w-[100px]"
              >
                <option value="">全部</option>
                {uniqueMoods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            onClick={clearFilters}
            className="text-sm text-red-500 hover:text-red-600 font-marker flex items-center gap-1 px-3 py-1 hover:bg-red-50 rounded-full transition-colors whitespace-nowrap border border-transparent hover:border-red-100"
          >
            <X className="w-3 h-3" /> 重置
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
        renderCalendar()
      ) : (
        /* Two Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-[500px]">
          
          {/* --- Left Column: Daily Logs --- */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2 border-b-2 border-gray-100 pb-2">
               <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <h2 className="text-2xl font-cute font-bold text-gray-800">每日便签</h2>
                  <span className="bg-blue-50 text-blue-500 text-xs px-2 py-0.5 rounded-full font-bold">{filteredLogs.length}</span>
               </div>
               <button 
                 onClick={() => onNewDaily()} 
                 className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors font-bold shadow-sm"
               >
                 <Plus className="w-3 h-3" /> 新建
               </button>
            </div>

            <div className={`flex flex-col gap-3 ${viewMode === 'grid' ? 'grid grid-cols-2' : ''}`}>
               {filteredLogs.length === 0 ? (
                 <div className="py-12 text-center opacity-60 flex flex-col items-center">
                   <Sticker type="cat" size={48} color="#e2e8f0" />
                   <p className="mt-2 font-hand text-gray-400">还没有记录哦...</p>
                 </div>
               ) : (
                 filteredLogs.map((log, index) => (
                   viewMode === 'list' ? (
                     // List View Item
                     <div 
                       key={log.id} 
                       className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                       style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                     >
                        <div 
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, index, 'daily')}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => onEditDaily(log)}
                            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all transform hover:-translate-x-1"
                        >
                            {canDrag && <div className="text-gray-200 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></div>}
                            
                            {/* Date Badge - Updated to Blue Theme */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-blue-50 rounded-lg border border-blue-100">
                              <span className="text-xs font-bold text-blue-400 uppercase">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                              <span className="text-lg font-bold text-blue-600 font-marker">{new Date(log.date).getDate()}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-grow min-w-0">
                              <div className="text-sm font-bold text-blue-800 font-sans mb-1">{formatTimeSimple(log.date)}</div>
                              <div className="text-gray-800 font-hand text-lg truncate leading-tight group-hover:text-blue-600 transition-colors">
                                {log.content || <span className="text-gray-300 italic">空白的记录...</span>}
                              </div>
                            </div>

                            {/* Mood */}
                            <div className="flex-shrink-0 flex flex-col items-end">
                              <div className="text-2xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform" title={log.mood.sentiment}>{log.mood.emoji}</div>
                            </div>
                        </div>
                     </div>
                   ) : (
                     // Grid View Item (Small Card)
                     <div 
                        key={log.id}
                        onClick={() => onEditDaily(log)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all relative overflow-hidden"
                     >
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: log.mood.color }}></div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-marker text-gray-500 text-sm">{formatDate(log.date)}</span>
                          <span className="text-xl">{log.mood.emoji}</span>
                        </div>
                        <p className="text-gray-700 font-hand text-sm line-clamp-3 leading-relaxed">
                          {log.content || "..."}
                        </p>
                     </div>
                   )
                 ))
               )}
            </div>
          </div>

          {/* --- Right Column: Weekly Logs --- */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2 border-b-2 border-gray-100 pb-2">
               <div className="flex items-center gap-2">
                  <Book className="w-5 h-5 text-green-500" />
                  <h2 className="text-2xl font-cute font-bold text-gray-800">每周总结</h2>
                  <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full font-bold">{filteredWeekly.length}</span>
               </div>
               <button 
                 onClick={() => onNewWeekly()} 
                 className="flex items-center gap-1 text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-bold shadow-sm"
               >
                 <Plus className="w-3 h-3" /> 新建
               </button>
            </div>

            <div className={`flex flex-col gap-3 ${viewMode === 'grid' ? 'grid grid-cols-2' : ''}`}>
               {filteredWeekly.length === 0 ? (
                 <div className="py-12 text-center opacity-60 flex flex-col items-center">
                   <Sticker type="cloud" size={48} color="#e2e8f0" />
                   <p className="mt-2 font-hand text-gray-400">还没有总结哦...</p>
                 </div>
               ) : (
                 filteredWeekly.map((log, index) => (
                   viewMode === 'list' ? (
                     // List View Item
                     <div 
                       key={log.id} 
                       className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                       style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                     >
                        <div 
                            draggable={canDrag}
                            onDragStart={(e) => handleDragStart(e, index, 'weekly')}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => onEditWeekly(log)}
                            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-green-300 transition-all transform hover:-translate-x-1"
                        >
                            {canDrag && <div className="text-gray-200 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></div>}
                            
                            {/* Week Badge */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-green-50 rounded-lg border border-green-100 text-green-700">
                              <span className="text-[10px] font-bold uppercase">Week</span>
                              <span className="text-lg font-bold font-marker">{log.weekNumber.split('-W')[1]}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-gray-500 font-sans">{log.weekNumber.split('-')[0]}</span>
                                  {log.moodSummary && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 border border-yellow-100">{log.moodSummary}</span>}
                              </div>
                              <div className="text-gray-800 font-hand text-lg truncate leading-tight group-hover:text-green-600 transition-colors">
                                {log.content || <span className="text-gray-300 italic">写点什么总结下...</span>}
                              </div>
                            </div>

                            {/* Arrow/Action */}
                            <div className="flex-shrink-0 text-gray-300 group-hover:text-green-400 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </div>
                        </div>
                     </div>
                   ) : (
                     // Grid View Item
                     <div 
                        key={log.id}
                        onClick={() => onEditWeekly(log)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all relative overflow-hidden"
                     >
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-200"></div>
                        <div className="flex justify-between items-center mb-2 mt-1">
                          <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded border border-green-100">{log.weekNumber}</span>
                          <span className="text-xs font-hand text-gray-500">{log.moodSummary}</span>
                        </div>
                        <p className="text-gray-700 font-hand text-sm line-clamp-3 leading-relaxed">
                          {log.content || "..."}
                        </p>
                     </div>
                   )
                 ))
               )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
