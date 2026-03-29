import { PlaceHolderImages } from '@/lib/placeholder-images';

export type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  imageId: string;
};

const findImage = (id: string) => PlaceHolderImages.find(p => p.id === id);

export const articles: Article[] = [
  {
    id: '1',
    slug: 'seni-menulis-di-era-digital',
    title: 'Seni Menulis di Era Digital: Menemukan Kembali Suara Anda',
    excerpt: 'Bagaimana teknologi mengubah cara kita menulis dan bercerita? Artikel ini menggali tantangan dan peluang bagi para penulis di dunia yang serba terhubung.',
    date: '15 Juli 2024',
    tags: ['Menulis', 'Teknologi', 'Kreativitas'],
    imageId: 'article-image-1',
  },
  {
    id: '2',
    slug: 'peran-kode-dalam-kreativitas',
    title: 'Peran Kode dalam Kreativitas: Lebih dari Sekadar Logika',
    excerpt: 'Menjelajahi persimpangan antara coding dan seni. Bagaimana baris-baris kode bisa menjadi medium baru untuk ekspresi artistik yang tak terbatas.',
    date: '10 Juli 2024',
    tags: ['Development', 'Seni', 'Inovasi'],
    imageId: 'article-image-5',
  },
  {
    id: '3',
    slug: 'filosofi-di-balik-kanvas-kosong',
    title: 'Filosofi di Balik Kanvas Kosong: Awal dari Segalanya',
    excerpt: 'Setiap karya besar dimulai dari kekosongan. Sebuah refleksi tentang keberanian untuk memulai dan potensi tak terbatas dari sebuah kanvas putih.',
    date: '05 Juli 2024',
    tags: ['Melukis', 'Filosofi', 'Inspirasi'],
    imageId: 'article-image-3',
  },
  {
    id: '4',
    slug: 'membangun-portofolio-kreatif-yang-menonjol',
    title: 'Membangun Portofolio Kreatif yang Menonjol di 2024',
    excerpt: 'Tips dan trik praktis untuk para pekerja kreatif dalam membangun portofolio yang tidak hanya memamerkan karya, tetapi juga menceritakan sebuah kisah.',
    date: '28 Juni 2024',
    tags: ['Karir', 'Desain', 'Development'],
    imageId: 'article-image-2',
  },
  {
    id: '5',
    slug: 'memberi-ruang-untuk-lelah',
    title: 'Refleksi "Beri Ruang Untuk Lelah": Produktivitas & Istirahat',
    excerpt: 'Mengapa istirahat adalah bagian terpenting dari proses kreatif? Pembahasan mendalam tentang pentingnya burnout dan cara mengelolanya.',
    date: '20 Juni 2024',
    tags: ['Kesehatan Mental', 'Produktivitas', 'Self-Care'],
    imageId: 'article-image-4',
  },
];
