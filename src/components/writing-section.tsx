import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, ShoppingCart } from 'lucide-react';

export function WritingSection() {
  const featuredBook = PlaceHolderImages.find(p => p.id === 'book-cover-main');
  const otherBooks = [
    PlaceHolderImages.find(p => p.id === 'book-cover-1'),
    PlaceHolderImages.find(p => p.id === 'book-cover-2'),
    PlaceHolderImages.find(p => p.id === 'book-cover-3'),
    PlaceHolderImages.find(p => p.id === 'book-cover-4'),
  ].filter(Boolean) as typeof PlaceHolderImages;

  return (
    <section id="writing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Dunia Tulisan</h2>
        </div>
        
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

        <h3 className="mb-8 font-headline text-2xl font-bold">Karya Lainnya</h3>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {otherBooks.map((book, index) => (
            <div key={book?.id} className="animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
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
          ))}
        </div>
      </div>
    </section>
  );
}
