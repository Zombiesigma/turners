import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Loader } from "@/components/loader";
import { Background3D } from "@/components/background-3d";
import { ScrollProgressBar } from "@/components/scroll-progress-bar";
import { BackToTopButton } from "@/components/back-to-top-button";

export const metadata: Metadata = {
  title: "Guntur Padilah - Penulis • Pelukis • Web Developer Indonesia",
  description: "Portofolio resmi Guntur Padilah. Penulis novel, pelukis, dan web developer dari Sukabumi. Pengarang buku 'Beri Ruang Untuk Kelelahan'.",
  keywords: "Guntur Padilah, Penulis Indonesia, Pelukis Indonesia, Web Developer, Programmer Sukabumi, Novel Indonesia, Lukisan, Sertifikat Dicoding, gunturpadilah.web.id",
  authors: [{ name: "Guntur Padilah" }],
  openGraph: {
    type: "website",
    url: "https://www.gunturpadilah.web.id/",
    title: "Guntur Padilah - Multi-Disciplinary Artist Indonesia",
    description: "Menyatukan kata, warna, dan kode dalam harmoni kreatif. Penulis novel, pelukis, dan web developer profesional dari Sukabumi.",
    siteName: "Guntur Padilah Portfolio",
    images: [{
      url: "/pp.jpg", // Assuming you will add this image to /public
    }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@guntur_padilah",
    title: "Guntur Padilah - Writer • Painter • Developer",
    description: "Portofolio kreatif menggabungkan sastra, seni rupa, dan teknologi dari Sukabumi, Indonesia.",
    images: ["/pp.jpg"], // Assuming you will add this image to /public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Source+Code+Pro:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <ThemeProvider>
          <Loader />
          <Background3D />
          <ScrollProgressBar />
          {children}
          <BackToTopButton />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
