'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function GalleryPage() {
  const allPaintings = PlaceHolderImages.filter(p => p.id.startsWith('painting-'));

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-24 relative z-10">
        <div className="relative mb-16 text-center">
            <div className="absolute top-0 left-0">
                <Button asChild variant="outline">
                  <Link href="/#paintings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
            </div>
          <h1 className="font-headline text-5xl font-bold md:text-6xl gradient-text">
            Complete Gallery
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">An exploration of color, emotion, and form.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {allPaintings.map((painting, index) => (
            <div key={painting.id} className="animate-in fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <Card className="overflow-hidden transition-all duration-300 group glow-card">
                <CardContent className="p-0 relative">
                  <Image
                    src={painting.imageUrl}
                    alt={painting.description}
                    width={500}
                    height={500}
                    className="w-full h-auto aspect-square object-cover"
                    data-ai-hint={painting.imageHint}
                  />
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm text-white">{painting.description}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4">
                  <h4 className="font-headline text-sm font-bold">Karya Guntur Padilah</h4>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
