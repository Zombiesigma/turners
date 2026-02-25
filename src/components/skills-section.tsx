"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Feather, Paintbrush, Code } from 'lucide-react';

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), { threshold: 0.1 });
    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => { if (currentRef) observer.unobserve(currentRef) };
  }, [ref]);
  return isIntersecting;
}

function Counter({ to, duration = 1500 }: { to: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const animationFrame = useRef(0);
    const startTimestamp = useRef<number | null>(null);

    useEffect(() => {
        const step = (timestamp: number) => {
            if (!startTimestamp.current) {
                startTimestamp.current = timestamp;
            }
            const progress = timestamp - startTimestamp.current;
            const percentage = Math.min(progress / duration, 1);
            setCount(Math.floor(to * percentage));

            if (progress < duration) {
                animationFrame.current = requestAnimationFrame(step);
            }
        };
        animationFrame.current = requestAnimationFrame(step);
        return () => {
            cancelAnimationFrame(animationFrame.current);
            startTimestamp.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [to, duration]);

    return <span>{count}%</span>;
}

const RadialProgress = ({ percentage, name, isVisible }: { percentage: number; name: string; isVisible: boolean }) => {
    const radius = 50;
    const stroke = 6;
    const normalizedRadius = radius - stroke / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (isVisible ? (percentage / 100) * circumference : circumference);

    return (
        <div className="relative flex flex-col items-center justify-center gap-1">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                 <defs>
                    <linearGradient id="skill-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--accent))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                    </linearGradient>
                </defs>
                <circle
                    className="text-primary/10"
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="url(#skill-gradient)"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    className="transition-[stroke-dashoffset] duration-[1500ms] ease-out"
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-foreground">
                    {isVisible ? <Counter to={percentage} /> : "0%"}
                </span>
            </div>
            <span className="mt-1 text-xs font-medium text-muted-foreground">{name}</span>
        </div>
    );
};

type Skill = {
  name: string;
  percentage: number;
};

type SkillCategory = {
  icon: ReactNode;
  title: string;
  description: string;
  skills: Skill[];
};

const skillData: SkillCategory[] = [
  {
    icon: <Feather className="h-10 w-10 text-primary" />,
    title: 'Menulis',
    description: 'Menulis adalah cara saya berbicara dengan dunia. Dari novel hingga puisi, setiap kata adalah sebuah petualangan.',
    skills: [
      { name: 'Fiksi', percentage: 95 },
      { name: 'Non-Fiksi', percentage: 85 },
      { name: 'Puisi', percentage: 90 },
    ],
  },
  {
    icon: <Paintbrush className="h-10 w-10 text-primary" />,
    title: 'Melukis',
    description: 'Canvas adalah tempat di mana emosi bertemu warna. Setiap goresan adalah cerita yang tak terucapkan.',
    skills: [
      { name: 'Oil Painting', percentage: 92 },
      { name: 'Watercolor', percentage: 88 },
      { name: 'Digital Art', percentage: 85 },
    ],
  },
  {
    icon: <Code className="h-10 w-10 text-primary" />,
    title: 'Development',
    description: 'Code adalah poetry untuk mesin. Membangun digital experiences yang menginspirasi dan memudahkan.',
    skills: [
      { name: 'Frontend', percentage: 90 },
      { name: 'Backend', percentage: 80 },
      { name: 'UI/UX Design', percentage: 87 },
    ],
  },
];

export function SkillsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  return (
    <section id="about" className="py-24">
      <div ref={ref} className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Keahlian & Passion</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {skillData.map((category, index) => (
            <div key={category.title} className="animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <Card className="h-full glow-card transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-8 text-center">
                  <div className="mb-6 inline-block rounded-full bg-primary/10 p-5 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                    {category.icon}
                  </div>
                  <CardTitle className="font-headline text-2xl mb-2">{category.title}</CardTitle>
                  <CardDescription className="mb-8 min-h-[60px]">{category.description}</CardDescription>
                  <div className="grid grid-cols-3 gap-2">
                    {category.skills.map(skill => (
                      <RadialProgress key={skill.name} name={skill.name} percentage={skill.percentage} isVisible={isVisible} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
