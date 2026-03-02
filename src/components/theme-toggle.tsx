'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      className={cn(
        "relative flex h-[35px] w-[70px] cursor-pointer items-center rounded-full border-2 border-border bg-card transition-all",
        className
      )}
    >
      <div
        className={cn(
          'absolute flex h-[28px] w-[28px] items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform duration-300 ease-in-out',
          theme === 'light' ? 'translate-x-[35px]' : 'translate-x-[2.5px]'
        )}
      >
        {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </div>
    </div>
  );
}
