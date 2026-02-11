"use client";

import { useEffect, useRef, useState } from "react";

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { threshold: 0.5 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return isIntersecting;
}

function Counter({ to, duration = 2000 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const start = useRef(0);
  const animationFrame = useRef(0);

  useEffect(() => {
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

  return <span>{count}</span>;
}

const stats = [
  { label: "Buku Terbit", value: 12 },
  { label: "Lukisan", value: 150 },
  { label: "Proyek Web", value: 50 },
  { label: "Sertifikat Premium", value: 3 },
];

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  return (
    <section ref={ref} className="py-20 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="mb-2 text-5xl font-bold gradient-text">
                {isVisible && <Counter to={stat.value} />}
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
