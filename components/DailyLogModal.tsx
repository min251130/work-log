
import React, { useState, useEffect } from 'react';
import { LogEntry, MoodAnalysis, WeeklyLogEntry, CalendarMarker } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { WashiTape } from './WashiTape';
import { Sticker } from './Sticker';
import { Save, X, Wand2, Calendar, Sparkles, Highlighter } from 'lucide-react';
import { createEmptyLog, syncDailyHighlightsToWeekly } from '../services/storage';

interface DailyLogModalProps {
  dateStr: string;
  existingLog?: LogEntry;
  onSave: (log: LogEntry) => void;
  onSaveMarker?: (marker: CalendarMarker | null) => void;
  onClose: () => void;
  availableLogs: LogEntry[];
  availableWeeklyLogs: WeeklyLogEntry[];
  marker?: CalendarMarker; // Current marker for this day if any
}

const MOOD_PRESETS: MoodAnalysis[] = [
  { sentiment: '平静', emoji: '😐', color: '#e2e8f0' },
  { sentiment: '开心', emoji: '😄', color: '#fca5a5' },
  { sentiment: '高效', emoji: '🚀', color: '#86efac' },
  { sentiment: '疲惫', emoji: '😫', color: '#cbd5e1' },
  { sentiment: '思考', emoji: '🤔', color: '#93c5fd' },
  { sentiment: '灵感', emoji: '💡', color: '#fcd34d' },
  { sentiment: '期待', emoji: '🤩', color: '#fdba74' },
  { sentiment: '焦虑', emoji: '😰', color: '#d8b4fe' },
];

export const DailyLogModal: React.FC<DailyLogModalProps> = ({
  dateStr,
  existingLog,
  onSave,
  onSaveMarker,
  onClose,
  availableLogs,
  availableWeeklyLogs,
  marker
}) => {
  // Initialize state with existing log or create a fresh draft
  const [entry, setEntry] = useState<LogEntry>(() => {
    if (existingLog) return existingLog;
    const newLog = createEmptyLog(dateStr);
    return newLog;
  });

  const [displayDate, setDisplayDate] = useState(dateStr);
  const [content, setContent] = useState(entry.content);
  const [mood, setMood] = useState(entry.mood);
  const [highlights, setHighlights] = useState<string[]>(entry.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');

  // Marker State
  const [markerColor, setMarkerColor] = useState(marker?.color || '#ffd1dc');
  const [markerLabel, setMarkerLabel] = useState(marker?.label || '');
  const [showMarkerSettings, setShowMarkerSettings] = useState(!!marker);

  const handleCycleMood = () => {
    const currentIndex = MOOD_PRESETS.findIndex(m => m.emoji === mood.emoji);
    const nextIndex = (currentIndex + 1) % MOOD_PRESETS.length;
    setMood(MOOD_PRESETS[nextIndex]);
  };

  const handleSave = () => {
    // Construct new ISO date based on user selection, keeping standard time if possible
    // Use simple ISO construction to avoid TZ shifts: YYYY-MM-DDT00:00:00.000Z
    const updatedEntry: LogEntry = {
      ...entry,
      date: new Date(displayDate).toISOString(),
      content,
      mood,
      highlights,
    };
    
    // Save Log
    if (content.trim() || highlights.length > 0) {
        // Sync highlights if any
        syncDailyHighlightsToWeekly(updatedEntry, highlights);
        onSave(updatedEntry);
    }

    // Save Marker - associate with the DISPLAY date
    if (onSaveMarker) {
        if (markerLabel.trim()) {
            onSaveMarker({
                date: displayDate,
                color: markerColor,
                label: markerLabel.trim()
            });
        } else {
            // If label is cleared, remove marker
            onSaveMarker(null);
        }
    } else {
        // fallback if onSaveMarker not provided but onSave expects closing
        if (!content.trim() && !highlights.length) onSave(updatedEntry);
    }
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative bg-paper shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-4 border-white animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Tapes */}
        <WashiTape color="#93c5fd" rotation={-2} className="-top-3 left-8 w-32" pattern="stripes" />
        <WashiTape color="#fca5a5" rotation={1.5} className="-top-2 right-12 w-24" pattern="dots" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-blue-100 bg-blue-50/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-500">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
              {/* Editable Date Input */}
              <div className="flex items-center gap-2">
                 <input 
                   type="date"
                   value={displayDate}
                   onChange={(e) => setDisplayDate(e.target.value)}
                   className="text-2xl font-cute font-bold text-gray-800 bg-transparent outline-none border-b border-dashed border-blue-200 focus:border-blue-400 transition-colors w-48"
                 />
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <button 
                   onClick={() => setShowMarkerSettings(!showMarkerSettings)}
                   className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 transition-colors ${showMarkerSettings ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-white text-gray-400 border-gray-200 hover:text-blue-500'}`}
                 >
                    <Highlighter className="w-3 h-3" />
                    {showMarkerSettings ? '收起标记' : '日历标记'}
                 </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Mood Selector (Mini) */}
             <div 
                className="group relative cursor-pointer transition-transform hover:scale-105 active:scale-95 select-none mr-4"
                onClick={handleCycleMood}
                title="点击切换心情"
              >
                  <div 
                    className="flex items-center justify-center w-12 h-12 rounded-full shadow-sm border-2 border-white"
                    style={{ backgroundColor: mood.color }}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                   <Wand2 className="w-3 h-3 text-gray-400" />
                 </div>
              </div>

            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-grid-paper bg-[length:24px_24px]">
           
           {/* Calendar Marker Settings */}
           {showMarkerSettings && (
             <div className="mb-6 bg-yellow-50/50 p-3 rounded-xl border border-yellow-100 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                   <span className="text-xs font-bold text-gray-500">日历标记:</span>
                   <input 
                      type="color" 
                      value={markerColor}
                      onChange={(e) => setMarkerColor(e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer border-none bg-transparent"
                      title="选择高亮颜色"
                   />
                   <input 
                      type="text"
                      value={markerLabel}
                      onChange={(e) => setMarkerLabel(e.target.value)}
                      placeholder="例如: 发薪日, 纪念日..."
                      className="bg-white border border-yellow-200 rounded px-2 py-1 text-sm font-hand text-gray-700 focus:border-yellow-400 outline-none flex-grow"
                   />
                   {markerLabel && (
                       <button onClick={() => setMarkerLabel('')} className="text-gray-400 hover:text-red-400">
                           <X className="w-4 h-4" />
                       </button>
                   )}
                </div>
             </div>
           )}

           {/* Highlights Section */}
           <div className="mb-6 bg-white/60 p-4 rounded-xl border border-blue-100 shadow-sm">
              <h3 className="flex items-center gap-2 font-marker text-blue-800 mb-2 text-sm">
                <Sparkles className="w-4 h-4 text-yellow-400" /> 今日闪光点
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {highlights.map((h, i) => (
                  <span key={i} className="bg-white border border-yellow-200 text-gray-600 px-2 py-1 rounded-md text-sm font-hand flex items-center gap-1">
                    {h} <button onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X className="w-3 h-3"/></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHighlight()}
                  placeholder="记一件小确幸..."
                  className="flex-grow bg-transparent border-b border-blue-200 text-sm font-hand px-1 outline-none focus:border-blue-400"
                />
                <button onClick={handleAddHighlight} disabled={!newHighlight} className="text-blue-500 hover:text-blue-700 disabled:opacity-30 text-xs font-bold">添加</button>
              </div>
           </div>

           {/* Editor */}
           <div className="min-h-[300px]">
             <RichTextEditor
               content={content}
               onChange={setContent}
               placeholder="今天发生了什么故事呢..."
               className="min-h-[300px]"
               availableLogs={availableLogs}
               availableWeeklyLogs={availableWeeklyLogs}
             />
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white/50 rounded-b-2xl flex justify-between items-center backdrop-blur-sm">
          <div className="text-xs text-gray-400 font-marker pl-2">
            {content.length} 字
          </div>
          <div className="flex gap-3">
             <button 
               onClick={onClose}
               className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition-colors text-sm"
             >
               取消
             </button>
             <button 
               onClick={handleSave}
               className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2"
             >
               <Save className="w-4 h-4" /> 保存记录
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
