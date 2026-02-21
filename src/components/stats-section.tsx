"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { BookMarked, Palette, KanbanSquare, Award } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { threshold: 0.5 }
    );
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref]);

  return isIntersecting;
}

function Counter({ to, duration = 2000, suffix = '' }: { to: number; duration?: number, suffix?: string }) {
  const [count, setCount] = useState(0);
  const start = useRef(0);
  const animationFrame = useRef(0);

  useEffect(() => {
    start.current = 0; // Reset animation on change
    const step = (timestamp: number) => {
      if (!start.current) {
        start.current = timestamp;
      }
      const progress = timestamp - start.current;
      const percentage = Math.min(progress / duration, 1);
      setCount(Math.floor(to * percentage));

      if (progress < duration) {
        animationFrame.current = requestAnimationFrame(step);
      }
    };
    animationFrame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [to, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

const stats: { label: string; value: number; icon: ReactNode; suffix?: string }[] = [
  { label: "Buku Terbit", value: 12, icon: <BookMarked className="h-8 w-8" />, suffix: '+' },
  { label: "Lukisan Terjual", value: 150, icon: <Palette className="h-8 w-8" />, suffix: '+' },
  { label: "Proyek Web", value: 50, icon: <KanbanSquare className="h-8 w-8" />, suffix: '+' },
  { label: "Sertifikat Premium", value: 3, icon: <Award className="h-8 w-8" /> },
];

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  return (
    <section ref={ref} className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <Card className="glow-card text-center h-full hover:-translate-y-2 transition-transform duration-300">
                <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
                    <div className="text-primary">
                        {stat.icon}
                    </div>
                    <div className="text-5xl font-bold gradient-text">
                        {isVisible ? <Counter to={stat.value} suffix={stat.suffix} /> : '0'}
                    </div>
                    <p className="text-muted-foreground font-medium text-lg">{stat.label}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
