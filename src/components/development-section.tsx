'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Book, Palette, PenTool, ExternalLink, Github, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CodeBlock = ({ children }: { children: string }) => {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    if (!children) return;
    navigator.clipboard.writeText(children).then(() => {
      setHasCopied(true);
      toast({ title: "Code copied to clipboard!" });
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      toast({ title: "Failed to copy", description: "Could not copy code to clipboard.", variant: "destructive" });
    });
  };
  
  return (
    <div className="relative mt-4 rounded-lg bg-black/50 p-4 font-code text-sm group">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white"
            onClick={copyToClipboard}
        >
            {hasCopied ? <Check size={16} /> : <Copy size={16} />}
            <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <pre><code>{children}</code></pre>
    </div>
  );
};

const projects = [
  {
    icon: <Book className="h-10 w-10 text-primary" />,
    title: 'Litera',
    description: 'Platform digital untuk menerbitkan dan membaca e-book dengan fitur social reading, dan 100% gratis.',
    code: `const reader = new EBookReader({
  annotations: true,
  social: true,
  offline: true
});`,
    liveLink: 'https://www.litera.my.id',
    sourceLink: '#',
  },
  {
    icon: <Palette className="h-10 w-10 text-primary" />,
    title: 'Art Gallery CMS',
    description: 'Sistem manajemen konten untuk galeri seni online dengan fitur virtual exhibition.',
    code: `const gallery = new VirtualGallery({
  '3D': true,
  VR: true,
  AR: true
});`,
    liveLink: '#',
    sourceLink: '#',
  },
  {
    icon: <PenTool className="h-10 w-10 text-primary" />,
    title: 'Writing Assistant AI',
    description: 'AI-powered writing assistant untuk membantu penulis meningkatkan kualitas tulisan.',
    code: `const ai = new WritingAI({
  style: 'creative',
  language: 'id',
  genre: 'novel'
});`,
    liveLink: '#',
    sourceLink: '#',
  },
];

export function DevelopmentSection() {
  return (
    <section id="projects" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Proyek Development</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {projects.map((project, index) => (
            <div key={project.title} className="animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <Card className="flex h-full flex-col glow-card transition-all duration-300 hover:-translate-y-2">
                <CardHeader>
                  {project.icon}
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CodeBlock>{project.code}</CodeBlock>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={project.liveLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80">
                    <ExternalLink size={16} />
                    {project.liveLink === '#' ? 'Live Demo' : 'Kunjungi'}
                  </Link>
                  <Link href={project.sourceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary/80">
                    <Github size={16} />
                    Source
                  </Link>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
