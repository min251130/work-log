
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LogEntry, WeeklyLogEntry, CalendarMarker, TodoItem } from '../types';
import { Plus, Search, Calendar, Book, Edit2, Filter, X, LayoutGrid, List as ListIcon, GripVertical, ChevronLeft, ChevronRight, Download, Wand2, Archive, Dice5 as Dice, CheckCircle, Clock, CalendarDays, MousePointer2 } from 'lucide-react';
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
  { label: 'SUN', mobileLabel: 'S', full: 'Sunday', bg: 'bg-rose-50', text: 'text-rose-500' },
  { label: 'MON', mobileLabel: 'M', full: 'Monday', bg: 'bg-orange-50', text: 'text-orange-500' },
  { label: 'TUE', mobileLabel: 'T', full: 'Tuesday', bg: 'bg-amber-50', text: 'text-amber-500' },
  { label: 'WED', mobileLabel: 'W', full: 'Wednesday', bg: 'bg-emerald-50', text: 'text-emerald-500' },
  { label: 'THU', mobileLabel: 'T', full: 'Thursday', bg: 'bg-cyan-50', text: 'text-cyan-500' },
  { label: 'FRI', mobileLabel: 'F', full: 'Friday', bg: 'bg-blue-50', text: 'text-blue-500' },
  { label: 'SAT', mobileLabel: 'S', full: 'Saturday', bg: 'bg-violet-50', text: 'text-violet-500' },
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
  // Default to List view
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('list');
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

  // Hover Preview State
  const [preview, setPreview] = useState<{ x: number, y: number, title: string, content: string, mood?: string, highlights?: string[] } | null>(null);

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
  
  const handleMonthPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split('-');
    // Create date in local time
    setCalendarDate(new Date(parseInt(y), parseInt(m) - 1, 1));
  };

  const jumpToToday = () => {
    setCalendarDate(new Date());
  };

  const handleDateClick = (day: number) => {
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

  // --- Hover Preview Logic ---
  const handleCellMouseEnter = (e: React.MouseEvent, type: 'daily' | 'weekly', data: LogEntry | WeeklyLogEntry) => {
     if (!data) return;

     const rect = e.currentTarget.getBoundingClientRect();
     // Calculate position to prevent overflow
     const x = Math.min(rect.left, window.innerWidth - 300); // 300 is approx width of tooltip
     const y = rect.bottom + 10;
     
     if (type === 'daily') {
        const log = data as LogEntry;
        setPreview({
          x, y,
          title: formatDate(log.date),
          content: log.content,
          mood: log.mood.emoji,
          highlights: log.highlights
        });
     } else {
        const log = data as WeeklyLogEntry;
        setPreview({
          x, y,
          title: `周报 ${log.weekNumber}`,
          content: log.content,
          mood: log.moodSummary,
          highlights: log.highlights
        });
     }
  };

  const handleCellMouseLeave = () => {
    setPreview(null);
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
    const startDate = new Date(year, month, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go to Sunday

    // Headers
    cells.push(
      <div key="h-corner" className="flex items-end justify-center pb-1">
         <div className="bg-gray-800 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-full font-marker whitespace-nowrap hidden md:block">WEEK</div>
         <div className="bg-gray-800 text-white text-[8px] font-bold px-1 rounded-sm font-marker md:hidden">W</div>
      </div>
    );
    DAY_STYLES.forEach((style) => {
        cells.push(
            <div key={`h-${style.label}`} className={`text-center py-1 rounded-lg mb-1 flex items-center justify-center ${style.bg}`}>
                <div className={`hidden sm:block font-cute font-bold text-lg md:text-xl ${style.text}`}>{style.label}</div>
                <div className={`sm:hidden font-cute font-bold text-xs ${style.text}`}>{style.mobileLabel}</div>
            </div>
        );
    });

    // Calendar Grid Construction
    let currentDay = 1;
    const totalSlots = firstDay + daysInMonth;
    const totalRows = Math.ceil(totalSlots / 7);

    for (let row = 0; row < totalRows; row++) {
      // 1. Week Number Column (Row Header)
      const weekDate = new Date(year, month, 1 + (row * 7) - firstDay + 1); 
      const weekNumStr = getWeekNumberFromDate(weekDate);
      const shortWeekNum = weekNumStr.split('-W')[1];
      const foundWeeklyLog = weeklyLogs.find(w => w.weekNumber === weekNumStr);
      
      const weekInt = parseInt(shortWeekNum, 10) || 0;
      const theme = WEEK_THEMES[weekInt % WEEK_THEMES.length];

      cells.push(
        <div 
          key={`week-${row}`} 
          onClick={() => handleWeekClick(weekNumStr)}
          onMouseEnter={(e) => foundWeeklyLog && handleCellMouseEnter(e, 'weekly', foundWeeklyLog)}
          onMouseLeave={handleCellMouseLeave}
          className={`flex flex-col items-center justify-center font-marker cursor-pointer transition-all group relative rounded-lg sm:rounded-xl mx-0.5
            aspect-[2/3] sm:aspect-auto sm:h-auto sm:min-h-[5rem]
            ${theme.bg} ${theme.border} border sm:border-2
            ${foundWeeklyLog ? 'shadow-md scale-105 z-10' : 'opacity-80 hover:opacity-100 hover:scale-105'}
          `}
        >
          <span className={`text-[8px] sm:text-[10px] sm:text-xs font-bold ${theme.text} hidden md:block`}>WEEK</span>
          <span className={`text-[10px] sm:text-lg md:text-2xl font-bold font-cute ${theme.text}`}>{shortWeekNum}</span>
          
          <div className="mt-0.5 sm:mt-1">
             {foundWeeklyLog 
                ? <Book className={`w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 ${theme.icon}`} /> 
                : <Plus className={`w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 opacity-0 group-hover:opacity-100 ${theme.icon}`} />
             }
          </div>
        </div>
      );

      // 2. Days Columns
      for (let i = 0; i < 7; i++) {
        if (row === 0 && i < firstDay) {
          cells.push(<div key={`empty-${i}`} className="bg-transparent"></div>);
        } 
        else if (currentDay <= daysInMonth) {
          const d = currentDay;
          const dateStr = getLocalISODate(new Date(year, month, d));
          const log = logs.find(l => l.date.startsWith(dateStr));
          const marker = markers.find(m => m.date === dateStr);
          const dayTodos = todos.filter(t => t.date === dateStr && !t.completed);
          const isToday = dateStr === todayStr;
          const dayStyle = DAY_STYLES[i];

          cells.push(
            <div 
              key={d} 
              onClick={() => handleDateClick(d)}
              onMouseEnter={(e) => log && handleCellMouseEnter(e, 'daily', log)}
              onMouseLeave={handleCellMouseLeave}
              className={`
                 min-h-[3.5rem] sm:min-h-[5rem] md:min-h-[7rem]
                 border sm:border-2 ${log ? 'border-dashed border-gray-300' : 'border-dashed border-gray-100'} 
                 p-0.5 sm:p-2 relative hover:bg-white hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 
                 cursor-pointer transition-all group flex flex-col items-center justify-start rounded-md sm:rounded-2xl overflow-hidden bg-white/60 backdrop-blur-sm
                 ${isToday ? 'ring-1 sm:ring-4 ring-blue-100 border-blue-300 bg-blue-50/50' : ''}
                 `}
              style={marker ? { backgroundColor: marker.color + '15', borderColor: marker.color } : {}}
            >
               {/* Today Indicator */}
               {isToday && (
                 <span className="absolute top-1 right-1 sm:top-2 sm:right-2 flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-500"></span>
                 </span>
               )}

               {/* Marker Tape */}
               {marker && (
                 <div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 sm:w-16 h-2 sm:h-4 shadow-sm z-10 opacity-90 transform -rotate-1" 
                    style={{ backgroundColor: marker.color }} 
                 ></div>
               )}

               {/* Date Number */}
               <div className={`mt-0.5 sm:mt-2 font-cute text-sm sm:text-xl md:text-3xl transition-transform duration-300 ${log ? dayStyle.text + ' font-bold scale-110' : (isToday ? 'text-blue-600 font-bold' : 'text-gray-400')}`}>
                  {d}
               </div>

               {/* Marker Label */}
               {marker && (
                 <span 
                   className="hidden sm:inline-block text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full text-white truncate max-w-full shadow-sm mt-0.5 leading-none"
                   style={{ backgroundColor: marker.color }}
                 >
                   {marker.label}
                 </span>
               )}

               {/* Log Content Preview Icon */}
               <div className="flex-grow flex flex-col items-center justify-center w-full mt-0 sm:mt-1">
                  {log ? (
                    <>
                      <span className="text-sm sm:text-lg md:text-2xl animate-in zoom-in spin-in-3 duration-500 filter drop-shadow-sm">{log.mood.emoji}</span>
                      {log.content && <div className="h-0.5 w-4 sm:h-1 sm:w-8 bg-gray-200 rounded-full mt-1 hidden sm:block"></div>}
                    </>
                  ) : (
                    !marker && <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <Plus className="w-3 h-3 sm:w-5 sm:h-5 sm:w-6 sm:h-6 text-gray-200" />
                    </div>
                  )}
               </div>

               {/* Todo Indicators */}
               {dayTodos.length > 0 && (
                 <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0.5 sm:gap-1">
                    {dayTodos.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-400 shadow-sm"></div>
                    ))}
                    {dayTodos.length > 3 && <span className="hidden sm:inline text-[8px] text-gray-400 leading-none">+</span>}
                 </div>
               )}
            </div>
          );
          currentDay++;
        } 
        else {
          cells.push(<div key={`empty-end-${row}-${i}`} className="bg-transparent"></div>);
        }
      }
    }

    return (
      <div className="bg-white/80 p-2 sm:p-6 rounded-xl sm:rounded-[2rem] shadow-xl border-2 sm:border-4 border-white/50 relative overflow-hidden w-full">
         <div className="absolute inset-0 bg-dot-paper opacity-30 pointer-events-none"></div>

         <div className="flex justify-between items-center mb-4 sm:mb-8 relative z-10">
            <button onClick={() => changeMonth(-1)} className="p-1 sm:p-3 hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-blue-500 transition-all"><ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            
            <div className="flex flex-col items-center">
                <div className="relative group">
                   <h2 className="text-lg sm:text-2xl md:text-4xl font-cute font-bold text-gray-700 tracking-wide flex items-center gap-2 cursor-pointer group-hover:text-blue-500 transition-colors">
                     <span className="text-blue-400 group-hover:text-blue-600 transition-colors whitespace-nowrap">{calendarDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                     <span className="text-gray-300 hidden sm:inline">/</span>
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors">{calendarDate.getFullYear()}</span>
                     <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                     </div>
                   </h2>
                   
                   <input 
                      type="month"
                      value={`${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`}
                      onChange={handleMonthPickerChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title="点击切换月份"
                   />
                </div>
                
                <button 
                  onClick={jumpToToday}
                  className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-blue-400 hover:text-blue-600 font-marker hover:bg-blue-50 px-3 py-1 rounded-full transition-colors flex items-center gap-1 relative z-20"
                >
                  回到今天
                </button>
            </div>

            <button onClick={() => changeMonth(1)} className="p-1 sm:p-3 hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-blue-500 transition-all"><ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /></button>
         </div>
         
         <div className="relative z-10 w-full">
             <div className="grid grid-cols-[25px_repeat(7,_1fr)] sm:grid-cols-[40px_repeat(7,_1fr)] md:grid-cols-[60px_repeat(7,_1fr)] gap-0.5 sm:gap-1 md:gap-3 min-w-0 w-full">
                {cells}
             </div>
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-6 space-y-4 sm:space-y-8 animate-in fade-in duration-500">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/60 p-4 rounded-2xl border border-white/50 backdrop-blur-sm shadow-sm relative z-20">
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-rose-200 to-orange-100 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-inner border-2 border-white">
               🐼
             </div>
             <div>
               <h1 className="text-xl sm:text-3xl font-cute font-bold text-gray-800 tracking-wide">Daily Craft</h1>
               <div className="text-xs sm:text-sm text-gray-500 font-marker flex items-center gap-2">
                 <span>{currentTime.toLocaleDateString()}</span>
                 <span className="text-gray-300">|</span>
                 <span className="tabular-nums font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
             </div>
          </div>
          
          <button 
             onClick={handleRollDice}
             className="md:hidden p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition-colors shadow-sm"
             title="随机回顾"
          >
             <Dice className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex bg-gray-100/50 p-1 rounded-full border border-gray-200">
             <button 
               onClick={() => setViewMode('calendar')}
               className={`p-1.5 sm:p-2 rounded-full transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
               title="日历视图"
             >
               <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`p-1.5 sm:p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
               title="列表视图"
             >
               <ListIcon className="w-4 h-4 sm:w-5 sm:h-5" />
             </button>
          </div>

          <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

          <div className="flex gap-2 flex-grow sm:flex-grow-0 justify-end">
             <button 
               onClick={onExportAllWeekly}
               className="p-2 sm:px-4 sm:py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors font-bold text-sm flex items-center gap-2 shadow-sm border border-green-200 whitespace-nowrap"
             >
               <Archive className="w-4 h-4" /> <span className="hidden sm:inline">导出周报</span>
             </button>
             <button 
               onClick={() => onNewDaily()}
               className="p-2 sm:px-6 sm:py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-all hover:scale-105 font-bold shadow-lg flex items-center gap-2 whitespace-nowrap"
             >
               <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">写日记</span>
             </button>
             <button 
                onClick={handleRollDice}
                className="hidden md:flex p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition-colors shadow-sm border border-yellow-200"
                title="随机回顾"
             >
                <Dice className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
      
      {/* Surprise Box */}
      {surpriseItem && (
        <div className="relative bg-yellow-50 border-2 border-dashed border-yellow-300 p-4 rounded-xl shadow-lg animate-in zoom-in-95 mx-auto max-w-lg mb-4">
           <button onClick={() => setSurpriseItem(null)} className="absolute top-2 right-2 text-yellow-400 hover:text-yellow-600"><X className="w-4 h-4"/></button>
           <div className="text-center font-hand text-lg text-gray-700">
              <div className="text-3xl mb-2">{surpriseItem.mood}</div>
              <div className="mb-2">“{surpriseItem.text}”</div>
              <div className="text-xs text-yellow-600 font-bold bg-yellow-100 inline-block px-2 py-1 rounded-full">
                 📅 {formatDate(surpriseItem.date)}
              </div>
           </div>
        </div>
      )}

      {/* Hover Preview Tooltip */}
      {preview && (
        <div 
           className="fixed z-[9999] bg-white p-4 rounded-xl shadow-2xl border-2 border-blue-100 max-w-xs sm:max-w-sm pointer-events-none animate-in fade-in zoom-in-95 duration-200"
           style={{ 
             left: preview.x, 
             top: preview.y,
             // Ensure it doesn't go offscreen
             transform: `translateX(${preview.x + 320 > window.innerWidth ? '-100%' : '0'})` 
           }}
        >
           <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-t-2 border-l-2 border-blue-100 transform rotate-45"></div>
           <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
             {preview.mood && <span className="text-xl">{preview.mood}</span>}
             <h3 className="font-cute font-bold text-gray-700 text-lg">{preview.title}</h3>
           </div>
           
           <div className="text-sm font-hand text-gray-600 line-clamp-4 leading-relaxed mb-2">
             {preview.content || <span className="italic text-gray-300">无文字内容</span>}
           </div>

           {preview.highlights && preview.highlights.length > 0 && (
             <div className="space-y-1">
               {preview.highlights.slice(0, 2).map((h, i) => (
                 <div key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100 truncate">
                   ✨ {h}
                 </div>
               ))}
               {preview.highlights.length > 2 && <div className="text-xs text-gray-400 pl-1">...等 {preview.highlights.length} 条</div>}
             </div>
           )}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="animate-in slide-in-from-bottom-5 duration-500">
           {renderCalendar()}
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-5">
          {/* Daily Logs Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
               <h2 className="text-xl font-cute font-bold text-gray-700 flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-pink-400" /> 日常碎片
               </h2>
               <div className="flex gap-2">
                 <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-full ${showFilters ? 'bg-blue-100 text-blue-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                    <Filter className="w-4 h-4" />
                 </button>
               </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 mb-4 animate-in slide-in-from-top-2">
                 <div className="grid grid-cols-2 gap-3 mb-3">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border rounded p-1" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border rounded p-1" />
                 </div>
                 <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                    {uniqueMoods.map(m => (
                       <button 
                         key={m} 
                         onClick={() => setSelectedMood(selectedMood === m ? '' : m)}
                         className={`px-2 py-1 text-xs rounded-full border whitespace-nowrap ${selectedMood === m ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'}`}
                       >
                         {m}
                       </button>
                    ))}
                 </div>
                 <div className="relative">
                    <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                    <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜索日记..."
                      className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                    />
                 </div>
                 <div className="flex justify-end mt-2">
                    <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-400">清除筛选</button>
                 </div>
              </div>
            )}

            {filteredLogs.length === 0 ? (
               <div className="text-center py-10 text-gray-400 font-hand text-lg border-2 border-dashed border-gray-200 rounded-2xl">
                  {hasActiveFilters ? '没有找到相关日记哦' : '还没有日记，快去写一篇吧！'}
               </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div 
                  key={log.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, index, 'daily')}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onEditDaily(log)}
                  className={`bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group relative overflow-hidden animate-in slide-in-from-bottom-2 duration-500`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Left Color Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: log.mood.color }}></div>
                  
                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{log.mood.emoji}</span>
                        <div>
                          <div className="font-bold text-gray-800 text-lg font-cute leading-none">{formatDate(log.date)}</div>
                          <div className="text-xs text-gray-400 font-marker">{new Date(log.date).getFullYear()}</div>
                        </div>
                      </div>
                      {canDrag && <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />}
                    </div>
                    
                    <p className="text-gray-600 font-hand text-lg line-clamp-3 leading-relaxed mb-2">
                      {log.content || <span className="text-gray-300 italic">无文字内容...</span>}
                    </p>

                    {log.highlights && log.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                         {log.highlights.slice(0, 3).map((h, i) => (
                           <span key={i} className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-100 truncate max-w-[150px]">
                              ✨ {h}
                           </span>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Weekly Logs Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2 px-2">
               <h2 className="text-xl font-cute font-bold text-gray-700 flex items-center gap-2">
                 <Book className="w-5 h-5 text-blue-400" /> 每周总结
               </h2>
               <button onClick={() => onNewWeekly()} className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-full hover:bg-blue-100 font-bold">
                 + 新建
               </button>
            </div>

            {filteredWeekly.length === 0 ? (
               <div className="text-center py-10 text-gray-400 font-hand text-lg border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  开始记录你的第一周吧！
               </div>
            ) : (
              filteredWeekly.map((log, index) => (
                <div 
                  key={log.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, index, 'weekly')}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onEditWeekly(log)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 group relative animate-in slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                   <WashiTape color={log.themeColor || '#d1fae5'} rotation={2} className="-top-2 right-4 w-16 h-4" pattern="dots" />
                   
                   <div className="flex items-center gap-3 mb-3">
                      <div className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-lg font-marker text-sm">
                        {log.weekNumber}
                      </div>
                      {log.moodSummary && (
                        <span className="text-sm font-hand text-gray-500">
                           {log.moodSummary}
                        </span>
                      )}
                   </div>

                   <div className="space-y-1">
                      {log.highlights && log.highlights.length > 0 ? (
                        log.highlights.slice(0, 3).map((h, i) => (
                          <div key={i} className="flex items-center gap-2 text-gray-700 font-hand text-sm">
                             <span className="text-green-400 text-xs">●</span> {h}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm font-hand italic">暂无高光时刻</div>
                      )}
                      {log.highlights && log.highlights.length > 3 && (
                        <div className="text-xs text-gray-400 pl-4">...还有 {log.highlights.length - 3} 条</div>
                      )}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
};
