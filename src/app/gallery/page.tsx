'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';

type Painting = {
  id: string;
  slug: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  createdAt: Timestamp;
};

export default function GalleryPage() {
  const firestore = useFirestore();
  const paintingsQuery = firestore ? query(collection(firestore, 'paintings'), orderBy('createdAt', 'desc')) : null;
  const { data: paintings, loading } = useCollection<Painting>(paintingsQuery);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-24 relative z-10">
        <div className="relative mb-16 text-center">
            <div className="absolute top-0 left-0">
                <Button asChild variant="outline">
                  <Link href="/#paintings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
            </div>
          <h1 className="font-headline text-5xl font-bold md:text-6xl gradient-text">
            Galeri Lengkap
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Sebuah eksplorasi warna, emosi, dan bentuk.</p>
        </div>

        {loading && (
           <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
           </div>
        )}

        {!loading && paintings && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paintings.map((painting, index) => (
              <div key={painting.id} className="animate-in fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <Card className="overflow-hidden transition-all duration-300 group glow-card">
                  <Link href={`/gallery/${painting.slug}`}>
                    <CardContent className="p-0 relative">
                      <Image
                        src={painting.imageUrl}
                        alt={painting.title}
                        width={500}
                        height={500}
                        className="w-full h-auto aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-lg font-headline text-white">{painting.title}</p>
                        <p className="text-sm text-white/80 mt-2 line-clamp-3">{painting.description}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4">
                      <h4 className="font-headline text-sm font-bold">{painting.title} ({painting.year})</h4>
                    </CardFooter>
                  </Link>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
