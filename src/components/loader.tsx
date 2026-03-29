// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const wittyMessages = [
    "Menyeduh Kopi...",
    "Merangkai Kata...",
    "Mencampur Warna...",
    "Menulis Kode...",
    "Menunggu Inspirasi...",
];

export function Loader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState(wittyMessages[0]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
        setProgress(oldProgress => {
            if (oldProgress >= 100) {
                clearInterval(progressInterval);
                setTimeout(() => setLoading(false), 500);
                return 100;
            }
            const diff = Math.random() * 10;
            return Math.min(oldProgress + diff, 100);
        });
    }, 200);

    const messageInterval = setInterval(() => {
        setMessage(wittyMessages[Math.floor(Math.random() * wittyMessages.length)]);
    }, 2000);

    return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      document.body.style.overflow = '';
      setTimeout(() => setVisible(false), 1000);
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-background z-[200] flex flex-col justify-center items-center transition-opacity duration-1000",
      loading ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="relative z-10 text-center">
        <h1 className="text-8xl font-bold font-headline gradient-text mb-4 animate-pulse">GP.</h1>
        <p className="text-lg font-mono uppercase tracking-widest text-muted-foreground transition-all duration-300">{message}</p>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 mt-8 w-64 h-1 bg-primary/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
