'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
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
                  <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 group glow-card">
                    <CardContent className="p-0 relative">
                      <Link href={`/articles/${article.slug}`}>
                        <Image
                          src={image.imageUrl}
                          alt={article.title}
                          width={600}
                          height={400}
                          className="w-full h-auto aspect-[3/2] object-cover"
                          data-ai-hint={image.imageHint}
                        />
                      </Link>
                    </CardContent>
                    <CardHeader>
                      <CardTitle className="font-headline text-xl hover:text-primary transition-colors">
                        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Calendar size={14} />
                        <span>{formatDate(article.date)}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-muted-foreground text-sm leading-relaxed">{article.excerpt}</p>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-4">
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                      <Button asChild variant="link" className="p-0 h-auto">
                        <Link href={`/articles/${article.slug}`}>
                          Baca Selengkapnya
                        </Link>
                      </Button>
                    </CardFooter>
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
