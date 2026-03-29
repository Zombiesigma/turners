// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Loader() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
        setProgress(oldProgress => {
            if (oldProgress >= 100) {
                clearInterval(interval);
                setTimeout(() => setLoading(false), 500);
                return 100;
            }
            const diff = Math.random() * 10;
            return Math.min(oldProgress + diff, 100);
        });
    }, 150);

    return () => {
        clearInterval(interval);
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
        <p className="text-lg font-mono uppercase tracking-widest text-primary/80 animate-pulse">Menyiapkan Kanvas Kreatif...</p>
        <div className="mt-4 w-48 h-1 bg-primary/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
