'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

const articleSchema = z.object({
  title: z.string().min(5, { message: 'Judul minimal 5 karakter.' }),
  slug: z.string().min(5, { message: 'Slug minimal 5 karakter.' }).regex(/^[a-z0-9-]+$/, { message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.' }),
  excerpt: z.string().min(20, { message: 'Kutipan minimal 20 karakter.' }),
  tags: z.string().min(3, { message: 'Tambahkan setidaknya satu tag, pisahkan dengan koma.' }),
  imageId: z.string().min(1, { message: 'Image ID tidak boleh kosong.' }),
});

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: Timestamp;
  tags: string[];
  imageId: string;
};

export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  const articlesQuery = firestore ? query(collection(firestore, 'articles'), orderBy('date', 'desc')) : null;
  const { data: articles, loading: articlesLoading } = useCollection<Article>(articlesQuery);

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      tags: '',
      imageId: `article-image-${Math.floor(Math.random() * 5) + 1}`,
    },
  });

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const onAddSubmit = async (values: z.infer<typeof articleSchema>) => {
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
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Gagal menambahkan artikel',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteArticle = async () => {
    if (!firestore || !articleToDelete) return;
    try {
      await deleteDoc(doc(firestore, 'articles', articleToDelete.id));
      toast({
        title: 'Artikel berhasil dihapus!',
        description: `Artikel "${articleToDelete.title}" telah dihapus.`,
      });
    } catch (error: any) {
      toast({
        title: 'Gagal menghapus artikel',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setArticleToDelete(null);
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

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex justify-between items-center">
            <p className="text-muted-foreground">Selamat datang, {user.email}</p>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manajemen Artikel</CardTitle>
                    <CardDescription>Tambah, edit, atau hapus artikel portofolio Anda.</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Tambah Artikel</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Tambah Artikel Baru</DialogTitle>
                            <DialogDescription>
                                Isi formulir di bawah ini untuk mempublikasikan artikel baru.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                              <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Judul Artikel</FormLabel><FormControl><Input placeholder="Judul artikel Anda" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="contoh-slug-artikel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={form.control} name="excerpt" render={({ field }) => (<FormItem><FormLabel>Kutipan</FormLabel><FormControl><Textarea placeholder="Tulis kutipan singkat di sini..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                              <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags (pisahkan dengan koma)</FormLabel><FormControl><Input placeholder="Menulis, Teknologi, Kreativitas" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                              <FormField control={form.control} name="imageId" render={({ field }) => (<FormItem><FormLabel>Image ID</FormLabel><FormControl><Input placeholder="article-image-1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                              <DialogFooter className="pt-4">
                                  <DialogClose asChild><Button type="button" variant="secondary">Batal</Button></DialogClose>
                                  <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menerbitkan...</> : 'Terbitkan Artikel'}
                                  </Button>
                              </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Judul</TableHead>
                            <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {articlesLoading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        )}
                        {!articlesLoading && articles && articles.map(article => (
                            <TableRow key={article.id}>
                                <TableCell className="font-medium">{article.title}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {article.date ? article.date.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak ada tanggal'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" disabled className="text-muted-foreground cursor-not-allowed">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setArticleToDelete(article)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Aksi ini tidak bisa dibatalkan. Artikel &quot;{articleToDelete?.title}&quot; akan dihapus secara permanen dari database.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteArticle}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
