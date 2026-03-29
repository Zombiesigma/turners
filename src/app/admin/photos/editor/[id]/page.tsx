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

const photoSchema = z.object({
  caption: z.string().optional(),
  imageFile: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || (files?.[0]?.size <= 5 * 1024 * 1024), 'Ukuran file maksimal 5MB.')
    .refine((files) => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(files?.[0]?.type), 'Format yang didukung hanya .jpg, .jpeg, .png, .webp, dan .gif'),
});

type PhotoData = {
  id: string;
  caption?: string;
  imageUrl: string;
};


export default function PhotoEditorPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const photoId = params.id as string;
  const isEditMode = photoId !== 'new';
  
  const photoRef = useMemo(() => {
    if (!firestore || !isEditMode) return null;
    return doc(firestore, 'photos', photoId)
  }, [firestore, isEditMode, photoId]);
  
  const { data: photoToEdit, loading: photoLoading } = useDoc<PhotoData>(photoRef);

  const form = useForm<z.infer<typeof photoSchema>>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      caption: '',
      imageFile: undefined,
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isEditMode && photoToEdit) {
      form.reset({
        caption: photoToEdit.caption || '',
        imageFile: undefined,
      });
    }
  }, [isEditMode, photoToEdit, form]);
  
  const onSubmit = async (values: z.infer<typeof photoSchema>) => {
    if (!firestore) return;

    let imageUrl = photoToEdit?.imageUrl || '';
    const imageFile = values.imageFile?.[0];

    if (!isEditMode && (!values.imageFile || values.imageFile.length === 0)) {
        form.setError('imageFile', { type: 'manual', message: 'File gambar diperlukan untuk foto baru.' });
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
    
    const photoData = {
        caption: values.caption,
        imageUrl: imageUrl,
    };

    try {
        if (isEditMode) {
            if(!photoToEdit) return;
            const docRef = doc(firestore, 'photos', photoToEdit.id);
            await updateDoc(docRef, photoData);
            toast({
                title: 'Foto berhasil diperbarui!',
                description: 'Perubahan pada foto telah disimpan.',
            });
        } else {
            await addDoc(collection(firestore, 'photos'), {
                ...photoData,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Foto berhasil ditambahkan!',
                description: 'Foto baru telah ditambahkan ke galeri Anda.',
            });
        }
        router.push('/admin');
    } catch (error: any) {
         toast({
            title: isEditMode ? 'Gagal memperbarui foto' : 'Gagal menambahkan foto',
            description: error.message,
            variant: 'destructive',
        });
    }
  };
  
  if (userLoading || (isEditMode && photoLoading)) {
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
            {isEditMode ? 'Edit Foto' : 'Tambah Foto Baru'}
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="imageFile"
                  render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                      <FormLabel>Gambar Foto</FormLabel>
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
                        {isEditMode ? 'Unggah gambar baru untuk mengganti yang lama (opsional, maks. 5MB).' : 'Unggah gambar foto (Maks. 5MB).'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="caption" render={({ field }) => (<FormItem><FormLabel>Keterangan (Opsional)</FormLabel><FormControl><Textarea placeholder="Ceritakan sesuatu tentang foto ini..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
              
              <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="secondary" onClick={() => router.push('/admin')}>Batal</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Simpan Perubahan' : 'Publikasikan Foto'}</>}
                  </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
