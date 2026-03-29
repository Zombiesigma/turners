'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images } from 'lucide-react';

const paintings = [
  {
    id: 'painting-1',
    description: 'Sebuah eksplorasi warna dalam kekacauan yang teratur.',
    imageUrl: '/img/lukisan/l1.jpg',
    imageHint: 'abstract painting',
    height: 500,
  },
  {
    id: 'painting-2',
    description: 'Potret jiwa yang terperangkap dalam tatapan.',
    imageUrl: '/img/lukisan/l2.jpg',
    imageHint: 'portrait painting',
    height: 600,
  },
  {
    id: 'painting-3',
    description: 'Pemandangan senja yang melankolis di atas danau.',
    imageUrl: '/img/lukisan/l3.jpg',
    imageHint: 'landscape painting',
    height: 450,
  },
  {
    id: 'painting-4',
    description: 'Dunia mimpi di mana logika menyerah pada imajinasi.',
    imageUrl: '/img/lukisan/l4.jpg',
    imageHint: 'surreal painting',
    height: 550,
  },
];

export function PaintingsSection() {
  return (
    <section id="paintings" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Galeri Lukisan</h2>
        </div>
        
        <div className="masonry-grid">
          {paintings.map((painting, index) => (
            <div key={painting.id} className="masonry-item animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <Card className="overflow-hidden transition-all duration-300 group glow-card">
                <CardContent className="p-0 relative">
                  <Image
                    src={painting.imageUrl}
                    alt={painting.description}
                    width={500}
                    height={painting.height}
                    className="w-full h-auto"
                    data-ai-hint={painting.imageHint}
                  />
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <p className="text-sm text-white">{painting.description}</p>
                   </div>
                </CardContent>
                <CardFooter className="p-4">
                  <h4 className="font-headline font-bold">Karya Guntur Padilah</h4>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full">
                <Link href="/gallery">
                    <Images className="mr-2 h-5 w-5" /> Lihat Galeri Lengkap
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
