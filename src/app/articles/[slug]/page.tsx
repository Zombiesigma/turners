'use client';

import { useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar, User, Twitter, Facebook, Linkedin, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
  const { toast } = useToast();

  const articleQuery = useMemo(() => {
    if (!firestore || !slug) return null;
    return query(collection(firestore, 'articles'), where('slug', '==', slug));
  }, [firestore, slug]);

  const { data: articles, loading } = useCollection<Article>(articleQuery);

  const article = articles?.[0];
  const profileImage = PlaceHolderImages.find(p => p.id === 'profile-picture');

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = article ? `Baca artikel menarik dari Guntur Padilah: "${article.title}"` : '';

  const shareLinks = [
    {
      name: 'Twitter',
      icon: <Twitter size={20} />,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
        name: 'Facebook',
        icon: <Facebook size={20} />,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`
    },
    {
        name: 'LinkedIn',
        icon: <Linkedin size={20} />,
        href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(article.title)}&summary=${encodeURIComponent(article.excerpt)}`
    }
  ];

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return 'Tanggal tidak diketahui';
    return timestamp.toDate().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    toast({ title: "Tautan disalin ke clipboard!" });
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

  return (
    <>
      <Header />
      <main className="py-24 relative z-10">
        <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/articles">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Semua Artikel
                      </Link>
                    </Button>
                </div>
                
                <header className="mb-12 text-center">
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {article.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>

                    <h1 className="font-headline text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6 gradient-text">
                        {article.title}
                    </h1>
                    
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
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
                    <div className="mb-12 rounded-xl overflow-hidden shadow-2xl shadow-primary/10 transition-all duration-500 animate-in fade-in-up">
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
                
                <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-16">
                    <article className="lg:col-span-8">
                        <p className="lead text-xl lg:text-2xl font-normal text-muted-foreground mb-12">{article.excerpt}</p>
                        <Separator className="mb-12" />
                        <div className="article-content">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {article.content}
                           </ReactMarkdown>
                        </div>
                    </article>
                    <aside className="lg:col-span-4 mt-12 lg:mt-0">
                        <div className="sticky top-28 space-y-8">
                            <Card className="glow-card">
                                <CardHeader className="flex-row gap-4 items-center">
                                    {profileImage && (
                                        <Avatar className="h-14 w-14">
                                            <AvatarImage src={profileImage.imageUrl} alt="Guntur Padilah" />
                                            <AvatarFallback>GP</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        <CardTitle className="text-lg">Guntur Padilah</CardTitle>
                                        <CardDescription>Penulis, Pelukis, Developer</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Penulis buku "Beri Ruang Untuk Kelelahan". Menyatukan kata, warna, dan kode dalam harmoni kreatif.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Bagikan Artikel Ini</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col space-y-3">
                                    <div className="flex space-x-2">
                                        {shareLinks.map(link => (
                                            <Button key={link.name} asChild variant="outline" size="icon" className="rounded-full">
                                                <Link href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Bagikan di ${link.name}`}>
                                                    {link.icon}
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="flex items-center space-x-2 rounded-lg border bg-background p-2">
                                        <p className="text-sm text-muted-foreground truncate">{articleUrl}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyLink}>
                                            <Copy size={16} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
