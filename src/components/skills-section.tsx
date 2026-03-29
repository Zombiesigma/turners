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

const SkillBar = ({ name, percentage, isVisible }: { name: string; percentage: number; isVisible: boolean }) => {
    const [currentPercentage, setCurrentPercentage] = useState(0);

    useEffect(() => {
        let animationFrameId: number;
        if (isVisible) {
            const startTime = performance.now();
            const duration = 1500;

            const animate = (currentTime: number) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const animatedValue = Math.floor(progress * percentage);
                setCurrentPercentage(animatedValue);
                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animationFrameId = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animationFrameId);
    }, [isVisible, percentage]);

    return (
        <div className="w-full">
            <div className="flex justify-between mb-2">
                <span className="text-base font-semibold text-foreground">{name}</span>
                <span className="text-sm font-bold text-primary">{currentPercentage}%</span>
            </div>
            <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-primary to-accent h-full rounded-full transition-[width] duration-1500 ease-out" 
                    style={{ width: `${currentPercentage}%` }}
                />
            </div>
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
    <section id="skills" className="py-24">
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
                  <div className="space-y-5 text-left">
                    {category.skills.map(skill => (
                      <SkillBar key={skill.name} name={skill.name} percentage={skill.percentage} isVisible={isVisible} />
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
