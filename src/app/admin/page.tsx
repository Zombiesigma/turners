'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import Image from 'next/image';

type Article = {
  id: string;
  slug: string;
  title: string;
  date: Timestamp;
};

type Painting = {
  id: string;
  slug: string;
  title: string;
  year: number;
  createdAt: Timestamp;
};

type Photo = {
    id: string;
    caption: string;
    imageUrl: string;
    createdAt: Timestamp;
};


export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [paintingToDelete, setPaintingToDelete] = useState<Painting | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  const articlesQuery = firestore ? query(collection(firestore, 'articles'), orderBy('date', 'desc')) : null;
  const { data: articles, loading: articlesLoading } = useCollection<Article>(articlesQuery);

  const paintingsQuery = firestore ? query(collection(firestore, 'paintings'), orderBy('createdAt', 'desc')) : null;
  const { data: paintings, loading: paintingsLoading } = useCollection<Painting>(paintingsQuery);

  const photosQuery = firestore ? query(collection(firestore, 'photos'), orderBy('createdAt', 'desc')) : null;
  const { data: photos, loading: photosLoading } = useCollection<Photo>(photosQuery);
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleDelete = async (type: 'article' | 'painting' | 'photo') => {
    if (!firestore) return;
    
    let itemToDelete;
    let collectionName: string;
    let itemTitle: string | undefined;

    switch (type) {
        case 'article':
            itemToDelete = articleToDelete;
            collectionName = 'articles';
            itemTitle = articleToDelete?.title;
            break;
        case 'painting':
            itemToDelete = paintingToDelete;
            collectionName = 'paintings';
            itemTitle = paintingToDelete?.title;
            break;
        case 'photo':
            itemToDelete = photoToDelete;
            collectionName = 'photos';
            itemTitle = photoToDelete?.caption || 'Foto';
            break;
    }

    if (!itemToDelete) return;

    try {
      await deleteDoc(doc(firestore, collectionName, itemToDelete.id));
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} berhasil dihapus!`,
        description: `"${itemTitle}" telah dihapus.`,
      });
    } catch (error: any) {
      toast({
        title: `Gagal menghapus ${type}`,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        switch (type) {
            case 'article': setArticleToDelete(null); break;
            case 'painting': setPaintingToDelete(null); break;
            case 'photo': setPhotoToDelete(null); break;
        }
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

        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex justify-between items-center">
            <p className="text-muted-foreground">Selamat datang, {user.email}</p>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>

          <Tabs defaultValue="articles" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="articles">Manajemen Artikel</TabsTrigger>
                <TabsTrigger value="paintings">Manajemen Lukisan</TabsTrigger>
                <TabsTrigger value="photos">Manajemen Foto</TabsTrigger>
            </TabsList>
            <TabsContent value="articles">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Artikel</CardTitle>
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
            </TabsContent>
            <TabsContent value="paintings">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Lukisan</CardTitle>
                            <CardDescription>Tambah, edit, atau hapus lukisan di galeri Anda.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/admin/paintings/editor/new">
                                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Lukisan
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50%]">Judul</TableHead>
                                    <TableHead className="hidden md:table-cell">Tahun</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paintingsLoading && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-12">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!paintingsLoading && paintings && paintings.map(painting => (
                                    <TableRow key={painting.id}>
                                        <TableCell className="font-medium">{painting.title}</TableCell>
                                        <TableCell className="hidden md:table-cell">{painting.year}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/paintings/editor/${painting.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setPaintingToDelete(painting)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="photos">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Foto</CardTitle>
                            <CardDescription>Tambah, edit, atau hapus foto di galeri personal Anda.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/admin/photos/editor/new">
                                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Foto
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Foto</TableHead>
                                    <TableHead>Keterangan</TableHead>
                                    <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {photosLoading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12">
                                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!photosLoading && photos && photos.map(photo => (
                                    <TableRow key={photo.id}>
                                        <TableCell>
                                            <Image src={photo.imageUrl} alt={photo.caption || 'Foto'} width={80} height={80} className="rounded-md object-cover aspect-square"/>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[250px] truncate">{photo.caption || '-'}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {photo.createdAt ? photo.createdAt.toDate().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Tidak ada tanggal'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/admin/photos/editor/${photo.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setPhotoToDelete(photo)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Delete Dialogs */}
        <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Aksi ini tidak bisa dibatalkan. Artikel &quot;{articleToDelete?.title}&quot; akan dihapus secara permanen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete('article')}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!paintingToDelete} onOpenChange={() => setPaintingToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Aksi ini tidak bisa dibatalkan. Lukisan &quot;{paintingToDelete?.title}&quot; akan dihapus secara permanen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete('painting')}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Aksi ini tidak bisa dibatalkan. Foto dengan keterangan &quot;{photoToDelete?.caption || 'Tanpa Keterangan'}&quot; akan dihapus secara permanen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete('photo')}>Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
