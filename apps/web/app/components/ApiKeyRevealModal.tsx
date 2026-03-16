// apps/web/app/components/ApiKeyRevealModal.tsx
'use client';

import { useState, useEffect } from 'react';

export function ApiKeyRevealModal({ 
  apiKey, 
  onClose 
}: { 
  apiKey: string
  onClose: () => void 
}) {
  const [countdown, setCountdown] = useState(60);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);
  
  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-lg w-full mx-4 relative">
        
        {/* Countdown ring */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" 
                fill="none" stroke="rgba(255,255,255,0.1)" 
                strokeWidth="3"/>
              <circle cx="32" cy="32" r="28"
                fill="none" stroke="#f59e0b" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdown/60)}`}
                className="transition-all duration-1000"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-amber-400 text-lg font-bold">
              {countdown}
            </span>
          </div>
        </div>

        <h2 className="text-white font-display text-xl font-bold text-center mb-2">
          API Key kamu
        </h2>
        <p className="text-zinc-400 text-sm text-center mb-6 leading-relaxed">
          Ini satu-satunya kesempatan kamu melihat API key ini.
          Setelah timer habis atau kamu tutup, key ini tidak bisa ditampilkan lagi.
          Salin dan simpan di tempat aman sekarang.
        </p>
        
        {/* API Key display */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-4 mb-4 relative">
          <div className="font-mono text-xs text-emerald-400 break-all leading-relaxed">
            {revealed ? apiKey : '•'.repeat(apiKey.length)}
          </div>
          <button
            onClick={() => setRevealed(!revealed)}
            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 text-xs">
            {revealed ? 'Sembunyikan' : 'Tampilkan'}
          </button>
        </div>
        
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 mb-3 ${
            copied 
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}>
          {copied ? 'Tersalin!' : 'Salin API Key'}
        </button>
        
        <button
          onClick={onClose}
          disabled={!copied}
          className={`w-full py-2 rounded-xl text-sm transition-all ${
            copied 
              ? 'text-zinc-400 hover:text-zinc-200 cursor-pointer' 
              : 'text-zinc-700 cursor-not-allowed'
          }`}>
          {copied ? 'Tutup' : 'Salin dulu sebelum menutup'}
        </button>
        
      </div>
    </div>
  );
}
