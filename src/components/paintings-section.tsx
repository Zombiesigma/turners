import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Images } from 'lucide-react';

export function PaintingsSection() {
  const paintings = [
    PlaceHolderImages.find(p => p.id === 'painting-1'),
    PlaceHolderImages.find(p => p.id === 'painting-2'),
    PlaceHolderImages.find(p => p.id === 'painting-3'),
    PlaceHolderImages.find(p => p.id === 'painting-4'),
  ].filter(Boolean) as typeof PlaceHolderImages;

  return (
    <section id="paintings" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Galeri Lukisan</h2>
        </div>
        
        <div className="masonry-grid">
          {paintings.map((painting, index) => (
            <div key={painting.id} className="masonry-item animate-in fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <Card className="overflow-hidden transition-all duration-300 group glow-card">
                <CardContent className="p-0 relative">
                  <Image
                    src={painting.imageUrl}
                    alt={painting.description}
                    width={500}
                    height={Math.floor(Math.random() * 201) + 400} // random height
                    className="w-full h-auto"
                    data-ai-hint={painting.imageHint}
                  />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </CardContent>
                <CardFooter className="p-4">
                  <h4 className="font-headline font-bold">Karya Guntur Padilah</h4>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="rounded-full">
            <Images className="mr-2 h-5 w-5" /> Lihat Galeri Lengkap
          </Button>
        </div>
      </div>
    </section>
  );
}
