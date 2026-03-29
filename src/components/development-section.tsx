'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Book, Palette, PenTool, ExternalLink, Github, Copy, Check } from 'lucide-react';
import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const CodeBlock = ({ children, rawCode }: { children: ReactNode; rawCode: string }) => {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawCode).then(() => {
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
    <div className="relative mt-4 rounded-lg bg-black/80 p-4 font-code text-sm group text-left">
       <div className="absolute top-2 right-2">
        <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 hover:text-white"
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

const projects: {
  icon: ReactNode;
  title: string;
  description: string;
  code: ReactNode;
  rawCode: string;
  liveLink: string;
  sourceLink: string;
}[] = [
  {
    icon: <Book className="h-10 w-10 text-primary" />,
    title: 'Elitera',
    description: 'Platform digital untuk menerbitkan dan membaca e-book dengan fitur social reading, dan 100% gratis.',
    rawCode: `const reader = new EBookReader({
  annotations: true,
  social: true,
  offline: true
});`,
    code: (
      <>
        <span className="text-pink-400">const</span>{' '}
        <span className="text-sky-300">reader</span>{' '}
        <span className="text-gray-500">=</span>{' '}
        <span className="text-pink-400">new</span>{' '}
        <span className="text-teal-300">EBookReader</span>
        <span className="text-gray-500">{'({'}</span>
        <br />
        {'  '}
        <span className="text-sky-300">annotations</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-amber-300">true</span>
        <span className="text-gray-500">,</span>
        <br />
        {'  '}
        <span className="text-sky-300">social</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-amber-300">true</span>
        <span className="text-gray-500">,</span>
        <br />
        {'  '}
        <span className="text-sky-300">offline</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-amber-300">true</span>
        <br />
        <span className="text-gray-500">{'});'}</span>
      </>
    ),
    liveLink: 'https://www.elitera.my.id',
    sourceLink: '#',
  },
  {
    icon: <Palette className="h-10 w-10 text-primary" />,
    title: 'Art Gallery CMS',
    description: 'Sistem manajemen konten untuk galeri seni online dengan fitur virtual exhibition.',
    rawCode: `const gallery = new VirtualGallery({
  '3D': true,
  VR: true,
  AR: true
});`,
    code: (
      <>
        <span className="text-pink-400">const</span>{' '}
        <span className="text-sky-300">gallery</span>{' '}
        <span className="text-gray-500">=</span>{' '}
        <span className="text-pink-400">new</span>{' '}
        <span className="text-teal-300">VirtualGallery</span>
        <span className="text-gray-500">{'({'}</span>
        <br />
        {'  '}
        <span className="text-green-300">{"'3D'"}</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-amber-300">true</span>
        <span className="text-gray-500">,</span>
        <br />
        {'  '}
        <span className="text-sky-300">VR</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-amber-300">true</span>
        <span className="text-gray-500">,</span>
        <br />
        {'  '}
        <span className="text-sky-300">AR</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-amber-300">true</span>
        <br />
        <span className="text-gray-500">{'});'}</span>
      </>
    ),
    liveLink: '#',
    sourceLink: '#',
  },
  {
    icon: <PenTool className="h-10 w-10 text-primary" />,
    title: 'Nusakarsa',
    description: 'Aplikasi sastra digital Indonesia.',
    rawCode: `import { Nusakarsa } from 'sastra-digital';

const app = new Nusakarsa({
  platform: 'mobile',
  features: ['ai-editor', 'marketplace']
});`,
    code: (
      <>
        <span className="text-pink-400">import</span>{' '}
        <span className="text-gray-500">{'{'}</span>{' '}
        <span className="text-sky-300">Nusakarsa</span>{' '}
        <span className="text-gray-500">{'}'}</span>{' '}
        <span className="text-pink-400">from</span>{' '}
        <span className="text-green-300">{`'sastra-digital'`}</span>
        <span className="text-gray-500">;</span>
        <br />
        <br />
        <span className="text-pink-400">const</span>{' '}
        <span className="text-sky-300">app</span>{' '}
        <span className="text-gray-500">=</span>{' '}
        <span className="text-pink-400">new</span>{' '}
        <span className="text-teal-300">Nusakarsa</span>
        <span className="text-gray-500">{'({'}</span>
        <br />
        {'  '}
        <span className="text-sky-300">platform</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-green-300">{`'mobile'`}</span>
        <span className="text-gray-500">,</span>
        <br />
        {'  '}
        <span className="text-sky-300">features</span>
        <span className="text-gray-500">:</span>{' '}
        <span className="text-gray-500">{'['}</span>
        <span className="text-green-300">{`'ai-editor'`}</span>
        <span className="text-gray-500">,</span>{' '}
        <span className="text-green-300">{`'marketplace'`}</span>
        <span className="text-gray-500">{']'}</span>
        <br />
        <span className="text-gray-500">{'});'}</span>
      </>
    ),
    liveLink: 'https://nusakarsa.my.id',
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
              <Card className="flex h-full flex-col glow-card transition-all duration-300 hover:-translate-y-2 text-center">
                <CardHeader className="items-center">
                   {project.title === 'Elitera' ? (
                    <div className="mb-4 h-24 w-24 rounded-full overflow-hidden relative">
                      <Image src="https://raw.githubusercontent.com/Zombiesigma/elitera-asset/main/uploads/1770616886999-WhatsApp_Image_2026-02-07_at_13.45.35.jpeg" alt="Elitera" fill className="object-cover"/>
                    </div>
                  ) : project.title === 'Nusakarsa' ? (
                    <div className="mb-4 h-24 w-24 rounded-full overflow-hidden relative bg-white p-2">
                        <Image src="https://raw.githubusercontent.com/Zombiesigma/nusakarsa-assets/main/download.webp?v=1" alt="Nusakarsa" fill className="object-contain"/>
                    </div>
                  ) : (
                    <div className="mb-4 rounded-full bg-primary/10 p-5">
                      {project.icon}
                    </div>
                  )}
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CodeBlock rawCode={project.rawCode}>{project.code}</CodeBlock>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button asChild variant="link">
                    <Link href={project.liveLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {project.liveLink === '#' ? 'Live Demo' : 'Kunjungi'}
                    </Link>
                  </Button>
                   <Button asChild variant="link">
                    <Link href={project.sourceLink} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-4 w-4" />
                        Source
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
