'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, ShoppingCart, Loader2, ArrowRight, Calendar } from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: Timestamp;
  tags: string[];
  imageUrl: string;
};

export function WritingSection() {
  const featuredBook = PlaceHolderImages.find(p => p.id === 'book-cover-main');
  const otherBooks = [
    PlaceHolderImages.find(p => p.id === 'book-cover-1'),
    PlaceHolderImages.find(p => p.id === 'book-cover-2'),
    PlaceHolderImages.find(p => p.id === 'book-cover-3'),
    PlaceHolderImages.find(p => p.id === 'book-cover-4'),
  ].filter(Boolean) as typeof PlaceHolderImages;

  const firestore = useFirestore();
  const articlesQuery = firestore ? query(collection(firestore, 'articles'), orderBy('date', 'desc'), limit(3)) : null;
  const { data: articles, loading: articlesLoading } = useCollection<Article>(articlesQuery);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Tanggal tidak diketahui';
    return timestamp.toDate().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <section id="writing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Dunia Tulisan</h2>
        </div>
        
        {/* --- BOOKS --- */}
        {featuredBook && (
          <div className="mb-16 grid items-center gap-12 md:grid-cols-2 lg:mb-24">
            <div className="animate-in fade-in-up">
              <Image
                src={featuredBook.imageUrl}
                alt={featuredBook.description}
                width={600}
                height={800}
                className="mx-auto w-full max-w-[400px] rounded-lg shadow-2xl md:max-w-full"
                data-ai-hint={featuredBook.imageHint}
              />
            </div>
            <div className="animate-in fade-in-up" style={{ animationDelay: '200ms' }}>
              <p className="mb-2 font-semibold text-primary">Buku Terbaru • Best Seller</p>
              <h3 className="mb-4 font-headline text-3xl font-bold">"Beri Ruang Untuk Kelelahan"</h3>
              <div className="mb-6 space-y-4 text-muted-foreground md:columns-2 md:gap-8">
                <p>Dalam keheningan kota yang telah lama mati, seorang penulis menemukan kebenaran yang lebih menakutkan daripada fiksi yang pernah ia tulis. Buku ini menggabungkan elemen misteri, romansa, dan filsafat dalam sebuah narasi yang memikat.</p>
                <p>"Beri Ruang Untuk Kelelahan" telah memenangkan penghargaan Sastra Nasional 2024 dan telah diterjemahkan ke dalam 7 bahasa. Sebuah karya yang akan mengubah cara Anda melihat dunia.</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="https://penerbitbudhimulia.com/?s=Guntur+" target="_blank" rel="noopener noreferrer">
                    <ShoppingCart className="mr-2 h-5 w-5" /> Beli Sekarang
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="#">
                    <BookText className="mr-2 h-5 w-5" /> Baca Sample
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-16">
            <h3 className="mb-8 font-headline text-2xl font-bold">Karya Lainnya</h3>
             <div className="px-12">
              <Carousel
                opts={{
                  align: 'start',
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {otherBooks.map((book, index) => (
                    <CarouselItem key={book?.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <div className="animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <Card className="overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl">
                          <CardContent className="p-0">
                            <Image
                              src={book!.imageUrl}
                              alt={book!.description}
                              width={400}
                              height={600}
                              className="aspect-[2/3] w-full object-cover"
                              data-ai-hint={book!.imageHint}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
        </div>

        <Separator className="my-24" />

        {/* --- ARTICLES --- */}
        <div>
          <div className="text-center mb-16">
            <h3 className="font-headline text-4xl font-bold">Artikel Terbaru</h3>
            <p className="mt-4 text-lg text-muted-foreground">Pikiran, ide, dan refleksi yang baru saja saya tuangkan.</p>
          </div>
            {articlesLoading && (
               <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-12 w-12 animate-spin text-primary"/>
               </div>
            )}

            {!articlesLoading && articles && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article, index) => (
                  <div key={article.id} className="animate-in fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 group glow-card hover:-translate-y-2">
                      <CardHeader>
                         <Link href={`/articles/${article.slug}`} className="block">
                           <CardTitle className="group-hover:text-primary transition-colors">{article.title}</CardTitle>
                         </Link>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                             <Calendar size={14} />
                             <span>{formatDate(article.date)}</span>
                         </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{article.excerpt}</p>
                      </CardContent>
                      <CardFooter>
                          <Button asChild variant="link" className="p-0 font-semibold text-primary">
                              <Link href={`/articles/${article.slug}`}>
                                  Baca Selengkapnya <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" size={16} />
                              </Link>
                          </Button>
                      </CardFooter>
                    </Card>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-12 text-center">
                <Button asChild size="lg">
                    <Link href="/articles">
                        Lihat Semua Artikel <ArrowRight className="ml-2"/>
                    </Link>
                </Button>
            </div>
        </div>

      </div>
    </section>
  );
}
