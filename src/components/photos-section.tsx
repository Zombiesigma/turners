'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';

type Photo = {
  id: string;
  caption: string;
  imageUrl: string;
  createdAt: Timestamp;
};


export function PhotosSection() {
  const firestore = useFirestore();
  const photosQuery = firestore ? query(collection(firestore, 'photos'), orderBy('createdAt', 'desc'), limit(8)) : null;
  const { data: photos, loading } = useCollection<Photo>(photosQuery);

  return (
    <section id="photos" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Galeri Foto</h2>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-16 w-16 animate-spin text-primary"/>
          </div>
        )}

        {!loading && photos && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="masonry-item animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Card className="overflow-hidden transition-all duration-300 group glow-card">
                    <CardContent className="p-0 relative">
                      <Image
                        src={photo.imageUrl}
                        alt={photo.caption || 'Personal photo'}
                        width={500}
                        height={500}
                        className="w-full h-auto object-cover aspect-square"
                      />
                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <p className="text-sm text-white">{photo.caption}</p>
                       </div>
                    </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full">
                <Link href="/photos">
                    <Camera className="mr-2 h-5 w-5" /> Lihat Galeri Lengkap
                </Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
