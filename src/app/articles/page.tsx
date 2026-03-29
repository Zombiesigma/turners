'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Loader2, ArrowRight } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: Timestamp;
  tags: string[];
  imageId: string;
};

export default function ArticlesPage() {
  const firestore = useFirestore();
  
  const q = firestore ? query(collection(firestore, 'articles'), orderBy('date', 'desc')) : null;
  const { data: articles, loading } = useCollection<Article>(q);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Tanggal tidak diketahui';
    return timestamp.toDate().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-24">
        <div className="relative mb-16 text-center">
          <div className="absolute top-0 left-0">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
          </div>
          <h1 className="font-headline text-5xl font-bold md:text-6xl gradient-text">
            Kumpulan Artikel
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Pikiran, ide, dan refleksi tentang seni, kode, dan kehidupan.</p>
        </div>

        {loading && (
           <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary"/>
           </div>
        )}

        {!loading && articles && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => {
              const image = PlaceHolderImages.find(p => p.id === article.imageId);
              if (!image) return null;

              return (
                <div key={article.id} className="animate-in fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <Card className="h-full overflow-hidden transition-all duration-300 group glow-card hover:-translate-y-2">
                    <Link href={`/articles/${article.slug}`} className="flex flex-col h-full bg-card">
                        <div className="relative overflow-hidden">
                            <Image
                                src={image.imageUrl}
                                alt={article.title}
                                width={600}
                                height={400}
                                className="w-full h-auto aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-105"
                                data-ai-hint={image.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                                {article.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="backdrop-blur-sm bg-black/30 text-white border-white/20">{tag}</Badge>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <h3 className="font-headline text-2xl mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <Calendar size={14} />
                                <span>{formatDate(article.date)}</span>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed flex-grow mb-6">{article.excerpt}</p>
                            <div className="mt-auto flex justify-end text-primary font-semibold text-sm items-center gap-2 group-hover:gap-3 transition-all duration-300">
                                Baca Selengkapnya
                                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={16} />
                            </div>
                        </div>
                    </Link>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
