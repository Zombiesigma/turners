"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bookmark, Mail, Instagram, Github, Twitter } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const roles = ['Writer', 'Painter', 'Developer'];

export function HeroSection() {
  const profileImage = PlaceHolderImages.find(p => p.id === 'profile-picture');
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [displayedRole, setDisplayedRole] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleTyping = () => {
      const fullRole = roles[currentRoleIndex];
      
      if (isDeleting) {
        setDisplayedRole(prev => prev.substring(0, prev.length - 1));
      } else {
        setDisplayedRole(prev => fullRole.substring(0, prev.length + 1));
      }

      if (!isDeleting && displayedRole === fullRole) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayedRole === '') {
        setIsDeleting(false);
        setCurrentRoleIndex(prev => (prev + 1) % roles.length);
      }
    };

    const typingSpeed = isDeleting ? 100 : 150;
    const timer = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedRole, isDeleting, currentRoleIndex]);

  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden py-24">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="animate-in fade-in-up">
            <h1 className="mb-4 font-headline text-5xl font-bold leading-tight md:text-7xl lg:text-8xl">
              Guntur Padilah
            </h1>
            <p className="mb-6 font-headline text-3xl text-primary md:text-4xl">
              <span className="typewriter">{displayedRole}</span>
            </p>
            <p className="mb-8 max-w-xl text-lg text-muted-foreground md:text-xl">
              Menyatukan kata, warna, dan kode dalam harmoni kreatif. Menulis cerita yang menyentuh, melukis emosi pada kanvas, dan membangun dunia digital yang inspiratif.
            </p>
            <div className="mb-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="rounded-full">
                <Link href="#writing">
                  <Bookmark className="mr-2 h-5 w-5" /> Jelajahi Karya
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="#contact">
                  <Mail className="mr-2 h-5 w-5" /> Hubungi Saya
                </Link>
              </Button>
            </div>
            <div className="flex space-x-4">
              <Link href="https://www.instagram.com/guntur_padilah" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary"><Instagram /></Link>
              <Link href="https://www.github.com/Zombiesigma" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-primary"><Github /></Link>
              <Link href="#" className="text-muted-foreground transition-colors hover:text-primary"><Twitter /></Link>
            </div>
          </div>
          <div className="relative mx-auto animate-in fade-in-up" style={{ animationDelay: '200ms' }}>
            {profileImage && (
              <div className="h-72 w-72 md:h-96 md:w-96 rounded-full overflow-hidden border-4 border-primary shadow-2xl shadow-primary/20">
                <Image
                  src={profileImage.imageUrl}
                  alt="Guntur Padilah"
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                  priority
                  data-ai-hint={profileImage.imageHint}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
