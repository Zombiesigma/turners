"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Feather, Paintbrush, Code } from 'lucide-react';

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current) };
  }, [ref]);
  return isIntersecting;
}

const SkillBar = ({ percentage, isVisible }: { percentage: number; isVisible: boolean }) => (
  <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/10">
    <div
      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
      style={{ width: isVisible ? `${percentage}%` : '0%' }}
    />
  </div>
);

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
    icon: <Feather className="h-12 w-12 text-primary" />,
    title: 'Menulis',
    description: 'Menulis adalah cara saya berbicara dengan dunia. Dari novel hingga puisi, setiap kata adalah sebuah petualangan.',
    skills: [
      { name: 'Fiksi', percentage: 95 },
      { name: 'Non-Fiksi', percentage: 85 },
      { name: 'Puisi', percentage: 90 },
    ],
  },
  {
    icon: <Paintbrush className="h-12 w-12 text-primary" />,
    title: 'Melukis',
    description: 'Canvas adalah tempat di mana emosi bertemu warna. Setiap goresan adalah cerita yang tak terucapkan.',
    skills: [
      { name: 'Oil Painting', percentage: 92 },
      { name: 'Watercolor', percentage: 88 },
      { name: 'Digital Art', percentage: 85 },
    ],
  },
  {
    icon: <Code className="h-12 w-12 text-primary" />,
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
              <Card className="h-full glow-card transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  {category.icon}
                  <CardTitle className="font-headline text-2xl">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.skills.map(skill => (
                      <div key={skill.name}>
                        <div className="mb-1 flex justify-between text-sm font-medium">
                          <span>{skill.name}</span>
                          <span>{skill.percentage}%</span>
                        </div>
                        <SkillBar percentage={skill.percentage} isVisible={isVisible} />
                      </div>
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
