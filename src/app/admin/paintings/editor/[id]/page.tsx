'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Background3D } from '@/components/background-3d';

const paintingSchema = z.object({
  title: z.string().min(3, { message: 'Judul minimal 3 karakter.' }),
  slug: z.string().min(3, { message: 'Slug minimal 3 karakter.' }).regex(/^[a-z0-9-]+$/, { message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.' }),
  year: z.coerce.number().min(2000, { message: 'Tahun tidak valid.' }),
  description: z.string().min(20, { message: 'Deskripsi minimal 20 karakter.' }),
  imageFile: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || (files?.[0]?.size <= 5 * 1024 * 1024), 'Ukuran file maksimal 5MB.')
    .refine((files) => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(files?.[0]?.type), 'Format yang didukung hanya .jpg, .jpeg, .png, .webp, dan .gif'),
});

type PaintingData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  year: number;
  imageUrl: string;
};


export default function PaintingEditorPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const paintingId = params.id as string;
  const isEditMode = paintingId !== 'new';
  
  const paintingRef = useMemo(() => {
    if (!firestore || !isEditMode) return null;
    return doc(firestore, 'paintings', paintingId)
  }, [firestore, isEditMode, paintingId]);
  
  const { data: paintingToEdit, loading: paintingLoading } = useDoc<PaintingData>(paintingRef);

  const form = useForm<z.infer<typeof paintingSchema>>({
    resolver: zodResolver(paintingSchema),
    defaultValues: {
      title: '',
      slug: '',
      year: new Date().getFullYear(),
      description: '',
      imageFile: undefined,
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isEditMode && paintingToEdit) {
      form.reset({
        title: paintingToEdit.title,
        slug: paintingToEdit.slug,
        year: paintingToEdit.year,
        description: paintingToEdit.description,
        imageFile: undefined,
      });
    }
  }, [isEditMode, paintingToEdit, form]);
  
  const onSubmit = async (values: z.infer<typeof paintingSchema>) => {
    if (!firestore) return;

    let imageUrl = paintingToEdit?.imageUrl || '';
    const imageFile = values.imageFile?.[0];

    if (!isEditMode && (!values.imageFile || values.imageFile.length === 0)) {
        form.setError('imageFile', { type: 'manual', message: 'File gambar diperlukan untuk lukisan baru.' });
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
    
    const paintingData = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        year: values.year,
        imageUrl: imageUrl,
    };

    try {
        if (isEditMode) {
            if(!paintingToEdit) return;
            const docRef = doc(firestore, 'paintings', paintingToEdit.id);
            await updateDoc(docRef, paintingData);
            toast({
                title: 'Lukisan berhasil diperbarui!',
                description: `Perubahan pada "${values.title}" telah disimpan.`,
            });
        } else {
            await addDoc(collection(firestore, 'paintings'), {
                ...paintingData,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Lukisan berhasil ditambahkan!',
                description: `Lukisan "${values.title}" telah dipublikasikan.`,
            });
        }
        router.push('/admin');
    } catch (error: any) {
         toast({
            title: isEditMode ? 'Gagal memperbarui lukisan' : 'Gagal menambahkan lukisan',
            description: error.message,
            variant: 'destructive',
        });
    }
  };
  
  if (userLoading || (isEditMode && paintingLoading)) {
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
            {isEditMode ? 'Edit Lukisan' : 'Tambah Lukisan Baru'}
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Judul Lukisan</FormLabel><FormControl><Input placeholder="Judul karya Anda" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="contoh-slug-lukisan" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>Tahun</FormLabel><FormControl><Input type="number" placeholder="2024" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="imageFile"
                  render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                      <FormLabel>Gambar Lukisan</FormLabel>
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
                        {isEditMode ? 'Unggah gambar baru untuk mengganti yang lama (opsional, maks. 5MB).' : 'Unggah gambar lukisan (Maks. 5MB).'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Deskripsi/Cerita</FormLabel><FormControl><Textarea placeholder="Ceritakan kisah di balik lukisan ini..." {...field} className="min-h-[200px]" /></FormControl><FormMessage /></FormItem>)}/>
              
              <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="secondary" onClick={() => router.push('/admin')}>Batal</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Simpan Perubahan' : 'Publikasikan Lukisan'}</>}
                  </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
