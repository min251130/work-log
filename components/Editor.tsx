
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, WeeklyLogEntry, MoodAnalysis } from '../types';
import { WashiTape } from './WashiTape';
import { RichTextEditor } from './RichTextEditor';
import { Save, ArrowLeft, Trash2, Wand2, Sparkles, Plus, X, Palette } from 'lucide-react';
import { syncDailyHighlightsToWeekly } from '../services/storage';

interface EditorProps {
  initialEntry: LogEntry;
  onSave: (entry: LogEntry) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  // Linking Props
  availableLogs?: LogEntry[];
  availableWeeklyLogs?: WeeklyLogEntry[];
  onNavigate?: (id: string, type: 'daily' | 'weekly') => void;
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

export const Editor: React.FC<EditorProps> = ({ 
  initialEntry, 
  onSave, 
  onCancel, 
  onDelete,
  availableLogs,
  availableWeeklyLogs,
  onNavigate
}) => {
  const [content, setContent] = useState(initialEntry.content);
  const [mood, setMood] = useState<MoodAnalysis>(initialEntry.mood);
  const [date, setDate] = useState(initialEntry.date.split('T')[0]);
  
  // "Today's Sparkles" State
  const [highlights, setHighlights] = useState<string[]>(initialEntry.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');

  const colorInputRef = useRef<HTMLInputElement>(null);

  // Sync state when initialEntry changes (e.g. via navigation)
  useEffect(() => {
    setContent(initialEntry.content);
    setMood(initialEntry.mood);
    setDate(initialEntry.date.split('T')[0]);
    setHighlights(initialEntry.highlights || []);
  }, [initialEntry.id]);

  // Check for unsaved changes
  const hasChanges = () => {
    if (content !== initialEntry.content) return true;
    if (JSON.stringify(mood) !== JSON.stringify(initialEntry.mood)) return true;
    if (date !== initialEntry.date.split('T')[0]) return true;
    if (JSON.stringify(highlights) !== JSON.stringify(initialEntry.highlights || [])) return true;
    return false;
  };

  const handleBack = () => {
    if (hasChanges()) {
      if (window.confirm("您有未保存的更改，确定要离开吗？")) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const handleCycleMood = () => {
    const currentIndex = MOOD_PRESETS.findIndex(m => m.emoji === mood.emoji);
    const nextIndex = (currentIndex + 1) % MOOD_PRESETS.length;
    setMood(MOOD_PRESETS[nextIndex]);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMood(prev => ({ ...prev, color: e.target.value }));
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

  const handleSave = () => {
    const updatedEntry: LogEntry = {
      ...initialEntry,
      content,
      mood,
      highlights,
      date: new Date(date).toISOString(),
    };
    
    // Trigger sync to weekly log
    syncDailyHighlightsToWeekly(updatedEntry, highlights);

    onSave(updatedEntry);
  };

  return (
    <div className="relative max-w-4xl mx-auto p-4 sm:p-8 perspective-1000">
      
      {/* Decorative Tapes */}
      <WashiTape color="#fca5a5" rotation={-3} className="-top-3 left-1/4" pattern="stripes" />
      <WashiTape color="#93c5fd" rotation={2} className="-top-2 right-1/4" pattern="dots" />

      {/* Main Paper Sheet */}
      <div className="bg-paper shadow-xl rounded-lg min-h-[80vh] p-8 sm:p-12 relative overflow-hidden transform transition-all hover:scale-[1.002] flex flex-col">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 bg-grid-paper bg-[length:24px_24px] pointer-events-none opacity-40"></div>
        <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-red-200/50 pointer-events-none"></div>

        {/* Header Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 font-marker">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> 返回
          </button>
          
          <div className="flex items-center gap-2">
             <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-b-2 border-gray-300 focus:border-blue-400 outline-none text-2xl text-gray-700 font-bold"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onDelete(initialEntry.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              title="删除这一页"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center px-6 py-2 bg-gray-800 text-white rounded-full shadow-md hover:bg-gray-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Save className="w-4 h-4 mr-2" /> 保存
            </button>
          </div>
        </div>

        {/* Mood Section (Sticker) */}
        <div className="relative z-10 mb-2 flex items-center justify-end gap-3">
          {/* Custom Color Picker */}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => colorInputRef.current?.click()}
              className="p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-200 transition-all hover:rotate-12"
              title="自定义颜色"
            >
              <Palette className="w-4 h-4" />
            </button>
            <input 
              ref={colorInputRef}
              type="color"
              value={mood.color}
              onChange={handleColorChange}
              className="hidden"
            />
          </div>

          {/* Mood Preset Cycler */}
          <div 
            className="group relative cursor-pointer transform hover:scale-110 transition-transform duration-300 select-none"
            onClick={handleCycleMood}
            title="点击切换心情"
          >
              <div 
                className="flex flex-col items-center justify-center w-20 h-20 rounded-full shadow-md border-4 border-white transform rotate-6"
                style={{ backgroundColor: mood.color }}
              >
                <span className="text-3xl filter drop-shadow-sm">{mood.emoji}</span>
                <span className="text-[10px] font-hand font-bold text-gray-700 mt-1">{mood.sentiment}</span>
              </div>
             
             <div className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-200">
               <Wand2 className="w-3 h-3 text-purple-400" />
             </div>
          </div>
        </div>

        {/* "Today's Sparkles" Module */}
        <div className="relative z-10 bg-yellow-50/60 rounded-xl p-4 mb-6 border-2 border-dashed border-yellow-200">
          <h3 className="flex items-center gap-2 font-cute text-xl text-yellow-800 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-500" /> 今日闪光点 ✨
          </h3>
          
          <div className="space-y-2 mb-3">
             {highlights.map((item, index) => (
               <div key={index} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm group">
                  <span className="font-hand text-gray-700 truncate mr-2">• {item}</span>
                  <button onClick={() => removeHighlight(index)} className="text-gray-300 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
               </div>
             ))}
             {highlights.length === 0 && (
               <div className="text-gray-400 font-hand text-sm italic ml-2">今天完成了什么小成就呢？记下来吧~</div>
             )}
          </div>

          <div className="flex items-center gap-2">
            <input 
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHighlight()}
              placeholder="简要概括一下..."
              className="flex-grow bg-white border border-yellow-200 rounded-lg px-3 py-2 text-sm font-hand outline-none focus:border-yellow-400"
            />
            <button 
              onClick={handleAddHighlight}
              disabled={!newHighlight.trim()}
              className="bg-yellow-400 hover:bg-yellow-500 text-white p-2 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-yellow-600/60 mt-2 text-right font-sans">
             * 保存后会自动同步到本周周报哦
          </p>
        </div>

        {/* Text Area Replaced by RichTextEditor */}
        <div className="relative z-10 flex-grow font-hand text-xl leading-relaxed text-gray-800 min-h-[50vh] flex flex-col">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="亲爱的工作手账，今天我..."
            className="flex-grow"
            availableLogs={availableLogs}
            availableWeeklyLogs={availableWeeklyLogs}
            onNavigate={onNavigate}
          />
        </div>

        {/* Footer Info */}
        <div className="relative z-10 mt-6 flex justify-end items-center border-t-2 border-dashed border-gray-200 pt-4">
          <div className="text-sm text-gray-400 font-marker">
            {content.length} 字
          </div>
        </div>

      </div>
    </div>
  );
};