"use client";

import Link from 'next/link';
import { Github, Instagram, Mail, MessageCircle } from 'lucide-react';

const breadcrumbs = [
  { href: "/#home", label: "Beranda" },
  { href: "/#writing", label: "Tulisan" },
  { href: "/articles", label: "Artikel" },
  { href: "/#paintings", label: "Lukisan" },
  { href: "/#certificates", label: "Sertifikat" },
  { href: "/#contact", label: "Kontak" },
];

const socialLinks = [
  { href: "https://www.instagram.com/guntur_padilah", icon: <Instagram size={22}/> },
  { href: "https://github.com/Zombiesigma", icon: <Github size={22}/> },
  { href: "mailto:gunturfadilah140@gmail.com", icon: <Mail size={22}/> },
  { href: "https://api.whatsapp.com/send?phone=6285655548656&text=Halo%20Guntur,%20saya%20tertarik%20dengan%20karya%20Anda", icon: <MessageCircle size={22}/> },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 bg-card/20">
      <div className="container mx-auto px-4">
        <nav aria-label="Breadcrumb" className="hidden md:block mb-6">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center space-x-2">
                {index > 0 && <span>/</span>}
                <Link href={crumb.href} className="hover:text-primary">{crumb.label}</Link>
              </li>
            ))}
          </ol>
        </nav>
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-muted-foreground">&copy; {currentYear} Guntur Padilah. All rights reserved.</p>
            <p className="text-sm text-muted-foreground/70">Penulis • Pelukis • Web Developer • Sukabumi, Indonesia</p>
          </div>
          <div className="flex space-x-6">
            {socialLinks.map(link => (
              <Link key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                {link.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
