"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Code,
  Feather,
  Github,
  Image,
  Landmark,
  Laptop,
  Menu,
  Newspaper,
  Paintbrush,
  Palette,
  ScrollText,
  Search,
  Wrench,
  X,
  Home,
  Award,
  Contact,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./search-overlay";
import { Separator } from "@/components/ui/separator";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuItems = [
    { href: "/#home", label: "Beranda", icon: <Home size={20} /> },
    { type: 'heading', label: "Karya Saya" },
    { href: "/#writing", label: "Tulisan", icon: <Feather size={20} />, isSub: true },
    { href: "/#paintings", label: "Lukisan", icon: <Palette size={20} />, isSub: true },
    { href: "/#projects", label: "Proyek", icon: <Code size={20} />, isSub: true },
    { type: 'divider' },
    { href: "/#certificates", label: "Sertifikat", icon: <Award size={20} /> },
    { href: "/#about", label: "Keahlian", icon: <Wrench size={20} /> },
    { href: "/game", label: "3D Game", icon: <Gamepad2 size={20} /> },
    { href: "/#contact", label: "Kontak", icon: <Contact size={20} /> },
  ];

  const MegaMenuItem = ({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) => (
    <Link href={href} passHref legacyBehavior>
      <a className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </a>
    </Link>
  );

  return (
    <>
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-300",
          isScrolled ? "bg-background/80 backdrop-blur-lg shadow-md" : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/#home" className="text-3xl font-bold font-headline gradient-text">
            GP.
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/#home" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">Beranda</Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">Karya Saya</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[600px] grid-cols-3 gap-3 p-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold font-headline text-primary px-3 py-2 flex items-center gap-2"><Feather size={16}/> Tulisan</h3>
                        <MegaMenuItem href="/#writing" icon={<BookOpen size={16}/>} title="Novel & Cerita" description="Karya fiksi terbaru"/>
                        <MegaMenuItem href="/#writing" icon={<Newspaper size={16}/>} title="Artikel & Esai" description="Tulisan non-fiksi"/>
                        <MegaMenuItem href="/#writing" icon={<ScrollText size={16}/>} title="Puisi" description="Kumpulan puisi"/>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold font-headline text-primary px-3 py-2 flex items-center gap-2"><Palette size={16}/> Lukisan</h3>
                        <MegaMenuItem href="/#paintings" icon={<Image size={16}/>} title="Galeri Lukisan" description="Karya seni visual"/>
                        <MegaMenuItem href="/#paintings" icon={<Landmark size={16}/>} title="Pameran" description="Eksibisi terkini"/>
                        <MegaMenuItem href="/#paintings" icon={<Paintbrush size={16}/>} title="Komisi" description="Layanan lukisan"/>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold font-headline text-primary px-3 py-2 flex items-center gap-2"><Code size={16}/> Development</h3>
                        <MegaMenuItem href="/#projects" icon={<Laptop size={16}/>} title="Proyek Web" description="Aplikasi & website"/>
                        <MegaMenuItem href="/#projects" icon={<Github size={16}/>} title="Open Source" description="Kontribusi komunitas"/>
                        <MegaMenuItem href="/#projects" icon={<Wrench size={16}/>} title="Tools & Scripts" description="Utilitas programming"/>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                 <NavigationMenuItem>
                    <Link href="/#certificates" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      Sertifikat
                    </Link>
                  </NavigationMenuItem>
                 <NavigationMenuItem>
                    <Link href="/#about" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      Keahlian
                    </Link>
                  </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link href="/game" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      3D Game
                    </Link>
                </NavigationMenuItem>
                 <NavigationMenuItem>
                    <Link href="/#contact" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      Kontak
                    </Link>
                  </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search />
            </Button>
            <ThemeToggle />
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                 <SheetTitle className="sr-only">Menu</SheetTitle>
                 <SheetDescription className="sr-only">Mobile navigation menu</SheetDescription>
                 <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                       <Link href="/#home" className="text-3xl font-bold font-headline gradient-text">
                        GP.
                      </Link>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon"><X /></Button>
                      </SheetClose>
                    </div>
                    <nav className="flex flex-col gap-1">
                      {menuItems.map((item, index) => {
                          if (item.type === 'heading') {
                            return <h4 key={index} className="px-3 pt-4 pb-2 text-sm font-semibold text-muted-foreground">{item.label}</h4>
                          }
                          if (item.type === 'divider') {
                            return <Separator key={index} className="my-2" />;
                          }
                          return (
                            <SheetClose asChild key={item.href}>
                              <Link
                                href={item.href!}
                                className={cn(
                                  "flex items-center gap-4 rounded-lg p-3 text-base font-medium transition-colors hover:bg-accent",
                                  item.isSub && "pl-8"
                                )}
                              >
                                <span className="text-primary">{item.icon}</span>
                                {item.label}
                              </Link>
                            </SheetClose>
                          )
                        })}
                    </nav>
                    <div className="mt-auto flex justify-center">
                        <ThemeToggle />
                    </div>
                 </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <SearchOverlay isOpen={isSearchOpen} setIsOpen={setIsSearchOpen} />
    </>
  );
}
