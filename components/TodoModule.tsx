
import React, { useState, useEffect, useRef } from 'react';
import { TodoItem } from '../types';
import { ClipboardList, Plus, Clock, MapPin, Users, X, Check, ChevronDown, Calendar, RotateCcw, GripHorizontal } from 'lucide-react';
import { getTodos, saveTodos, generateUUID } from '../services/storage';
import { WashiTape } from './WashiTape';
import { Sticker } from './Sticker';

interface TodoModuleProps {
  onTaskCompleted: (todo: TodoItem) => void;
}

export const TodoModule: React.FC<TodoModuleProps> = ({ onTaskCompleted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  
  // Draggable State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 }); // Mouse position relative to element
  const panelRef = useRef<HTMLDivElement>(null);

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
    
    // Set initial position (Bottom Rightish)
    // We do this in useEffect to access window safely
    const initialX = window.innerWidth > 640 ? window.innerWidth - 500 : (window.innerWidth - (window.innerWidth * 0.9)) / 2;
    const initialY = window.innerHeight > 800 ? window.innerHeight - 650 : window.innerHeight * 0.1;
    setPosition({ x: initialX, y: initialY });
  }, []);

  // Reset date to today whenever opened
  useEffect(() => {
    if (isOpen) {
      setDate(getLocalISODate());
    }
  }, [isOpen]);

  // --- Drag Logic ---
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!panelRef.current) return;
    // Only allow dragging from the header handle
    const target = e.target as HTMLElement;
    // Do not drag if clicking input, button, or list items
    if (target.closest('button') || target.tagName === 'INPUT' || target.closest('.overflow-y-auto')) return;

    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    
    const rect = panelRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Capture pointer to track even if mouse leaves window
    panelRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;

    // Simple boundary check (optional, but keeps it on screen)
    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight - 50;
    
    setPosition({
      x: Math.min(Math.max(0, newX), maxX),
      y: Math.min(Math.max(0, newY), maxY)
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (panelRef.current) {
      panelRef.current.releasePointerCapture(e.pointerId);
    }
  };


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

    // Reset form fields
    setTask('');
    setTime('');
    setLocation('');
    setPeople('');
  };

  const handleComplete = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    onTaskCompleted(todo);
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
    <>
      {/* Floating Toggle Button (Fixed Position) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 bottom-20 z-40 bg-yellow-300 hover:bg-yellow-400 text-yellow-800 p-3.5 rounded-full shadow-lg border-4 border-white transition-transform hover:scale-110 flex items-center justify-center group ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="打开待办事项"
      >
        <ClipboardList className="w-7 h-7" />
        {todos.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce border-2 border-white">
            {todos.length}
          </span>
        )}
      </button>

      {/* Draggable Panel */}
      {isOpen && (
        <div 
          ref={panelRef}
          // Remove global touch-action: none so children can scroll
          style={{ 
            left: position.x, 
            top: position.y
          }}
          className="fixed z-50 w-[90vw] sm:w-[30rem] bg-[#fffdf5] rounded-xl shadow-2xl border-2 border-dashed border-yellow-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh] sm:max-h-[80vh]"
        >
          {/* Header & Drag Handle - Apply touch-action: none HERE specifically */}
          <div 
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ touchAction: 'none' }}
            className="relative p-4 pb-2 border-b border-yellow-100 flex justify-between items-center bg-yellow-50/50 rounded-t-xl cursor-move select-none flex-shrink-0"
          >
             <WashiTape color="#fde047" rotation={-2} className="-top-3 left-1/3 w-32 pointer-events-none" pattern="dots" />
             
             <div className="flex items-center gap-2">
               <GripHorizontal className="w-5 h-5 text-yellow-400" />
               <h3 className="font-cute text-xl sm:text-2xl text-yellow-700 flex items-center font-bold">
                 <Sticker type="star" size={20} className="mr-2" color="#fbbf24" /> 
                 待办清单
               </h3>
             </div>
             
             <button 
               onClick={() => setIsOpen(false)} 
               className="text-gray-400 hover:text-gray-600 p-1 hover:bg-yellow-100 rounded-full transition-colors"
               onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button click
             >
                 <ChevronDown className="w-6 h-6" />
             </button>
          </div>

          {/* Scrollable Body - Allow touch events naturally */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
             
             {/* Input Area */}
             <div 
                className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 space-y-3 shadow-inner"
                onPointerDown={(e) => e.stopPropagation()} // Prevent drag inside inputs
             >
                <input 
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  placeholder="要做什么呢？" 
                  className="w-full bg-transparent border-b-2 border-yellow-300 outline-none font-hand text-xl placeholder-yellow-600/60 text-gray-900 pb-1 font-bold focus:border-yellow-500 transition-colors"
                />
                
                <div className="grid grid-cols-2 gap-2">
                   {/* Date Input */}
                   <div className="flex items-center bg-white rounded-lg px-2 py-1.5 border border-yellow-200 shadow-sm">
                      <Calendar className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full text-xs outline-none font-marker text-gray-800 bg-transparent"
                      />
                   </div>
                   {/* Time Input */}
                   <div className="flex items-center bg-white rounded-lg px-2 py-1.5 border border-yellow-200 shadow-sm">
                      <Clock className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        type="time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full text-xs outline-none font-marker text-gray-800 bg-transparent"
                      />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   <div className="flex items-center bg-white rounded-lg px-2 py-1.5 border border-yellow-200 shadow-sm">
                      <MapPin className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="地点" 
                        className="w-full text-xs outline-none font-marker text-gray-800 bg-transparent"
                      />
                   </div>
                   <div className="flex items-center bg-white rounded-lg px-2 py-1.5 border border-yellow-200 shadow-sm">
                      <Users className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                      <input 
                        value={people}
                        onChange={e => setPeople(e.target.value)}
                        placeholder="人员" 
                        className="w-full text-xs outline-none font-marker text-gray-800 bg-transparent"
                      />
                   </div>
                </div>

                <div className="flex justify-end pt-1">
                   <button 
                     onClick={handleAddTodo}
                     disabled={!task}
                     className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg px-4 py-1.5 shadow-md disabled:opacity-50 transition-all transform active:scale-95 flex items-center justify-center font-bold text-sm"
                   >
                     <Plus className="w-4 h-4 mr-1" /> 添加
                   </button>
                </div>
             </div>

             {/* List Area */}
             <div className="space-y-2 pb-2" onPointerDown={(e) => e.stopPropagation()}>
               {todos.length === 0 ? (
                 <div className="text-center py-6 text-gray-400 font-marker text-sm flex flex-col items-center">
                   <div className="mb-2 text-2xl opacity-50">📝</div>
                   暂时没有任务哦 ~
                 </div>
               ) : (
                 todos.map(t => (
                   <div key={t.id} className="group bg-white border-2 border-yellow-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex items-start gap-3 hover:border-yellow-300">
                      <button 
                        onClick={() => handleComplete(t.id)}
                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-yellow-400 hover:bg-yellow-100 flex items-center justify-center transition-colors flex-shrink-0"
                        title="完成并写入日记"
                      >
                        <Check className="w-3.5 h-3.5 text-yellow-600 opacity-0 hover:opacity-100" />
                      </button>
                      
                      <div className="flex-grow min-w-0">
                        <div className="font-hand text-lg text-gray-900 leading-tight break-words font-medium">{t.task}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {t.date && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-gray-200"><Calendar className="w-3 h-3"/> {t.date}</span>}
                          {t.time && <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-100"><Clock className="w-3 h-3"/> {t.time}</span>}
                          {t.location && <span className="text-[10px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-green-100"><MapPin className="w-3 h-3"/> {t.location}</span>}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      )}
    </>
  );
};
