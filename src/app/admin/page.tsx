'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Background3D } from '@/components/background-3d';


type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: Timestamp;
  tags: string[];
  imageUrl: string;
};

export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  const articlesQuery = firestore ? query(collection(firestore, 'articles'), orderBy('date', 'desc')) : null;
  const { data: articles, loading: articlesLoading } = useCollection<Article>(articlesQuery);
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

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
    <div className="min-h-screen">
      <Background3D />
      <main className="container mx-auto px-4 py-24 relative z-10">
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
                 <Button asChild>
                    <Link href="/admin/editor/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Tambah Artikel
                    </Link>
                </Button>
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
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/admin/editor/${article.id}`}>
                                            <Pencil className="h-4 w-4" />
                                        </Link>
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

        {/* Delete Alert Dialog */}
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
