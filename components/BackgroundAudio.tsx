import React, { useState, useEffect, useRef } from 'react';
import { Music, VolumeX, Volume2, Settings, Disc, Radio, AlertCircle } from 'lucide-react';

type AudioSource = 'piano' | 'custom';

// Updated to a stable, royalty-free Lo-Fi track from Pixabay
const DEFAULT_BGM_URL = "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3"; 

// Increment this to force a BGM update on user's browsers
const CURRENT_VERSION = 'v6';

export const BackgroundAudio: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [musicSource, setMusicSource] = useState<AudioSource>('custom');
  const [customUrl, setCustomUrl] = useState(DEFAULT_BGM_URL);
  const [error, setError] = useState(false);
  
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  // Initialize state from local storage with Version Check
  useEffect(() => {
    const savedVersion = localStorage.getItem('daily_craft_bgm_version');

    // If version is old or missing, RESET to default track
    if (savedVersion !== CURRENT_VERSION) {
      console.log("Updating BGM to new version...");
      setCustomUrl(DEFAULT_BGM_URL);
      setMusicSource('custom');
      localStorage.setItem('daily_craft_bgm_url', DEFAULT_BGM_URL);
      localStorage.setItem('daily_craft_bgm_source', 'custom');
      localStorage.setItem('daily_craft_bgm_version', CURRENT_VERSION);
    } else {
      // Load saved settings
      const savedUrl = localStorage.getItem('daily_craft_bgm_url');
      const savedSource = localStorage.getItem('daily_craft_bgm_source') as AudioSource;
      if (savedUrl) setCustomUrl(savedUrl);
      if (savedSource) setMusicSource(savedSource);
    }

    // Initialize audio element
    if (!audioElemRef.current) {
      audioElemRef.current = new Audio();
      audioElemRef.current.loop = true;
      audioElemRef.current.volume = 0.5;
    }
  }, []);

  // Update audio element source when url changes
  useEffect(() => {
    if (audioElemRef.current) {
      // Only change src if it's different to avoid reloading if same
      if (audioElemRef.current.src !== customUrl) {
         audioElemRef.current.src = customUrl;
      }
      
      // If currently playing, ensure it keeps playing
      if (isPlaying) {
         audioElemRef.current.play().catch(e => {
           console.error("Autoplay prevented or link error", e);
           setIsPlaying(false);
           handleError();
         });
      }
    }
  }, [customUrl]);

  const handleError = () => {
    setError(true);
    setIsPlaying(false);
    // Reset error state after 3 seconds
    setTimeout(() => setError(false), 3000);
  };

  const togglePlay = async () => {
    if (!audioElemRef.current) return;

    if (isPlaying) {
      audioElemRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioElemRef.current.play();
        setIsPlaying(true);
        setError(false);
      } catch (e) {
        console.error("Audio play failed", e);
        handleError();
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCustomUrl(url);
    localStorage.setItem('daily_craft_bgm_url', url);
    setMusicSource('custom'); 
  };

  const handleReset = () => {
    setCustomUrl(DEFAULT_BGM_URL);
    localStorage.setItem('daily_craft_bgm_url', DEFAULT_BGM_URL);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-row items-end gap-3 font-sans">
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 bg-white p-4 rounded-xl shadow-2xl border-2 border-dashed border-pastel-pink w-80 animate-in slide-in-from-bottom-5 fade-in absolute bottom-12 left-0">
           <h3 className="font-marker text-lg text-gray-700 mb-3 flex items-center justify-between">
             <span className="flex items-center"><Disc className="w-4 h-4 mr-2 text-pastel-pink" /> 背景音乐设置</span>
             <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-xs">关闭</button>
           </h3>
           
           <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400">当前播放链接:</label>
                <div className="flex items-center gap-2">
                   <input 
                     type="text" 
                     placeholder="粘贴 MP3 链接..." 
                     value={customUrl}
                     onChange={handleUrlChange}
                     className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:border-pink-300 outline-none text-gray-600 bg-gray-50 font-mono"
                   />
                </div>
                <div className="text-right">
                   <button 
                     onClick={handleReset}
                     className="text-[10px] text-gray-400 hover:text-pink-500 underline mt-1"
                   >
                     重置为默认音乐
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg border border-white/50">
        
        <button
          onClick={togglePlay}
          className={`relative p-3 rounded-full transition-all duration-500 transform hover:scale-105 ${
            error 
              ? 'bg-red-100 text-red-500 hover:bg-red-200' 
              : isPlaying 
                ? 'bg-gradient-to-tr from-pastel-pink to-pink-300 text-white shadow-md' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
          title={error ? "播放失败，请检查链接或网络" : (isPlaying ? "暂停" : "播放背景音乐")}
        >
          {isPlaying && !error && (
            <div className="absolute -top-1 -right-1 animate-ping h-3 w-3 rounded-full bg-pink-200 opacity-75"></div>
          )}
          {error ? (
             <AlertCircle className="w-5 h-5" />
          ) : (
             isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-pink-50 text-pink-400' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          title="更换音乐"
        >
          <Settings className={`w-4 h-4 ${showSettings ? 'animate-spin-slow' : ''}`} />
        </button>

      </div>
    </div>
  );
};