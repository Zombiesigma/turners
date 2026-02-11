"use client";

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { BadgeCheck, Calendar, CheckCircle, Globe, Hourglass, QrCode, Trophy, User, ZoomIn } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type Certificate = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  validUntil?: string;
  description: string;
  ceo?: string;
  credentialId?: string;
  imageId: string;
  isFeatured?: boolean;
  features?: { icon: React.ReactNode; text: string }[];
};

const certificatesData: Certificate[] = [
  {
    id: 'cert1',
    title: "Belajar Dasar Pemrograman Web",
    issuer: "Dicoding Indonesia",
    date: "11 Nov 2023",
    validUntil: "Nov 2026",
    description: "Sertifikat kelulusan untuk kursus 'Belajar Dasar Pemrograman Web'. Membangun fondasi kuat dalam HTML, CSS, dan struktur web modern.",
    ceo: "Narenda Wicaksono (CEO)",
    credentialId: "OLZ02DY...",
    imageId: 'certificate-web-dev',
  },
  {
    id: 'cert2',
    title: "Belajar Dasar Pemrograman JavaScript",
    issuer: "Dicoding Indonesia",
    date: "02 Des 2023",
    validUntil: "Des 2026",
    description: "Sertifikat kompetensi kelulusan untuk kursus 'Belajar Dasar Pemrograman JavaScript'. Penguasaan logika pemrograman dan interaksi dinamis web.",
    ceo: "Narenda Wicaksono (CEO)",
    credentialId: "OLZ02DYJ0X65",
    imageId: 'certificate-js-dev',
  },
  {
    id: 'cert3',
    title: "Sertifikat Pelatihan Landing Page",
    issuer: "Digitech University",
    date: "Juni 2025",
    description: "Pelatihan pembuatan landing page yang diselenggarakan oleh Digitech University dengan fokus pada desain yang menarik dan konversi yang tinggi.",
    imageId: 'certificate-landing-page',
    isFeatured: true,
    features: [
      { icon: <Calendar size={16} />, text: "Diterbitkan: Juni 2025" },
      { icon: <Globe size={16} />, text: "Internasional Recognition" },
      { icon: <Trophy size={16} />, text: "Highest Distinction" },
      { icon: <BadgeCheck size={16} />, text: "Verifikasi Blockchain" },
    ]
  },
];

export function CertificatesSection() {
    const { toast } = useToast();

    const handleVerify = () => {
        toast({
            title: "Verifikasi Berhasil",
            description: "Sertifikat berhasil diverifikasi! ✅",
            variant: "default",
        });
    };
    
    return (
        <section id="certificates" className="py-24">
            <div className="container mx-auto px-4">
                <div className="text-center">
                    <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Sertifikat Premium</h2>
                </div>
                
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
                    {certificatesData.map((cert, index) => {
                        const image = PlaceHolderImages.find(p => p.id === cert.imageId);
                        if (!image) return null;

                        return (
                            <div key={cert.id} className={`animate-in fade-in-up ${cert.isFeatured ? 'lg:col-span-2' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
                                <Dialog>
                                    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary">
                                        <CardHeader className="p-0 relative">
                                            <DialogTrigger asChild>
                                                <div className="cursor-pointer">
                                                    <Image src={image.imageUrl} alt={cert.title} width={cert.isFeatured ? 1200 : 600} height={cert.isFeatured ? 600 : 300} className={`object-cover ${cert.isFeatured ? 'aspect-[2/1]' : 'aspect-[2/1]'}`} data-ai-hint={image.imageHint} />
                                                </div>
                                            </DialogTrigger>
                                            <div className="absolute top-4 right-4 rounded-full bg-primary/80 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm">{cert.issuer}</div>
                                        </CardHeader>
                                        <CardContent className="flex flex-grow flex-col p-6">
                                            <CardTitle className="font-headline text-xl mb-2">{cert.title}</CardTitle>
                                            <CardDescription className="mb-4 text-primary">{cert.date}</CardDescription>
                                            <p className="mb-6 flex-grow text-muted-foreground">{cert.description}</p>
                                            
                                            {cert.features && (
                                                <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-muted-foreground">
                                                    {cert.features.map(f => <div key={f.text} className="flex items-center gap-2"><span className="text-primary">{f.icon}</span>{f.text}</div>)}
                                                </div>
                                            )}
                                            
                                            {!cert.isFeatured && (
                                                <div className="text-sm text-muted-foreground space-y-2">
                                                    <div className="flex items-center gap-2"><User className="text-primary"/><span>{cert.ceo}</span></div>
                                                    <div className="flex items-center gap-2"><Hourglass className="text-primary"/><span>Valid: {cert.validUntil}</span></div>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex justify-between items-center">
                                            <DialogTrigger asChild>
                                                <Button variant="ghost"><ZoomIn className="mr-2"/>Lihat</Button>
                                            </DialogTrigger>
                                            {cert.isFeatured ? (
                                                <Button variant="ghost" onClick={handleVerify}><CheckCircle className="mr-2"/>Verifikasi</Button>
                                            ) : (
                                                <span className="text-xs font-mono text-muted-foreground">{cert.credentialId}</span>
                                            )}
                                        </CardFooter>
                                    </Card>
                                    <DialogContent className="max-w-4xl p-0">
                                        <Image src={image.imageUrl} alt={cert.title} width={1200} height={800} className="w-full h-auto rounded-lg" data-ai-hint={image.imageHint}/>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <p className="mb-4 text-muted-foreground">Sertifikat ini dapat diverifikasi secara online menggunakan kode unik</p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2">
                        <QrCode className="text-primary" />
                        <span className="font-mono">CERT-2024-AXCH-7749</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
