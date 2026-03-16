// apps/web/app/components/BotActivationButton.tsx
'use client';

import { useState } from 'react';

export function BotActivationButton({ onActivate }: { onActivate: () => Promise<void> }) {
  const [isActivating, setIsActivating] = useState(false);
  
  async function handleActivate() {
    setIsActivating(true);
    await onActivate();
  }
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-40 bg-zinc-950/95 animate-fade-in">
      
      {/* Orbital rings background decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 border border-white/5 rounded-full absolute animate-pulse"/>
        <div className="w-64 h-64 border border-emerald-500/8 rounded-full absolute"/>
        <div className="w-32 h-32 border border-emerald-500/15 rounded-full absolute"/>
      </div>
      
      <p className="text-zinc-500 text-sm tracking-widest uppercase mb-8 font-mono z-10">
        ORBIS siap
      </p>
      
      {/* Main activation button — dead center */}
      <button
        onClick={handleActivate}
        disabled={isActivating}
        className="relative group w-32 h-32 rounded-full border-2 border-emerald-500/50 hover:border-emerald-500 transition-all duration-500 flex items-center justify-center hover:bg-emerald-500/10 z-10"
        style={{
          boxShadow: isActivating ? '0 0 60px rgba(16,185,129,0.4)' : '0 0 0px rgba(16,185,129,0)'
        }}>
        
        {/* Rotating ring saat hover */}
        <div className="absolute inset-[-8px] rounded-full border border-dashed border-emerald-500/20 group-hover:border-emerald-500/40 group-hover:animate-spin" 
             style={{ animationDuration: '8s' }}/>
        
        {isActivating ? (
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"/>
        ) : (
          <span className="text-emerald-400 font-display font-bold text-sm tracking-widest">
            AKTIFKAN
          </span>
        )}
      </button>
      
      <p className="text-zinc-600 text-xs mt-8 max-w-xs text-center leading-relaxed z-10">
        Bot akan mulai memantau pasar dan mengeksekusi trading sesuai strategi yang kamu pilih
      </p>
    </div>
  );
}
