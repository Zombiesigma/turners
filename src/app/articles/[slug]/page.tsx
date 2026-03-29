'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar, User } from 'lucide-react';

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: Timestamp;
  tags: string[];
  imageUrl: string;
};

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const firestore = useFirestore();

  const articleQuery = firestore && slug ? query(collection(firestore, 'articles'), where('slug', '==', slug)) : null;
  const { data: articles, loading } = useCollection<Article>(articleQuery);

  const article = articles?.[0];

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Tanggal tidak diketahui';
    return timestamp.toDate().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!article) {
    return (
        <>
            <Header />
            <main className="container mx-auto px-4 py-40 relative z-10 text-center">
                 <h1 className="font-headline text-5xl font-bold md:text-6xl gradient-text">404</h1>
                 <p className="mt-4 text-lg text-muted-foreground">Artikel tidak ditemukan.</p>
                 <Button asChild variant="outline" className="mt-8">
                  <Link href="/articles">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Semua Artikel
                  </Link>
                </Button>
            </main>
            <Footer />
        </>
    );
  }

  const renderContent = (content: string) => {
    return content.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
        <p key={index} className="mb-6 leading-relaxed">{paragraph}</p>
    ));
  };

  return (
    <>
      <Header />
      <main className="py-24 relative z-10">
        <div className="container mx-auto px-4">
            <article className="max-w-4xl mx-auto">
                <header className="mb-12 text-center md:text-left">
                    <div className="mb-6">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/articles">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Semua Artikel
                          </Link>
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                        {article.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>

                    <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 gradient-text">
                        {article.title}
                    </h1>
                    
                    <div className="flex items-center justify-center md:justify-start gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                           <User size={14} /> 
                           <span>Oleh Guntur Padilah</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Calendar size={14} /> 
                           <span>{formatDate(article.date)}</span>
                        </div>
                    </div>
                </header>

                {article.imageUrl && (
                    <div className="mb-12 rounded-lg overflow-hidden shadow-2xl shadow-primary/10">
                        <Image
                            src={article.imageUrl}
                            alt={article.title}
                            width={1200}
                            height={600}
                            className="w-full h-auto object-cover aspect-[16/9]"
                            priority
                        />
                    </div>
                )}
                
                <div className="prose-styles max-w-none text-lg text-foreground/90">
                    <p className="lead text-xl lg:text-2xl font-semibold text-muted-foreground mb-8">{article.excerpt}</p>
                    
                    <div className="article-content space-y-6 text-base md:text-lg leading-relaxed">
                        {renderContent(article.content)}
                    </div>
                </div>

            </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
