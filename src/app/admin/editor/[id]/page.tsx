'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Background3D } from '@/components/background-3d';

const articleSchema = z.object({
  title: z.string().min(5, { message: 'Judul minimal 5 karakter.' }),
  slug: z.string().min(5, { message: 'Slug minimal 5 karakter.' }).regex(/^[a-z0-9-]+$/, { message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.' }),
  excerpt: z.string().min(20, { message: 'Kutipan minimal 20 karakter.' }),
  content: z.string().min(100, { message: 'Konten minimal 100 karakter.' }),
  tags: z.string().min(3, { message: 'Tambahkan setidaknya satu tag, pisahkan dengan koma.' }),
  imageFile: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || (files?.[0]?.size <= 5 * 1024 * 1024), 'Ukuran file maksimal 5MB.')
    .refine((files) => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(files?.[0]?.type), 'Format yang didukung hanya .jpg, .jpeg, .png, .webp, dan .gif'),
});

type ArticleData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: Timestamp;
  tags: string[];
  imageUrl: string;
};


export default function EditorPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const articleId = params.id as string;
  const isEditMode = articleId !== 'new';
  
  const articleRef = useMemo(() => {
    if (!firestore || !isEditMode) return null;
    return doc(firestore, 'articles', articleId)
  }, [firestore, isEditMode, articleId]);
  
  const { data: articleToEdit, loading: articleLoading } = useDoc<ArticleData>(articleRef);

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      tags: '',
      imageFile: undefined,
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isEditMode && articleToEdit) {
      form.reset({
        title: articleToEdit.title,
        slug: articleToEdit.slug,
        excerpt: articleToEdit.excerpt,
        content: articleToEdit.content,
        tags: articleToEdit.tags.join(', '),
        imageFile: undefined,
      });
    }
  }, [isEditMode, articleToEdit, form]);
  
  const onSubmit = async (values: z.infer<typeof articleSchema>) => {
    if (!firestore) return;

    let imageUrl = articleToEdit?.imageUrl || '';
    const imageFile = values.imageFile?.[0];

    if (!isEditMode && (!values.imageFile || values.imageFile.length === 0)) {
        form.setError('imageFile', { type: 'manual', message: 'File gambar diperlukan untuk artikel baru.' });
        return;
    }

    if (imageFile) {
        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal mengunggah gambar.');
            }
            const result = await response.json();
            imageUrl = result.imageUrl;
        } catch (error: any) {
            toast({
                title: 'Gagal Mengunggah Gambar',
                description: error.message,
                variant: 'destructive',
            });
            return;
        }
    }
    
    const tagsArray = values.tags.split(',').map(tag => tag.trim());
    const articleData = {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        imageUrl: imageUrl,
        tags: tagsArray,
    };

    try {
        if (isEditMode) {
            if(!articleToEdit) return;
            const articleRef = doc(firestore, 'articles', articleToEdit.id);
            await updateDoc(articleRef, articleData);
            toast({
                title: 'Artikel berhasil diperbarui!',
                description: `Perubahan pada "${values.title}" telah disimpan.`,
            });
        } else {
            await addDoc(collection(firestore, 'articles'), {
                ...articleData,
                date: serverTimestamp(),
            });
            toast({
                title: 'Artikel berhasil ditambahkan!',
                description: `Artikel "${values.title}" telah dipublikasikan.`,
            });
        }
        router.push('/admin');
    } catch (error: any) {
         toast({
            title: isEditMode ? 'Gagal memperbarui artikel' : 'Gagal menambahkan artikel',
            description: error.message,
            variant: 'destructive',
        });
    }
  };
  
  if (userLoading || (isEditMode && articleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Background3D />
      <main className="container mx-auto px-4 py-12 sm:py-24 relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <Button asChild variant="outline">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dasbor
              </Link>
            </Button>
          </div>

          <h1 className="font-headline text-4xl font-bold md:text-5xl gradient-text mb-8">
            {isEditMode ? 'Edit Artikel' : 'Tulis Artikel Baru'}
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Judul Artikel</FormLabel><FormControl><Input placeholder="Judul artikel Anda" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="contoh-slug-artikel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="imageFile"
                  render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                      <FormLabel>Gambar Artikel</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/gif"
                          ref={ref}
                          name={name}
                          onBlur={onBlur}
                          onChange={(e) => onChange(e.target.files)}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        {isEditMode ? 'Unggah gambar baru untuk mengganti yang lama (opsional, maks. 5MB).' : 'Unggah gambar utama untuk artikel Anda (Maks. 5MB).'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="excerpt" render={({ field }) => (<FormItem><FormLabel>Kutipan</FormLabel><FormControl><Textarea placeholder="Tulis kutipan singkat di sini..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Konten Artikel</FormLabel><FormControl><Textarea placeholder="Tulis artikel lengkap di sini... Anda bisa menggunakan format Markdown." {...field} className="min-h-[350px]" /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags (pisahkan dengan koma)</FormLabel><FormControl><Input placeholder="Menulis, Teknologi, Kreativitas" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              
              <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="secondary" onClick={() => router.push('/admin')}>Batal</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</>}
                  </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
