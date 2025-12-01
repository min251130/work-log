
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { WeeklyEditor } from './components/WeeklyEditor';
import { LogEntry, WeeklyLogEntry, ViewMode, TodoItem } from './types';
import { Sticker } from './components/Sticker';
import { BackgroundAudio } from './components/BackgroundAudio';
import { TodoModule } from './components/TodoModule';
import { 
  getLogs, saveLog, deleteLog, createEmptyLog, saveAllLogs,
  getWeeklyLogs, saveWeeklyLog, deleteWeeklyLog, createEmptyWeeklyLog, saveAllWeeklyLogs,
  getAllDataForExport
} from './services/storage';

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLogEntry[]>([]);
  
  const [view, setView] = useState<ViewMode>('list');
  
  // Navigation Stack for "Back" button functionality
  const [navHistory, setNavHistory] = useState<{view: ViewMode, data: any}[]>([]);

  const [currentDaily, setCurrentDaily] = useState<LogEntry | null>(null);
  const [currentWeekly, setCurrentWeekly] = useState<WeeklyLogEntry | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLogs(getLogs());
    setWeeklyLogs(getWeeklyLogs());
  };

  const pushHistory = () => {
    // Save current state to history before navigating
    const state: {view: ViewMode, data: any} = { view, data: null };
    if (view === 'edit-daily') state.data = currentDaily;
    if (view === 'edit-weekly') state.data = currentWeekly;
    
    setNavHistory(prev => [...prev, state]);
  };

  const handleBack = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      const newHistory = navHistory.slice(0, -1);
      setNavHistory(newHistory);
      
      // Restore state
      if (prev.view === 'edit-daily') setCurrentDaily(prev.data);
      if (prev.view === 'edit-weekly') setCurrentWeekly(prev.data);
      setView(prev.view);
    } else {
      setView('list');
      setCurrentDaily(null);
      setCurrentWeekly(null);
    }
  };

  // --- Daily Handlers ---
  const handleNewDaily = (date?: string) => {
    setNavHistory([]); // Reset history when starting fresh
    setCurrentDaily(createEmptyLog(date));
    setView('edit-daily');
  };

  const handleEditDaily = (entry: LogEntry) => {
    setNavHistory([]);
    setCurrentDaily(entry);
    setView('edit-daily');
  };

  const handleSaveDaily = (entry: LogEntry) => {
    saveLog(entry);
    refreshData();
    setView('list');
    setCurrentDaily(null);
    setNavHistory([]);
  };

  // New: Handle save from Modal (no view change)
  const handleQuickSaveDaily = (entry: LogEntry) => {
    saveLog(entry);
    refreshData();
  };

  const handleDeleteDaily = (id: string) => {
    if (window.confirm("确定要撕掉这一页手账吗？")) {
      deleteLog(id);
      refreshData();
      setView('list');
      setCurrentDaily(null);
      setNavHistory([]);
    }
  };

  const handleReorderDaily = (newLogs: LogEntry[]) => {
    setLogs(newLogs);
    saveAllLogs(newLogs);
  };

  // --- Weekly Handlers ---
  const handleNewWeekly = (date?: string) => {
    setNavHistory([]);
    setCurrentWeekly(createEmptyWeeklyLog(date));
    setView('edit-weekly');
  };

  const handleEditWeekly = (entry: WeeklyLogEntry) => {
    setNavHistory([]);
    setCurrentWeekly(entry);
    setView('edit-weekly');
  };

  const handleSaveWeekly = (entry: WeeklyLogEntry) => {
    saveWeeklyLog(entry);
    refreshData();
    setView('list');
    setCurrentWeekly(null);
    setNavHistory([]);
  };

  const handleDeleteWeekly = (id: string) => {
     if (window.confirm("确定要删除这篇周总结吗？")) {
      deleteWeeklyLog(id);
      refreshData();
      setView('list');
      setCurrentWeekly(null);
      setNavHistory([]);
    }
  };

  const handleReorderWeekly = (newLogs: WeeklyLogEntry[]) => {
    setWeeklyLogs(newLogs);
    saveAllWeeklyLogs(newLogs);
  };

  const handleExportData = () => {
    const data = getAllDataForExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-craft-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAllWeekly = () => {
    const allWeeks = getWeeklyLogs();
    
    if (allWeeks.length === 0) {
      alert("还没有周报记录哦~");
      return;
    }

    let report = `📔 Daily Craft - 周报汇总\n`;
    report += `📅 生成日期: ${new Date().toLocaleDateString()}\n`;
    report += `=========================================\n\n`;

    allWeeks.forEach((week) => {
      report += `🏷️ 周次: ${week.weekNumber}\n`;
      if (week.moodSummary) report += `🌈 氛围: ${week.moodSummary}\n`;
      
      if (week.highlights && week.highlights.length > 0) {
        report += `\n✨ 高光时刻:\n`;
        week.highlights.forEach(h => report += `   - ${h}\n`);
      }

      report += `\n📝 总结内容:\n`;
      report += `${week.content || '(无内容)'}\n`;
      report += `\n-----------------------------------------\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Weekly-Summary-All-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Navigation & Linking ---
  const handleNavigate = (id: string, type: 'daily' | 'weekly') => {
    // Save current view to history stack before switching
    pushHistory();

    if (type === 'daily') {
      const entry = logs.find(l => l.id === id);
      if (entry) {
        setCurrentDaily(entry);
        setView('edit-daily');
      } else {
        alert('无法找到该日记');
      }
    } else if (type === 'weekly') {
      const entry = weeklyLogs.find(l => l.id === id);
      if (entry) {
        setCurrentWeekly(entry);
        setView('edit-weekly');
      } else {
         alert('无法找到该周报');
      }
    }
  };

  // --- Todo Integration ---
  const handleTodoCompleted = (todo: TodoItem) => {
    const timeStr = todo.time ? ` @ ${todo.time}` : '';
    const locStr = todo.location ? ` 在 ${todo.location}` : '';
    const ppStr = todo.people ? ` 和 ${todo.people}` : '';
    const logLine = `\n✅ ${todo.task}${timeStr}${ppStr}${locStr}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentLogs = getLogs();
    let todayLog = currentLogs.find(l => l.date.startsWith(todayStr));

    if (todayLog) {
      todayLog.content += logLine;
      saveLog(todayLog);
    } else {
      todayLog = createEmptyLog();
      todayLog.date = new Date().toISOString(); 
      todayLog.content = `✨ 今日打卡:${logLine}`;
      todayLog.mood = { sentiment: '充实', emoji: '💪', color: '#fcd34d' };
      saveLog(todayLog);
    }
    refreshData();
  };

  return (
    <div className="min-h-screen pb-12 font-sans text-gray-900 bg-paper-dark transition-colors duration-500 overflow-x-hidden">
      {/* Background Patterns */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gingham opacity-50"></div>
      
      {/* Floating Stickers Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-10 left-10 animate-float">
            <Sticker type="star" size={40} color="#fcd34d" rotation={15} />
         </div>
         <div className="absolute top-1/4 right-20 animate-wiggle">
            <Sticker type="heart" size={30} color="#fca5a5" rotation={-10} />
         </div>
         <div className="absolute bottom-20 left-1/3 animate-bounce-slow">
            <Sticker type="cloud" size={60} color="#c4def6" />
         </div>
         <div className="absolute top-1/2 left-10 opacity-60">
            <Sticker type="sparkle" size={25} color="#d8b4fe" />
         </div>
         <div className="absolute bottom-40 right-10 animate-float" style={{ animationDelay: '1s' }}>
            <Sticker type="cat" size={50} color="#cbd5e1" rotation={5} />
         </div>
      </div>

      <BackgroundAudio />
      <TodoModule onTaskCompleted={handleTodoCompleted} />

      <div className="relative z-10 pt-6">
        {view === 'list' && (
          <Dashboard 
            logs={logs} 
            weeklyLogs={weeklyLogs}
            onNewDaily={handleNewDaily} 
            onNewWeekly={handleNewWeekly}
            onEditDaily={handleEditDaily} 
            onEditWeekly={handleEditWeekly}
            onReorderDaily={handleReorderDaily}
            onReorderWeekly={handleReorderWeekly}
            onExport={handleExportData}
            onExportAllWeekly={handleExportAllWeekly}
            onQuickSaveDaily={handleQuickSaveDaily}
          />
        )}

        {view === 'edit-daily' && currentDaily && (
          <Editor 
            key={currentDaily.id}
            initialEntry={currentDaily}
            onSave={handleSaveDaily}
            onCancel={handleBack}
            onDelete={handleDeleteDaily}
            availableLogs={logs}
            availableWeeklyLogs={weeklyLogs}
            // Pass all data for linking
            // Editor prop 'onNavigate' matches signature
            onNavigate={handleNavigate}
          />
        )}

        {view === 'edit-weekly' && currentWeekly && (
          <WeeklyEditor 
            key={currentWeekly.id}
            initialEntry={currentWeekly}
            onSave={handleSaveWeekly}
            onCancel={handleBack}
            onDelete={handleDeleteWeekly}
            availableLogs={logs}
            availableWeeklyLogs={weeklyLogs}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      <footer className="fixed bottom-0 w-full py-2 text-center text-gray-400 text-sm font-marker bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-20">
        <p className="flex items-center justify-center gap-2">
          Daily Craft <Sticker type="heart" size={12} color="#fca5a5" /> {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
