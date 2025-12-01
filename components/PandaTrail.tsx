
import React, { useEffect, useRef } from 'react';

export const PandaTrail: React.FC = () => {
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastTimeRef.current < 40) return; // Limit creation rate (throttle)
        lastTimeRef.current = now;

        createParticle(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const createParticle = (x: number, y: number) => {
    const el = document.createElement('div');
    const emojis = ['🐼', '🐾', '🐾', '🎋']; // High chance of paw prints
    el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.position = 'fixed';
    
    // Offset slightly to the bottom right so it doesn't cover the cursor tip
    el.style.left = `${x + 15}px`;
    el.style.top = `${y + 15}px`;
    
    el.style.fontSize = `${Math.random() * 10 + 14}px`; // 14-24px
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.userSelect = 'none';
    // Initial State
    el.style.opacity = '1';
    el.style.transform = `translate(0, 0) scale(0.5) rotate(${Math.random() * 40 - 20}deg)`;
    el.style.transition = 'transform 0.8s cubic-bezier(0,0,0.2,1), opacity 0.8s ease-out';
    
    document.body.appendChild(el);

    // Animate
    requestAnimationFrame(() => {
       // End State - Float down and fade out
       el.style.transform = `translate(10px, 30px) scale(1.2) rotate(${Math.random() * 90 - 45}deg)`;
       el.style.opacity = '0';
    });

    // Cleanup
    setTimeout(() => {
        if (document.body.contains(el)) {
            document.body.removeChild(el);
        }
    }, 800);
  }

  return null;
};
