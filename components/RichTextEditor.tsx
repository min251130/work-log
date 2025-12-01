
import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, WeeklyLogEntry } from '../types';
import { Link as LinkIcon, Smile, Search, Globe, X, Eye, EyeOff, Image } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  availableLogs?: LogEntry[];
  availableWeeklyLogs?: WeeklyLogEntry[];
  onNavigate?: (id: string, type: 'daily' | 'weekly') => void;
}

// --- SmartLink Component ---
// Handles the rendering and interaction of a single link (internal or external)

const SmartLink: React.FC<{
  text: string;
  url: string;
  onNavigate?: (id: string, type: 'daily' | 'weekly') => void;
}> = ({ text, url, onNavigate }) => {
  
  const safeUrl = url.trim();
  const isInternal = safeUrl.startsWith('log:');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling issues
    if (isInternal) {
      e.preventDefault();
      // Format: log:daily:ID, log:weekly:ID
      const parts = safeUrl.split(':');
      if (parts.length >= 3 && onNavigate) {
        const type = parts[1] as 'daily' | 'weekly';
        // Join the rest in case ID has colons (unlikely for UUID but safe)
        const id = parts.slice(2).join(':'); 
        onNavigate(id, type);
      } else {
        console.warn("Invalid internal link format:", safeUrl);
      }
    }
  };

  if (isInternal) {
    const type = safeUrl.split(':')[1];
    let colorClass = "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200";
    if (type === 'weekly') colorClass = "bg-green-100 text-green-700 border-green-300 hover:bg-green-200";

    return (
      <span 
        onClick={handleClick}
        className={`inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md border border-dashed cursor-pointer select-none font-marker transition-all transform hover:-translate-y-0.5 hover:shadow-sm z-10 relative ${colorClass}`}
        title={`点击跳转: ${text}`}
      >
        🔗 {text}
      </span>
    );
  }

  // External Link Handling
  let href = safeUrl;
  // If it lacks protocol but looks like a web link (e.g. www.google.com), add https://
  if (!href.startsWith('http') && !href.startsWith('log:') && (href.startsWith('www.') || href.includes('.'))) {
      href = `https://${href}`;
  }

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 mx-1 px-1 rounded text-blue-500 hover:text-blue-700 hover:underline cursor-pointer select-text transition-colors z-10 relative font-sans text-lg"
      title={`访问: ${href}`}
      onClick={(e) => e.stopPropagation()}
    >
      🌍 {text}
    </a>
  );
};

// --- RenderedContent Component ---
// Parses the content string and renders text segments, SmartLinks, and Images

const RenderedContent: React.FC<{ 
  content: string; 
  onNavigate?: (id: string, type: 'daily' | 'weekly') => void;
}> = ({ content, onNavigate }) => {
  
  // Split by newlines to preserve paragraph structure
  const paragraphs = content.split('\n');

  return (
    <div className="font-hand text-xl leading-relaxed text-gray-800 space-y-2 whitespace-pre-wrap select-text w-full">
      {paragraphs.map((para, idx) => {
        // Regex Explanation:
        // 0. Image Match: !\[([^\]]*)\]\(([^)]+)\)  -> Matches ![Alt](Url)
        // 1. Markdown Link: \[([^\]]+)\]\(([^)]+)\)  -> Matches [Text](Url)
        // 2. HTTP/HTTPS URL: https?:\/\/[^\s]+       -> Matches http://example.com
        // 3. WWW URL: www\.[^\s]+                    -> Matches www.example.com
        // 4. Raw Internal ID: log:(?:daily|weekly):[a-zA-Z0-9-]+ -> Matches log:daily:123
        const parts = para.split(/(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+|www\.[^\s]+|log:(?:daily|weekly):[a-zA-Z0-9-]+)/g);
        
        return (
          <div key={idx} className="min-h-[1.5em] break-words">
            {parts.map((part, pIdx) => {
              if (!part) return null;

              // 0. Image Match
              const imgMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
              if (imgMatch) {
                const [_, alt, src] = imgMatch;
                return (
                  <img 
                    key={pIdx} 
                    src={src} 
                    alt={alt} 
                    className="max-w-full h-auto max-h-[400px] object-contain rounded-lg shadow-sm my-2 border-4 border-white transform rotate-1 hover:rotate-0 transition-transform cursor-pointer" 
                    title={alt}
                    onClick={() => window.open(src, '_blank')}
                  />
                );
              }

              // 1. Markdown Link Match
              const mdLinkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
              if (mdLinkMatch) {
                const [_, text, url] = mdLinkMatch;
                return <SmartLink key={pIdx} text={text} url={url} onNavigate={onNavigate} />;
              }

              // 2. Raw Internal Link Match (e.g. log:daily:123 typed directly)
              if (part.match(/^log:(?:daily|weekly):/)) {
                  return <SmartLink key={pIdx} text="引用记录" url={part} onNavigate={onNavigate} />;
              }

              // 3. Raw Web URL Match (http://... or www....)
              if (part.match(/^(https?:\/\/|www\.)/)) {
                  // Clean trailing punctuation (.,;!?) that might be part of the sentence
                  const cleanMatch = part.match(/^((?:https?:\/\/|www\.)[^\s.,;!?)]+)([.,;!?)]*)$/);
                  if (cleanMatch) {
                    const [_, url, trailing] = cleanMatch;
                    return (
                      <React.Fragment key={pIdx}>
                        <SmartLink text={url} url={url} onNavigate={onNavigate} />
                        {trailing}
                      </React.Fragment>
                    );
                  }
                  // Fallback if regex didn't split cleanly
                  return <SmartLink key={pIdx} text={part} url={part} onNavigate={onNavigate} />;
              }

              // 4. Plain Text
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder,
  className = '',
  style,
  availableLogs = [],
  availableWeeklyLogs = [],
  onNavigate
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modes
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Link Modals
  const [showLinkModal, setShowLinkModal] = useState(false); // Internal
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false); // External
  const [showImageModal, setShowImageModal] = useState(false); // Image
  
  // External Link State
  const [extUrl, setExtUrl] = useState('');
  const [extText, setExtText] = useState('');

  // Image State
  const [imgUrl, setImgUrl] = useState('');
  const [imgAlt, setImgAlt] = useState('');

  // Emoji Picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const EMOJIS = ["😀", "😂", "🥰", "😎", "😭", "😡", "👍", "🙏", "🎉", "🔥", "❤️", "✨", "🌟", "🌸", "🍔", "☕", "📝", "💤", "🐼", "🎋"];

  // Check if any modal is open to lock toolbar visibility
  const isAnyModalOpen = showEmojiPicker || showLinkModal || showExternalLinkModal || showImageModal;

  // --- Auto-Resize Textarea ---
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (!isPreviewMode) {
      adjustHeight();
    }
  }, [content, isPreviewMode]);

  // --- Insertion Helpers ---
  const insertText = (textToInsert: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newContent = content.substring(0, start) + textToInsert + content.substring(end);
    
    onChange(newContent);
    
    // Restore focus and cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
        adjustHeight();
      }
    }, 0);
  };

  // --- Paste Handler (Image Support) ---
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          if (file.size > 2 * 1024 * 1024) {
             alert("图片太大了 (>2MB)，建议压缩后粘贴！");
             return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            // Insert at cursor
            if (textareaRef.current) {
                const start = textareaRef.current.selectionStart;
                const end = textareaRef.current.selectionEnd;
                const newContent = content.substring(0, start) + `![Pasted Image](${base64})` + content.substring(end);
                onChange(newContent);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // --- External Link Handlers ---
  const openExternalLinkModal = () => {
    // Try to grab selected text as default title
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        setExtText(content.substring(start, end));
      } else {
        setExtText('');
      }
    }
    setExtUrl('');
    setShowExternalLinkModal(true);
  };

  const confirmExternalLink = () => {
    if (extUrl) {
      // Basic URL cleanup
      let finalUrl = extUrl.trim();
      const title = extText.trim() || finalUrl;
      const linkMarkdown = `[${title}](${finalUrl})`;
      insertText(linkMarkdown);
    }
    setShowExternalLinkModal(false);
  };

  // --- Image Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simple size check (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("图片太大了 (>2MB)，建议使用链接或更小的图片哦！");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmInsertImage = () => {
    if (imgUrl) {
      const alt = imgAlt.trim() || '图片';
      insertText(`![${alt}](${imgUrl})`);
      setShowImageModal(false);
      setImgUrl('');
      setImgAlt('');
    }
  };

  return (
    <div className={`flex flex-col relative group ${className}`} style={style}>
      
      {/* Toolbar */}
      <div className={`flex flex-wrap items-center gap-2 mb-3 p-2 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-200 transition-all duration-300 shadow-sm hover:shadow-md z-20 ${isAnyModalOpen ? 'opacity-100' : 'opacity-100'}`}>
        
        {/* Manual Preview Toggle */}
        <button 
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-2 text-sm font-cute font-bold ${isPreviewMode ? 'bg-blue-400 text-white shadow-md' : 'bg-white hover:bg-blue-50 text-gray-500 hover:text-blue-500'}`}
          title={isPreviewMode ? "返回编辑" : "预览模式 (可点击链接)"}
        >
           {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
           <span>{isPreviewMode ? '继续编辑' : '预览 / 跳转'}</span>
        </button>
        
        {!isPreviewMode && (
          <span className="text-xs text-gray-400 font-hand ml-2">← 点击这里预览跳转</span>
        )}

        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* Emoji Picker */}
        <div className="relative">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-yellow-100 text-gray-500 hover:text-yellow-600 rounded-full transition-colors"
            title="插入表情"
            disabled={isPreviewMode}
          >
            <Smile className="w-5 h-5" />
          </button>
          {showEmojiPicker && !isPreviewMode && (
            <div 
              className="absolute top-full left-0 mt-2 bg-white p-3 rounded-2xl shadow-xl border-2 border-yellow-100 z-[100] grid grid-cols-6 gap-2 w-72 animate-in fade-in zoom-in-95 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {EMOJIS.map(emo => (
                <button 
                  key={emo} 
                  onClick={() => { insertText(emo); setShowEmojiPicker(false); }}
                  className="text-2xl hover:bg-yellow-50 p-2 rounded-lg transition-transform hover:scale-110"
                >
                  {emo}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Internal Link Picker */}
        <div className="relative">
          <button 
             onClick={() => setShowLinkModal(!showLinkModal)}
             className="p-2 hover:bg-blue-100 text-gray-500 hover:text-blue-600 rounded-full transition-colors"
             title="引用其他内容"
             disabled={isPreviewMode}
          >
             <LinkIcon className="w-5 h-5" />
          </button>
          
          {showLinkModal && !isPreviewMode && (
            <div 
              className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border-2 border-blue-100 z-[100] p-3 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="text-xs font-bold text-gray-400 mb-2 px-2 uppercase tracking-wider">每日手账</div>
               {availableLogs.length === 0 && (
                   <div className="text-sm text-gray-300 px-2 mb-2 font-hand">暂无</div>
               )}
               {availableLogs.map(log => (
                 <button
                   key={log.id}
                   onClick={() => {
                     const link = `[📅 ${log.date.split('T')[0]} ${log.mood.emoji}](log:daily:${log.id})`;
                     insertText(link);
                     setShowLinkModal(false);
                   }}
                   className="w-full text-left p-2 hover:bg-blue-50 rounded-lg text-sm text-gray-700 truncate font-hand transition-colors border-b border-gray-50 mb-1"
                 >
                   📅 <span className="font-bold">{log.date.split('T')[0]}</span> {log.mood.emoji} <span className="text-gray-400 text-xs ml-1">{log.content.slice(0, 10)}...</span>
                 </button>
               ))}

               <div className="text-xs font-bold text-gray-400 mb-2 mt-3 px-2 uppercase tracking-wider">周报总结</div>
               {availableWeeklyLogs.length === 0 && (
                   <div className="text-sm text-gray-300 px-2 mb-2 font-hand">暂无</div>
               )}
               {availableWeeklyLogs.map(log => (
                 <button
                   key={log.id}
                   onClick={() => {
                     const link = `[📕 周报 ${log.weekNumber}](log:weekly:${log.id})`;
                     insertText(link);
                     setShowLinkModal(false);
                   }}
                   className="w-full text-left p-2 hover:bg-green-50 rounded-lg text-sm text-gray-700 truncate font-hand transition-colors border-b border-gray-50 mb-1"
                 >
                   📕 <span className="font-bold">{log.weekNumber}</span> {log.moodSummary}
                 </button>
               ))}
            </div>
          )}
        </div>

        {/* External Link Picker */}
        <div className="relative">
            <button 
               onClick={openExternalLinkModal}
               className="p-2 hover:bg-green-100 text-gray-500 hover:text-green-600 rounded-full transition-colors"
               title="插入网址"
               disabled={isPreviewMode}
            >
               <Globe className="w-5 h-5" />
            </button>
            
            {showExternalLinkModal && !isPreviewMode && (
               <div 
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border-2 border-green-100 z-[100] p-5 animate-in fade-in zoom-in-95 cursor-default"
                  onClick={(e) => e.stopPropagation()}
               >
                  <h4 className="font-cute font-bold text-gray-600 mb-3 text-lg flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500"/> 插入外部链接
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-bold ml-1">链接文字</label>
                      <input 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-green-300 transition-colors cursor-text"
                        placeholder="例如: 好听的歌"
                        value={extText}
                        onChange={(e) => setExtText(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold ml-1">网址 URL</label>
                      <input 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-green-300 transition-colors cursor-text"
                        placeholder="https://..."
                        value={extUrl}
                        onChange={(e) => setExtUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                     <button 
                       onClick={() => setShowExternalLinkModal(false)} 
                       className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1 font-hand"
                     >
                       取消
                     </button>
                     <button 
                       onClick={confirmExternalLink} 
                       className="text-sm bg-green-400 text-white px-4 py-1.5 rounded-full hover:bg-green-500 shadow-sm font-bold tracking-wide transition-transform active:scale-95"
                     >
                       确认插入
                     </button>
                  </div>
               </div>
            )}
        </div>

        {/* Image Picker */}
        <div className="relative">
            <button 
               onClick={() => setShowImageModal(!showImageModal)}
               className="p-2 hover:bg-purple-100 text-gray-500 hover:text-purple-600 rounded-full transition-colors"
               title="插入图片"
               disabled={isPreviewMode}
            >
               <Image className="w-5 h-5" />
            </button>
            
            {showImageModal && !isPreviewMode && (
               <div 
                  className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border-2 border-purple-100 z-[100] p-5 animate-in fade-in zoom-in-95 cursor-default"
                  onClick={(e) => e.stopPropagation()}
               >
                  <h4 className="font-cute font-bold text-gray-600 mb-3 text-lg flex items-center gap-2">
                    <Image className="w-4 h-4 text-purple-500"/> 插入图片
                  </h4>
                  <div className="space-y-3">
                    <div>
                       <label className="text-xs text-gray-400 font-bold ml-1">图片描述 (Alt)</label>
                       <input 
                         className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-purple-300 transition-colors cursor-text"
                         placeholder="照片描述..."
                         value={imgAlt}
                         onChange={(e) => setImgAlt(e.target.value)}
                       />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-bold ml-1">图片链接 (URL)</label>
                      <input 
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-purple-300 transition-colors cursor-text"
                        placeholder="https://..."
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 my-1">
                       <div className="h-px bg-gray-200 flex-grow"></div>
                       <span className="text-xs text-gray-400 font-bold">或者</span>
                       <div className="h-px bg-gray-200 flex-grow"></div>
                    </div>
                    <div className="text-center">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-2 border-2 border-dashed border-purple-200 rounded-lg text-purple-400 hover:bg-purple-50 hover:border-purple-300 transition-colors font-bold text-sm"
                        >
                           选择本地图片 (Max 2MB)
                        </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                     <button 
                       onClick={() => setShowImageModal(false)} 
                       className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1 font-hand"
                     >
                       取消
                     </button>
                     <button 
                       onClick={confirmInsertImage} 
                       className="text-sm bg-purple-400 text-white px-4 py-1.5 rounded-full hover:bg-purple-500 shadow-sm font-bold tracking-wide transition-transform active:scale-95"
                     >
                       插入图片
                     </button>
                  </div>
               </div>
            )}
        </div>

      </div>

      {/* Editor / Preview Area */}
      <div className="relative min-h-[300px] flex-grow">
        {isPreviewMode ? (
          <div className="absolute inset-0 p-4 bg-gray-50/50 rounded-lg border border-gray-100 shadow-inner overflow-y-auto custom-scrollbar">
             <RenderedContent 
               content={content} 
               onNavigate={onNavigate} 
             />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none resize-none font-hand text-xl leading-relaxed text-gray-800 overflow-hidden min-h-[300px] cursor-text caret-dopamine"
            spellCheck={false}
          />
        )}
      </div>

    </div>
  );
};
