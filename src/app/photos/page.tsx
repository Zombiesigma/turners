'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ZoomIn } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

type Photo = {
  id: string;
  caption: string;
  imageUrl: string;
  createdAt: Timestamp;
};

export default function PhotosPage() {
  const firestore = useFirestore();
  const photosQuery = firestore ? query(collection(firestore, 'photos'), orderBy('createdAt', 'desc')) : null;
  const { data: photos, loading } = useCollection<Photo>(photosQuery);

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-24 relative z-10">
        <div className="relative mb-16 text-center">
            <div className="absolute top-0 left-0">
                <Button asChild variant="outline">
                  <Link href="/#photos">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
            </div>
          <h1 className="font-headline text-5xl font-bold md:text-6xl gradient-text">
            Galeri Foto
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Momen, cerita, dan sekilas tentang perjalanan saya.</p>
        </div>

        {loading && (
           <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
           </div>
        )}

        {!loading && photos && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="animate-in fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <Dialog>
                    <Card className="overflow-hidden transition-all duration-300 group glow-card">
                        <CardContent className="p-0 relative">
                            <Image
                                src={photo.imageUrl}
                                alt={photo.caption || 'Personal photo'}
                                width={500}
                                height={500}
                                className="w-full h-auto aspect-square object-cover"
                            />
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-white/80 mt-2 line-clamp-4">{photo.caption}</p>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="rounded-full mt-4 bg-transparent text-white hover:bg-white/20 hover:text-white border-white/50">
                                        <ZoomIn size={20} />
                                    </Button>
                                </DialogTrigger>
                            </div>
                        </CardContent>
                    </Card>
                    <DialogContent className="max-w-4xl p-2 bg-transparent border-0">
                        <Image src={photo.imageUrl} alt={photo.caption} width={1600} height={1600} className="w-full h-auto rounded-lg object-contain max-h-[90vh]" />
                         {photo.caption && <p className="text-center text-white p-2 bg-black/50 rounded-b-lg">{photo.caption}</p>}
                    </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
