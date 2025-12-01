
import React, { useState, useEffect } from 'react';
import { TodoItem } from '../types';
import { ClipboardList, Plus, Clock, MapPin, Users, X, Check, ChevronUp, ChevronDown, Calendar, RotateCcw } from 'lucide-react';
import { getTodos, saveTodos, generateUUID } from '../services/storage';
import { WashiTape } from './WashiTape';
import { Sticker } from './Sticker';

interface TodoModuleProps {
  onTaskCompleted: (todo: TodoItem) => void;
}

export const TodoModule: React.FC<TodoModuleProps> = ({ onTaskCompleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  
  // Helper for local ISO date
  const getLocalISODate = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Form State
  const [task, setTask] = useState('');
  const [date, setDate] = useState(getLocalISODate());
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');

  useEffect(() => {
    setTodos(getTodos());
  }, []);

  // Reset date to today whenever opened
  useEffect(() => {
    if (isOpen) {
      setDate(getLocalISODate());
    }
  }, [isOpen]);

  const handleAddTodo = () => {
    if (!task.trim()) return;

    const newTodo: TodoItem = {
      id: generateUUID(),
      task,
      date: date || undefined,
      time,
      location,
      people,
      completed: false
    };

    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    saveTodos(updatedTodos);

    // Reset form (keep date as is for convenience, or reset? let's keep it as is for bulk entry)
    setTask('');
    setTime('');
    setLocation('');
    setPeople('');
  };

  const handleComplete = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // Trigger parent callback to write to daily log
    onTaskCompleted(todo);

    // Remove from list (or mark completed)
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  const handleDelete = (id: string) => {
    const updatedTodos = todos.filter(t => t.id !== id);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  return (
    <div className={`fixed right-6 z-40 transition-all duration-300 ease-in-out flex flex-col items-end ${isOpen ? 'bottom-20' : 'bottom-20'}`}>
      
      {/* Main Panel */}
      {isOpen && (
        <div className="mb-4 w-96 sm:w-[30rem] bg-[#fffdf5] rounded-xl shadow-2xl border-2 border-dashed border-yellow-200 relative animate-in slide-in-from-bottom-10 fade-in origin-bottom-right">
          <WashiTape color="#fde047" rotation={-2} className="-top-3 left-1/3 w-32" pattern="dots" />
          
          <div className="p-6">
             <div className="flex justify-between items-center mb-5 border-b border-yellow-100 pb-3">
               <h3 className="font-cute text-2xl text-yellow-700 flex items-center font-bold">
                 <Sticker type="star" size={24} className="mr-2" color="#fbbf24" /> 
                 待办清单
               </h3>
               <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <ChevronDown className="w-6 h-6" />
               </button>
             </div>

             {/* Input Area */}
             <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 mb-5 space-y-4 shadow-inner">
                <input 
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  placeholder="要做什么呢？" 
                  className="w-full bg-transparent border-b-2 border-yellow-300 outline-none font-hand text-2xl placeholder-yellow-600/60 text-gray-900 pb-2 font-bold focus:border-yellow-500 transition-colors"
                />
                
                <div className="grid grid-cols-2 gap-3">
                   {/* Date Input */}
                   <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-yellow-200 shadow-sm focus-within:ring-2 focus-within:ring-yellow-100 focus-within:border-yellow-400 transition-all">
                      <Calendar className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full text-sm outline-none font-marker text-gray-800 placeholder-gray-400 bg-transparent"
                      />
                      <button 
                         onClick={() => setDate(getLocalISODate())}
                         className="ml-1 p-1 text-gray-300 hover:text-yellow-500 rounded-full"
                         title="回到今天"
                      >
                         <RotateCcw className="w-3 h-3" />
                      </button>
                   </div>
                   {/* Time Input */}
                   <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-yellow-200 shadow-sm focus-within:ring-2 focus-within:ring-yellow-100 focus-within:border-yellow-400 transition-all">
                      <Clock className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full text-sm outline-none font-marker text-gray-800 placeholder-gray-400 bg-transparent"
                      />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-yellow-200 shadow-sm focus-within:ring-2 focus-within:ring-yellow-100 focus-within:border-yellow-400 transition-all">
                      <MapPin className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="地点" 
                        className="w-full text-sm outline-none font-marker text-gray-800 placeholder-gray-400 bg-transparent"
                      />
                   </div>
                   <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-yellow-200 shadow-sm focus-within:ring-2 focus-within:ring-yellow-100 focus-within:border-yellow-400 transition-all">
                      <Users className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        value={people}
                        onChange={e => setPeople(e.target.value)}
                        placeholder="人员" 
                        className="w-full text-sm outline-none font-marker text-gray-800 placeholder-gray-400 bg-transparent"
                      />
                   </div>
                </div>

                <div className="flex justify-end">
                   <button 
                     onClick={handleAddTodo}
                     disabled={!task}
                     className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg px-6 py-2 shadow-md disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center font-bold"
                     title="添加任务"
                   >
                     <Plus className="w-5 h-5 mr-1" /> 添加
                   </button>
                </div>
             </div>

             {/* List Area */}
             <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-1">
               {todos.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 font-marker text-base flex flex-col items-center">
                   <div className="mb-2 text-2xl">📝</div>
                   暂时没有任务哦 ~
                 </div>
               ) : (
                 todos.map(t => (
                   <div key={t.id} className="group bg-white border-2 border-yellow-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex items-start gap-4 hover:border-yellow-300">
                      <button 
                        onClick={() => handleComplete(t.id)}
                        className="mt-1 w-6 h-6 rounded-full border-2 border-yellow-400 hover:bg-yellow-100 flex items-center justify-center transition-colors flex-shrink-0"
                        title="完成并写入日记"
                      >
                        <Check className="w-4 h-4 text-yellow-600 opacity-0 hover:opacity-100" />
                      </button>
                      
                      <div className="flex-grow min-w-0">
                        <div className="font-hand text-xl text-gray-900 leading-tight break-words font-medium">{t.task}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.date && <span className="text-sm font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1 border border-gray-200"><Calendar className="w-3.5 h-3.5"/> {t.date}</span>}
                          {t.time && <span className="text-sm font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100"><Clock className="w-3.5 h-3.5"/> {t.time}</span>}
                          {t.location && <span className="text-sm font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded flex items-center gap-1 border border-green-100"><MapPin className="w-3.5 h-3.5"/> {t.location}</span>}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-1"
                        title="删除任务"
                      >
                        <X className="w-5 h-5" />
                      </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-yellow-300 hover:bg-yellow-400 text-yellow-800 p-3.5 rounded-full shadow-lg border-4 border-white transition-transform hover:scale-110 flex items-center justify-center group"
        title="待办事项"
      >
        {isOpen ? <ChevronDown className="w-7 h-7" /> : <ClipboardList className="w-7 h-7" />}
        {!isOpen && todos.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce border-2 border-white">
            {todos.length}
          </span>
        )}
      </button>

    </div>
  );
};
