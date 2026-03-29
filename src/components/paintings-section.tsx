'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images, Loader2 } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';

type Painting = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Timestamp;
};


export function PaintingsSection() {
  const firestore = useFirestore();
  const paintingsQuery = firestore ? query(collection(firestore, 'paintings'), orderBy('createdAt', 'desc'), limit(4)) : null;
  const { data: paintings, loading } = useCollection<Painting>(paintingsQuery);

  return (
    <section id="paintings" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Galeri Lukisan</h2>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-16 w-16 animate-spin text-primary"/>
          </div>
        )}

        {!loading && paintings && (
          <div className="masonry-grid">
            {paintings.map((painting, index) => (
              <div key={painting.id} className="masonry-item animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Card className="overflow-hidden transition-all duration-300 group glow-card">
                  <Link href={`/gallery/${painting.slug}`}>
                    <CardContent className="p-0 relative">
                      <Image
                        src={painting.imageUrl}
                        alt={painting.title}
                        width={500}
                        height={500}
                        className="w-full h-auto"
                      />
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <p className="text-sm text-white">{painting.description}</p>
                       </div>
                    </CardContent>
                    <CardFooter className="p-4">
                      <h4 className="font-headline font-bold">{painting.title}</h4>
                    </CardFooter>
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        )}

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
