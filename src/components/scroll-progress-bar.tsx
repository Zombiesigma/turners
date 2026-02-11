"use client";

import { useState, useEffect } from 'react';

export function ScrollProgressBar() {
  const [width, setWidth] = useState(0);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollHeight > clientHeight) {
        const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setWidth(scrollPercent);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100]">
      <div 
        className="h-full bg-gradient-to-r from-primary to-accent"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
