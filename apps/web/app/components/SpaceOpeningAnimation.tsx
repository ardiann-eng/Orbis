// apps/web/app/components/SpaceOpeningAnimation.tsx
'use client';

import { useEffect } from 'react';

export function SpaceOpeningAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // Total durasi animasi: 3.5 detik
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center overflow-hidden"
         style={{ animation: 'fadeOut 0.5s 3s forwards' }}>
      
      {/* Star field — banyak titik kecil yang bergerak keluar */}
      <div className="absolute inset-0" id="starfield">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top:  `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `starZoom ${0.8 + Math.random() * 1.5}s ${Math.random() * 0.5}s forwards ease-in`,
              transformOrigin: '50vw 50vh'
            }}
          />
        ))}
      </div>
      
      {/* Center logo — pulse lalu zoom masuk ke user */}
      <div className="relative flex flex-col items-center"
           style={{ animation: 'logoZoom 3.5s forwards' }}>
        
        {/* Orbital rings — expand out */}
        <div className="absolute w-64 h-64 border border-emerald-500/30 rounded-full"
             style={{ animation: 'ringExpand 2s 0.5s forwards ease-out' }}/>
        <div className="absolute w-48 h-48 border border-emerald-500/20 rounded-full"
             style={{ animation: 'ringExpand 2s 0.8s forwards ease-out' }}/>
        
        {/* Logo */}
        <div className="text-white font-display text-5xl font-black tracking-widest mb-2 relative z-10"
             style={{ animation: 'textGlow 3.5s forwards' }}>
          ORBIS
        </div>
        
        {/* Status text */}
        <div className="font-mono text-emerald-400 text-sm tracking-widest opacity-0"
             style={{ animation: 'fadeInUp 0.5s 1s forwards' }}>
          SISTEM AKTIF
        </div>
        
        {/* Progress bar tipis di bawah */}
        <div className="mt-6 w-48 h-px bg-zinc-800 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-emerald-500"
               style={{ animation: 'loadBar 2.5s 0.5s forwards ease-out' }}/>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes starZoom {
          from { transform: scale(1) translate(0, 0); opacity: 0.8; }
          to   { transform: scale(8) translate(calc((var(--x, 50) - 50) * 2%), calc((var(--y, 50) - 50) * 2%)); opacity: 0; }
        }
        @keyframes ringExpand {
          from { transform: scale(0.3); opacity: 0.8; }
          to   { transform: scale(2.5); opacity: 0; }
        }
        @keyframes logoZoom {
          0%   { transform: scale(1); opacity: 1; }
          70%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(20); opacity: 0; }
        }
        @keyframes textGlow {
          0%   { text-shadow: none; }
          50%  { text-shadow: 0 0 40px rgba(16,185,129,0.6); }
          100% { text-shadow: 0 0 80px rgba(16,185,129,0.8); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @keyframes fadeOut {
          to { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
}
