'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type Painting = {
  id: string;
  slug: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
  createdAt: Timestamp;
};

export default function PaintingDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();

  const paintingQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'paintings'), where('slug', '==', slug));
  }, [firestore, slug]);

  const { data: paintings, loading } = useCollection<Painting>(paintingQuery);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const painting = paintings?.[0];

  if (!painting) {
    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-40 relative z-10 text-center">
                 <h1 className="font-headline text-5xl font-bold md:text-6xl gradient-text">404</h1>
                 <p className="mt-4 text-lg text-muted-foreground">Lukisan tidak ditemukan.</p>
                 <Button asChild variant="outline" className="mt-8">
                  <Link href="/gallery">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Galeri
                  </Link>
                </Button>
            </main>
            <Footer />
        </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-24 relative z-10">
        <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/gallery">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Galeri
                      </Link>
                    </Button>
                </div>
                
                <div className="grid lg:grid-cols-2 lg:gap-x-16 items-start">
                    <div className="lg:sticky lg:top-28 animate-in fade-in-up">
                        {painting.imageUrl && (
                            <div className="rounded-xl overflow-hidden shadow-2xl shadow-primary/10">
                                <Image
                                    src={painting.imageUrl}
                                    alt={painting.title}
                                    width={1200}
                                    height={1200}
                                    className="w-full h-auto object-contain"
                                    priority
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-12 lg:mt-0 animate-in fade-in-up" style={{ animationDelay: '150ms' }}>
                        <header className="mb-12">
                            <h1 className="font-headline text-4xl md:text-5xl font-bold leading-tight mb-4 gradient-text">
                                {painting.title}
                            </h1>
                            
                            <div className="flex items-center gap-2 text-lg text-muted-foreground">
                               <Calendar size={16} /> 
                               <span>Tahun {painting.year}</span>
                            </div>
                        </header>
                        
                        <div>
                            <h2 className="font-headline text-2xl font-bold mb-4">Cerita di Balik Lukisan</h2>
                            <Separator className="mb-8" />
                            <article className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                               <p>{painting.description}</p>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
