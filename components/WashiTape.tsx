import React from 'react';

interface WashiTapeProps {
  color?: string;
  pattern?: 'dots' | 'stripes' | 'solid';
  className?: string;
  rotation?: number;
}

export const WashiTape: React.FC<WashiTapeProps> = ({ 
  color = 'rgba(255, 99, 71, 0.4)', 
  pattern = 'solid', 
  className = '',
  rotation = -2
}) => {
  
  const style: React.CSSProperties = {
    backgroundColor: color,
    transform: `rotate(${rotation}deg)`,
    maskImage: pattern === 'dots' 
      ? 'radial-gradient(circle, black 2px, transparent 2.5px)' 
      : 'none',
    maskSize: pattern === 'dots' ? '10px 10px' : 'auto',
  };

  if (pattern === 'stripes') {
     style.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)';
     style.backgroundSize = '20px 20px';
  }

  return (
    <div 
      className={`absolute h-8 w-32 shadow-sm z-10 opacity-90 ${className}`}
      style={style}
    >
      <div className="w-full h-full opacity-30 bg-white mix-blend-overlay"></div>
    </div>
  );
};
