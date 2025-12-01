
import React, { useState, useMemo, useRef } from 'react';
import { LogEntry, WeeklyLogEntry } from '../types';
import { Plus, Search, Calendar, Book, Edit2, Filter, X, LayoutGrid, List as ListIcon, GripVertical, ChevronLeft, ChevronRight, Download, Wand2, Archive, Dice5 as Dice } from 'lucide-react';
import { WashiTape } from './WashiTape';
import { Sticker } from './Sticker';
import { DailyLogModal } from './DailyLogModal';

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
  // Default to list view as requested
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

  // Surprise Dice State
  const [surpriseItem, setSurpriseItem] = useState<{ text: string; date: string; mood: string } | null>(null);

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

  const changeMonth = (delta: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCalendarDate(newDate);
  };

  const handleDateClick = (day: number) => {
    const dateStr = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toISOString().split('T')[0];
    const dailyLog = logs.find(l => l.date.startsWith(dateStr));
    
    setModalDate(dateStr);
    setModalLog(dailyLog);
  };

  const handleModalSave = (log: LogEntry) => {
    onQuickSaveDaily(log);
    setModalDate(null);
    setModalLog(undefined);
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
    const days = [];

    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-transparent"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().split('T')[0];
      const log = logs.find(l => l.date.startsWith(dateStr));
      
      days.push(
        <div 
          key={day} 
          onClick={() => handleDateClick(day)}
          className="h-24 bg-white border border-gray-100 p-1 relative hover:bg-blue-50 cursor-pointer transition-colors group flex flex-col items-center justify-start rounded-lg"
        >
           <span className={`font-marker text-lg ${log ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{day}</span>
           {log && (
             <>
               <span className="text-2xl mt-1 animate-in zoom-in spin-in-3 duration-300">{log.mood.emoji}</span>
               <span className="text-[10px] text-gray-500 font-hand truncate w-full text-center px-1 mt-1">{log.content}</span>
             </>
           )}
           {!log && (
             <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center">
               <Plus className="w-6 h-6 text-blue-300" />
             </div>
           )}
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
         <div className="flex justify-between items-center mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
            <h2 className="text-2xl font-cute font-bold text-gray-700">
              {calendarDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
         </div>
         <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center font-marker text-gray-400 font-bold uppercase text-sm">{d}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-2">
            {days}
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
          onClose={() => { setModalDate(null); setModalLog(undefined); }}
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
        <div className="relative mb-6 md:mb-0 text-center md:text-left">
           <div className="absolute -top-6 -left-6 animate-wiggle">
              <Sticker type="bow" size={36} color="#fca5a5" rotation={-15} />
           </div>
           
           <h1 className="text-5xl font-cute font-bold text-gray-800 relative z-10 transform -rotate-1 drop-shadow-sm">
            Daily Craft
           </h1>
           <div className="absolute -bottom-2 left-0 w-full h-3 bg-yellow-200 -rotate-1 z-0 rounded-full opacity-60"></div>
           <p className="font-marker text-gray-600 mt-2 ml-2 tracking-widest flex items-center gap-2">
             记录每一刻的小确幸 <Sticker type="heart" size={12} color="#f472b6" />
           </p>
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
               <button 
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-full transition-all ${viewMode === 'calendar' ? 'bg-blue-100 text-blue-600 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}
                title="日历视图"
               >
                 <Calendar className="w-4 h-4" />
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
                       className="animate-in fade-in slide-in-from-bottom-5"
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
                       className="animate-in fade-in slide-in-from-bottom-5"
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
