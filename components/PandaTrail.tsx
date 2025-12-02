import React, { useEffect, useRef } from 'react';

export const PandaTrail: React.FC = () => {
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleMove = (x: number, y: number) => {
      const now = Date.now();
      // Throttle creation to avoid too many DOM elements
      if (now - lastTimeRef.current < 50) return; 
      lastTimeRef.current = now;

      createParticle(x, y);
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const createParticle = (x: number, y: number) => {
    const el = document.createElement('div');
    // Increased variety of cute emojis
    const emojis = ['🐼', '🐾', '🐾', '🎋', '✨', '🌸', '💫']; 
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.position = 'fixed';
    
    // Offset slightly so it follows gracefully
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    el.style.fontSize = `${Math.random() * 12 + 10}px`; // 10-22px
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.userSelect = 'none';
    el.style.cursor = 'default';
    
    // Initial State
    el.style.opacity = '0.8';
    el.style.transform = `translate(-50%, -50%) scale(0.5) rotate(${Math.random() * 40 - 20}deg)`;
    el.style.transition = 'transform 1s cubic-bezier(0,0,0.2,1), opacity 1s ease-out';
    
    document.body.appendChild(el);

    // Animate
    requestAnimationFrame(() => {
       // End State - Float down/up randomly and fade out
       const xOffset = (Math.random() - 0.5) * 30;
       const yOffset = 20 + Math.random() * 20;
       el.style.transform = `translate(calc(-50% + ${xOffset}px), calc(-50% + ${yOffset}px)) scale(1.2) rotate(${Math.random() * 90 - 45}deg)`;
       el.style.opacity = '0';
    });

    // Cleanup
    setTimeout(() => {
        if (document.body.contains(el)) {
            document.body.removeChild(el);
        }
    }, 1000);
  }

  return null;
};