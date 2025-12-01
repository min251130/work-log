
import React, { useState } from 'react';
import { WeeklyLogEntry, LogEntry } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { WashiTape } from './WashiTape';
import { Save, X, Book, Sparkles, Plus } from 'lucide-react';
import { createEmptyWeeklyLog, getStartDateFromWeek } from '../services/storage';

interface WeeklyLogModalProps {
  weekNumber: string; // e.g. "2023-W42"
  existingLog?: WeeklyLogEntry;
  onSave: (log: WeeklyLogEntry) => void;
  onClose: () => void;
  availableLogs: LogEntry[];
  availableWeeklyLogs: WeeklyLogEntry[];
}

export const WeeklyLogModal: React.FC<WeeklyLogModalProps> = ({
  weekNumber,
  existingLog,
  onSave,
  onClose,
  availableLogs,
  availableWeeklyLogs,
}) => {
  // Initialize state
  const [entry, setEntry] = useState<WeeklyLogEntry>(() => {
    if (existingLog) return existingLog;
    // Calculate start date from week string to create empty log correctly
    const startDateStr = getStartDateFromWeek(weekNumber);
    const newLog = createEmptyWeeklyLog(startDateStr);
    newLog.weekNumber = weekNumber; // Ensure exact match
    return newLog;
  });

  const [currentWeek, setCurrentWeek] = useState(entry.weekNumber);
  const [content, setContent] = useState(entry.content);
  const [moodSummary, setMoodSummary] = useState(entry.moodSummary);
  const [highlights, setHighlights] = useState<string[]>(entry.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');

  const handleSave = () => {
    const updatedEntry: WeeklyLogEntry = {
      ...entry,
      weekNumber: currentWeek, // Use edited week number
      weekStart: getStartDateFromWeek(currentWeek), // Recalculate start date
      content,
      moodSummary,
      highlights,
    };
    onSave(updatedEntry);
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight('');
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="relative bg-[#f0fdf4] shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border-4 border-white animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Tapes */}
        <WashiTape color="#86efac" rotation={-2} className="-top-3 left-8 w-32" pattern="dots" />
        <WashiTape color="#fde047" rotation={1.5} className="-top-2 right-12 w-24" pattern="solid" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-green-200 bg-green-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
               <Book className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-cute font-bold text-gray-800 flex items-center gap-2">
                周报总结 
                <input 
                  type="week"
                  value={currentWeek}
                  onChange={(e) => setCurrentWeek(e.target.value)}
                  className="bg-green-50 border border-green-200 text-green-700 text-lg rounded-md px-2 py-0.5 focus:border-green-400 outline-none w-40"
                />
              </h2>
              <p className="text-xs text-gray-400 font-marker mt-1">
                 记录这一周的成长与收获
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-grow overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-grid-paper bg-[length:24px_24px] grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Sidebar (Highlights & Mood) */}
           <div className="space-y-6">
              
              {/* Mood Summary Input */}
              <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm transform -rotate-1">
                 <h3 className="text-sm font-bold text-green-700 mb-2 font-marker text-center">本周关键词 / 氛围</h3>
                 <input 
                   value={moodSummary}
                   onChange={(e) => setMoodSummary(e.target.value)}
                   placeholder="例如：忙碌但充实..."
                   className="w-full text-center text-lg font-hand bg-green-50/50 border-b border-green-200 outline-none p-1 focus:border-green-400 placeholder-green-200/50"
                 />
              </div>

              {/* Highlights List */}
              <div className="bg-white/80 p-4 rounded-xl border border-yellow-100 shadow-sm relative">
                  <WashiTape color="#fca5a5" rotation={1} className="-top-2 right-4 w-12 h-4" pattern="solid" />
                  <h3 className="flex items-center gap-2 font-marker text-yellow-700 mb-3 text-sm border-b border-yellow-50 pb-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" /> 高光时刻
                  </h3>
                  
                  <ul className="space-y-2 mb-3">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 group">
                        <span className="text-yellow-400 mt-1">★</span>
                        <span className="font-hand text-gray-700 text-sm flex-grow break-words">{h}</span>
                        <button onClick={() => removeHighlight(i)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400">
                           <X className="w-3 h-3" />
                        </button>
                      </li>
                    ))}
                    {highlights.length === 0 && <li className="text-gray-300 text-xs font-hand italic">暂无高光时刻</li>}
                  </ul>

                  <div className="flex gap-2">
                    <input 
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddHighlight()}
                      placeholder="添加一条..."
                      className="flex-grow bg-gray-50 border border-gray-100 rounded px-2 py-1 text-xs outline-none focus:border-yellow-300"
                    />
                    <button onClick={handleAddHighlight} disabled={!newHighlight} className="bg-yellow-100 text-yellow-700 px-2 rounded hover:bg-yellow-200">
                       <Plus className="w-4 h-4" />
                    </button>
                  </div>
              </div>
           </div>

           {/* Main Editor */}
           <div className="lg:col-span-2 min-h-[400px] bg-white/50 rounded-xl border border-green-100 p-2 flex flex-col">
             <RichTextEditor
               content={content}
               onChange={setContent}
               placeholder="本周发生了什么值得记录的事情？写下你的总结吧..."
               className="flex-grow min-h-[350px]"
               availableLogs={availableLogs}
               availableWeeklyLogs={availableWeeklyLogs}
             />
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-green-100 bg-green-50/80 rounded-b-2xl flex justify-between items-center backdrop-blur-sm">
          <div className="text-xs text-green-700/50 font-marker pl-2">
            Daily Craft Weekly
          </div>
          <div className="flex gap-3">
             <button 
               onClick={onClose}
               className="px-4 py-2 text-gray-500 font-bold hover:bg-green-100 rounded-lg transition-colors text-sm"
             >
               取消
             </button>
             <button 
               onClick={handleSave}
               className="px-6 py-2 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 hover:shadow-lg transition-all transform active:scale-95 flex items-center gap-2"
             >
               <Save className="w-4 h-4" /> 保存周报
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
