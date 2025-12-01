
import React, { useState, useEffect } from 'react';
import { LogEntry, WeeklyLogEntry } from '../types';
import { WashiTape } from './WashiTape';
import { RichTextEditor } from './RichTextEditor';
import { Save, ArrowLeft, Trash2, CalendarDays, Download, Printer } from 'lucide-react';

interface WeeklyEditorProps {
  initialEntry: WeeklyLogEntry;
  onSave: (entry: WeeklyLogEntry) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  // Linking Props
  availableLogs?: LogEntry[];
  availableWeeklyLogs?: WeeklyLogEntry[];
  onNavigate?: (id: string, type: 'daily' | 'weekly') => void;
}

export const WeeklyEditor: React.FC<WeeklyEditorProps> = ({ 
  initialEntry, 
  onSave, 
  onCancel, 
  onDelete,
  availableLogs,
  availableWeeklyLogs,
  onNavigate
}) => {
  const [content, setContent] = useState(initialEntry.content);
  const [highlights, setHighlights] = useState<string[]>(initialEntry.highlights || []);
  const [moodSummary, setMoodSummary] = useState(initialEntry.moodSummary);
  const [weekNumber, setWeekNumber] = useState(initialEntry.weekNumber);
  
  // Sync state when initialEntry changes
  useEffect(() => {
    setContent(initialEntry.content);
    setHighlights(initialEntry.highlights || []);
    setMoodSummary(initialEntry.moodSummary);
    setWeekNumber(initialEntry.weekNumber);
  }, [initialEntry.id]);

  // Check for unsaved changes
  const hasChanges = () => {
    if (content !== initialEntry.content) return true;
    if (JSON.stringify(highlights) !== JSON.stringify(initialEntry.highlights || [])) return true;
    if (moodSummary !== initialEntry.moodSummary) return true;
    if (weekNumber !== initialEntry.weekNumber) return true;
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

  const getStartDateFromWeek = (w: string) => {
    const [y, wk] = w.split('-W');
    const simpleDate = new Date(parseInt(y), 0, 1 + (parseInt(wk) - 1) * 7);
    const dayOfWeek = simpleDate.getDay();
    const ISOweekStart = simpleDate;
    if (dayOfWeek <= 4)
        ISOweekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
    else 
        ISOweekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
    return ISOweekStart.toISOString();
  };

  const handleSave = () => {
    const updatedEntry: WeeklyLogEntry = {
      ...initialEntry,
      content,
      highlights,
      moodSummary,
      weekNumber,
      weekStart: getStartDateFromWeek(weekNumber),
    };
    onSave(updatedEntry);
  };

  const handleExportText = () => {
    const textContent = `
周次: ${weekNumber}
氛围: ${moodSummary}
-------------------
高光时刻:
${highlights.map(h => `- ${h}`).join('\n')}
-------------------
周报内容:
${content}
    `.trim();
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-log-${weekNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative max-w-5xl mx-auto p-4 sm:p-8 perspective-1000">
      
      {/* Decorative Tapes - Hide in print */}
      <div className="no-print">
        <WashiTape color="#6ee7b7" rotation={-2} className="-top-4 left-1/3" pattern="dots" />
        <WashiTape color="#fcd34d" rotation={1} className="-top-3 right-1/3" pattern="solid" />
      </div>

      {/* Main Folder/Paper Sheet */}
      <div className="bg-[#f0fdf4] shadow-2xl rounded-sm min-h-[80vh] p-8 sm:p-12 relative overflow-hidden border-t-8 border-green-200/50">
        {/* Paper Texture - Hide in print to save ink/cleaner look */}
        <div className="absolute inset-0 bg-dot-paper bg-[length:20px_20px] pointer-events-none opacity-30 no-print"></div>

        {/* Header Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 font-marker no-print">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> 返回主页
          </button>
          
          <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-full border border-green-100">
            <CalendarDays className="w-5 h-5 text-green-600" />
            <input 
              type="week" 
              value={weekNumber} 
              onChange={(e) => setWeekNumber(e.target.value)}
              className="bg-transparent border-none outline-none text-xl text-gray-700 font-bold cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleExportText}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              title="导出文本"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all"
              title="打印 / 另存为 PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
            <div className="w-px h-8 bg-gray-300 mx-2"></div>
            <button 
              onClick={() => onDelete(initialEntry.id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              title="删除"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center px-6 py-2 bg-green-700 text-white rounded-full shadow-md hover:bg-green-800 hover:shadow-lg transition-all"
            >
              <Save className="w-4 h-4 mr-2" /> 保存周志
            </button>
          </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">周报总结 - {weekNumber}</h1>
            <p className="text-gray-500 text-sm">生成时间: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-full flex flex-col">
              <label className="block text-green-800 font-marker text-2xl mb-2 ml-2">本周叙事</label>
              <div className="flex-grow bg-white/50 rounded-lg p-2 min-h-[40vh]">
                 <RichTextEditor
                   content={content}
                   onChange={setContent}
                   placeholder="这一周发生了什么..."
                   className="h-full"
                   availableLogs={availableLogs}
                   availableWeeklyLogs={availableWeeklyLogs}
                   onNavigate={onNavigate}
                 />
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Highlights */}
            <div className="bg-white shadow-lg p-6 transform rotate-1 sticky top-4">
              <div className="w-32 h-8 bg-yellow-200/50 absolute -top-3 left-1/2 -translate-x-1/2 transform -rotate-2 no-print"></div>
              <h3 className="font-marker text-xl text-gray-700 mb-4 border-b border-gray-100 pb-2 text-center">高光时刻</h3>
              <ul className="space-y-3">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start font-hand text-lg text-gray-600">
                    <span className="mr-2 text-green-500 mt-1">★</span>
                    <input 
                      value={h}
                      onChange={(e) => {
                        const newH = [...highlights];
                        newH[i] = e.target.value;
                        setHighlights(newH);
                      }}
                      className="bg-transparent border-b border-transparent focus:border-green-300 outline-none w-full"
                    />
                  </li>
                ))}
                {highlights.length < 5 && (
                  <li className="no-print">
                    <button 
                      onClick={() => setHighlights([...highlights, ""])}
                      className="text-green-500 font-hand text-sm hover:underline pl-6"
                    >
                      + 添加亮点
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Mood Summary Tag */}
            <div className="bg-green-100 p-4 rounded-lg border border-green-200 transform -rotate-2 shadow-md">
              <h3 className="font-marker text-green-800 text-center mb-1">本周氛围</h3>
              <input 
                value={moodSummary}
                onChange={(e) => setMoodSummary(e.target.value)}
                placeholder="感觉如何？"
                className="w-full text-center bg-transparent border-none outline-none font-scribble text-2xl text-green-900"
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
