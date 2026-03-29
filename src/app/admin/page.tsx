'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const articleSchema = z.object({
  title: z.string().min(5, { message: 'Judul minimal 5 karakter.' }),
  slug: z.string().min(5, { message: 'Slug minimal 5 karakter.' }).regex(/^[a-z0-9-]+$/, { message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.' }),
  excerpt: z.string().min(20, { message: 'Kutipan minimal 20 karakter.' }),
  tags: z.string().min(3, { message: 'Tambahkan setidaknya satu tag, pisahkan dengan koma.' }),
  imageId: z.string().min(1, { message: 'Image ID tidak boleh kosong.' }),
});

export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      tags: '',
      imageId: 'article-image-1',
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const onSubmit = async (values: z.infer<typeof articleSchema>) => {
    if (!firestore) return;
    try {
      const tagsArray = values.tags.split(',').map(tag => tag.trim());
      await addDoc(collection(firestore, 'articles'), {
        ...values,
        tags: tagsArray,
        date: serverTimestamp(),
      });
      toast({
        title: 'Artikel berhasil ditambahkan!',
        description: `Artikel "${values.title}" telah dipublikasikan.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Gagal menambahkan artikel',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-24">
        <div className="relative mb-12">
            <div className="absolute top-0 left-0">
                <Button asChild variant="outline">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Beranda
                  </Link>
                </Button>
            </div>
            <h1 className="text-center font-headline text-4xl font-bold md:text-5xl gradient-text">
              Dasbor Admin
            </h1>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex justify-between items-center">
            <p className="text-muted-foreground">Selamat datang, {user.email}</p>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <h2 className="mb-6 font-headline text-2xl font-bold">Tambah Artikel Baru</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Artikel</FormLabel>
                    <FormControl>
                      <Input placeholder="Judul artikel Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="contoh-slug-artikel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kutipan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tulis kutipan singkat di sini..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (pisahkan dengan koma)</FormLabel>
                    <FormControl>
                      <Input placeholder="Menulis, Teknologi, Kreativitas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image ID</FormLabel>
                    <FormControl>
                      <Input placeholder="article-image-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menerbitkan...
                  </>
                ) : (
                  'Terbitkan Artikel'
                )}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
