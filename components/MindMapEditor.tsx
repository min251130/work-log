
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, WeeklyLogEntry, MindMapEntry } from '../types';
import { WashiTape } from './WashiTape';
import { Sticker } from './Sticker';
import { Save, ArrowLeft, Trash2, Printer, BrainCircuit, Plus, Minus, Move, LayoutTemplate, Type, Link as LinkIcon, X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface MindMapEditorProps {
  initialEntry: MindMapEntry;
  onSave: (entry: MindMapEntry) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  availableLogs?: LogEntry[];
  availableWeeklyLogs?: WeeklyLogEntry[];
  availableMindMaps?: MindMapEntry[];
  onNavigate?: (id: string, type: 'daily' | 'weekly' | 'mindmap') => void;
}

// --- Types & Helpers ---

interface MapNode {
  id: string;
  content: string;
  children: MapNode[];
  isRoot?: boolean;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Markdown List -> Tree Object
const parseMarkdownToTree = (text: string): MapNode => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { id: generateId(), content: '中心主题', children: [], isRoot: true };

  const rootLine = lines[0];
  const rootContent = rootLine.replace(/^[-*]\s+/, '');
  const root: MapNode = { id: generateId(), content: rootContent, children: [], isRoot: true };
  
  const stack: { node: MapNode; level: number }[] = [{ node: root, level: 0 }];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)([-*])\s+(.*)$/);
    if (!match) continue;

    const indent = match[1].replace(/\t/g, '  ').length;
    const level = Math.floor(indent / 2); // Assuming 2 spaces per level
    const content = match[3];
    const newNode: MapNode = { id: generateId(), content, children: [] };

    // Backtrack stack to find parent
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(newNode);
    }
    stack.push({ node: newNode, level });
  }

  return root;
};

// Tree Object -> Markdown List
const treeToMarkdown = (node: MapNode, depth: number = 0): string => {
  const indent = "  ".repeat(depth);
  // Root usually doesn't need indent if it's the very first line, but standard MD lists often start at indent 0
  let md = `${indent}- ${node.content}\n`;
  node.children.forEach(child => {
    md += treeToMarkdown(child, depth + 1);
  });
  return md;
};

// --- Interactive Node Component ---

interface InteractiveNodeProps {
  node: MapNode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChangeContent: (id: string, newContent: string) => void;
  onNavigate?: (id: string, type: 'daily' | 'weekly' | 'mindmap') => void;
}

const InteractiveNode: React.FC<InteractiveNodeProps> = ({ 
  node, 
  selectedId, 
  onSelect, 
  onChangeContent,
  onNavigate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelected = selectedId === node.id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    onSelect(node.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
    }
  };

  // Content Renderer (supports simple links display)
  const renderContent = (text: string) => {
     const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
     return parts.map((part, i) => {
         const mdMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
         if (mdMatch) {
             const [_, label, url] = mdMatch;
             return (
                 <span key={i} className="text-blue-500 hover:underline cursor-pointer" onClick={(e) => {
                     e.stopPropagation();
                     if (url.startsWith('log:') && onNavigate) {
                         const [__, type, id] = url.split(':');
                         onNavigate(id, type as any);
                     } else {
                         window.open(url, '_blank');
                     }
                 }}>
                     {label}
                 </span>
             );
         }
         return <span key={i}>{part}</span>;
     });
  };

  return (
    <div className="flex flex-col items-center mx-2">
      <div 
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`mindmap-node relative transition-all duration-200 min-w-[100px] max-w-[300px]
          ${isSelected ? 'ring-4 ring-purple-200 border-purple-400 scale-105 z-20' : 'border-2 border-purple-200 hover:border-purple-300'}
          ${node.isRoot ? 'bg-purple-50 text-xl font-bold px-6 py-3' : 'bg-white text-lg p-2'}
        `}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={node.content}
            onChange={(e) => onChangeContent(node.id, e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none text-center font-hand min-w-[100px]"
          />
        ) : (
          <div className="font-hand cursor-text text-gray-700 break-words whitespace-pre-wrap">
            {renderContent(node.content)}
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mindmap-children relative flex pt-8">
           {node.children.map((child) => (
             <div key={child.id} className="mindmap-branch relative px-2">
               <InteractiveNode 
                 node={child} 
                 selectedId={selectedId} 
                 onSelect={onSelect} 
                 onChangeContent={onChangeContent}
                 onNavigate={onNavigate}
               />
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export const MindMapEditor: React.FC<MindMapEditorProps> = ({ 
  initialEntry, 
  onSave, 
  onCancel, 
  onDelete,
  onNavigate
}) => {
  const [title, setTitle] = useState(initialEntry.title);
  
  // Tree State
  const [tree, setTree] = useState<MapNode>(() => parseMarkdownToTree(initialEntry.content));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Viewport State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Tree Operations ---

  const updateNodeContent = (id: string, newContent: string) => {
    const updateRecursive = (node: MapNode): MapNode => {
      if (node.id === id) return { ...node, content: newContent };
      return { ...node, children: node.children.map(updateRecursive) };
    };
    setTree(updateRecursive(tree));
  };

  const addChildNode = () => {
    if (!selectedId) return;
    const newNode: MapNode = { id: generateId(), content: '新节点', children: [] };
    
    const addRecursive = (node: MapNode): MapNode => {
      if (node.id === selectedId) {
        return { ...node, children: [...node.children, newNode] };
      }
      return { ...node, children: node.children.map(addRecursive) };
    };
    setTree(addRecursive(tree));
    // Auto select new node
    setTimeout(() => setSelectedId(newNode.id), 50);
  };

  const addSiblingNode = () => {
     if (!selectedId || selectedId === tree.id) return; // Cannot add sibling to root
     
     const newNode: MapNode = { id: generateId(), content: '同级节点', children: [] };

     const addRecursive = (node: MapNode): MapNode => {
        // Check if any child matches selectedId
        const index = node.children.findIndex(c => c.id === selectedId);
        if (index !== -1) {
            const newChildren = [...node.children];
            newChildren.splice(index + 1, 0, newNode);
            return { ...node, children: newChildren };
        }
        return { ...node, children: node.children.map(addRecursive) };
     };
     setTree(addRecursive(tree));
     setTimeout(() => setSelectedId(newNode.id), 50);
  };

  const deleteNode = () => {
    if (!selectedId || selectedId === tree.id) {
        if(selectedId === tree.id) alert("不能删除中心主题哦");
        return;
    }
    
    const deleteRecursive = (node: MapNode): MapNode => {
      return {
        ...node,
        children: node.children.filter(c => c.id !== selectedId).map(deleteRecursive)
      };
    };
    setTree(deleteRecursive(tree));
    setSelectedId(null);
  };

  // --- Viewport Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       const delta = e.deltaY > 0 ? 0.9 : 1.1;
       setScale(s => Math.min(Math.max(s * delta, 0.2), 3));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if clicking on background
    if ((e.target as HTMLElement).closest('.mindmap-node')) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    // Deselect if clicking background
    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const content = treeToMarkdown(tree);
    onSave({
      ...initialEntry,
      title,
      content,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-paper-dark flex flex-col font-sans overflow-hidden">
      
      {/* 1. Transparent Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-start pointer-events-none">
         <div className="flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-sm border border-gray-200">
             <button onClick={onCancel} className="text-gray-500 hover:text-gray-800 transition-colors">
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="w-px h-4 bg-gray-300 mx-2"></div>
             <BrainCircuit className="w-5 h-5 text-purple-500" />
             <input 
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               className="bg-transparent outline-none font-cute text-xl text-gray-700 w-32 sm:w-64 placeholder-gray-400"
               placeholder="思维导图标题"
             />
         </div>

         <div className="flex gap-2 pointer-events-auto">
             <button onClick={() => onDelete(initialEntry.id)} className="p-2.5 bg-white/90 rounded-full text-red-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 transition-all">
                <Trash2 className="w-5 h-5" />
             </button>
             <button onClick={handleSave} className="flex items-center px-6 py-2 bg-purple-500 text-white rounded-full shadow-md hover:bg-purple-600 transition-all font-bold tracking-wide">
                <Save className="w-4 h-4 mr-2" /> 保存
             </button>
         </div>
      </div>

      {/* 2. Infinite Canvas */}
      <div 
        ref={containerRef}
        className={`flex-grow relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background Grid */}
        <div 
           className="absolute inset-0 bg-grid-paper bg-[length:40px_40px] opacity-30 pointer-events-none"
           style={{
             backgroundPosition: `${position.x}px ${position.y}px`,
             transform: `scale(${scale})`, // Optional: scale grid or not? keeping it static often feels better, but dynamic is more realistic. Let's keep grid static sized but moved.
             // Actually, scaling background pattern is tricky without visual artifacts. Let's just move it.
           }}
        ></div>

        {/* Tree Container (Transformable) */}
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-linear mindmap-tree"
          style={{
            transform: `translate(${position.x + (containerRef.current?.clientWidth || 0)/2}px, ${position.y + 100}px) scale(${scale})`,
            // Centering logic: initial translate to center of screen + drag offset
          }}
        >
           <InteractiveNode 
             node={tree} 
             selectedId={selectedId} 
             onSelect={setSelectedId}
             onChangeContent={updateNodeContent}
             onNavigate={onNavigate}
           />
        </div>
      </div>

      {/* 3. Floating Action Toolbar (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4 pointer-events-none">
        
        {/* Operations for Selected Node */}
        {selectedId && (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-2 flex items-center gap-1 animate-in slide-in-from-bottom-5 fade-in pointer-events-auto">
             <button onClick={addChildNode} className="p-2 hover:bg-purple-50 rounded-lg text-gray-600 flex flex-col items-center gap-1 min-w-[60px] transition-colors group">
               <Plus className="w-5 h-5 text-purple-500" />
               <span className="text-[10px] font-bold text-gray-400 group-hover:text-purple-500">子节点</span>
             </button>
             <div className="w-px h-8 bg-gray-100 mx-1"></div>
             <button onClick={addSiblingNode} disabled={selectedId === tree.id} className="p-2 hover:bg-purple-50 rounded-lg text-gray-600 flex flex-col items-center gap-1 min-w-[60px] transition-colors group disabled:opacity-30 disabled:cursor-not-allowed">
               <LayoutTemplate className="w-5 h-5 text-purple-500" />
               <span className="text-[10px] font-bold text-gray-400 group-hover:text-purple-500">同级节点</span>
             </button>
             <div className="w-px h-8 bg-gray-100 mx-1"></div>
             <button onClick={deleteNode} disabled={selectedId === tree.id} className="p-2 hover:bg-red-50 rounded-lg text-gray-600 flex flex-col items-center gap-1 min-w-[60px] transition-colors group disabled:opacity-30 disabled:cursor-not-allowed">
               <Trash2 className="w-5 h-5 text-red-400" />
               <span className="text-[10px] font-bold text-gray-400 group-hover:text-red-400">删除</span>
             </button>
          </div>
        )}

        {/* View Controls */}
        <div className="bg-white/90 backdrop-blur rounded-full shadow-lg border border-gray-200 p-1.5 flex items-center gap-2 pointer-events-auto">
           <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
             <ZoomOut className="w-4 h-4" />
           </button>
           <span className="text-xs font-marker text-gray-400 w-8 text-center">{Math.round(scale * 100)}%</span>
           <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
             <ZoomIn className="w-4 h-4" />
           </button>
           <div className="w-px h-4 bg-gray-300 mx-1"></div>
           <button onClick={() => { setPosition({x:0, y:0}); setScale(1); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500" title="回到中心">
             <Maximize className="w-4 h-4" />
           </button>
        </div>
      </div>

       {/* Help Text */}
       {!selectedId && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 text-gray-400/50 font-hand text-sm pointer-events-none select-none">
           点击节点开始编辑 · 拖拽移动画布 · 滚轮缩放
         </div>
       )}

    </div>
  );
};
