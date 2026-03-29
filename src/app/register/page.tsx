'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!auth) {
        toast({ title: 'Kesalahan Autentikasi', description: 'Layanan autentikasi tidak tersedia.', variant: 'destructive'});
        return;
    }
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Pendaftaran Berhasil!',
        description: 'Akun Anda telah dibuat. Anda akan diarahkan ke dasbor admin.',
      });
      router.push('/admin');
    } catch (error: any) {
       let description = 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Alamat email ini sudah terdaftar.';
      }
      toast({
        title: 'Gagal Mendaftar',
        description: description,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
             <Link href="/" className="inline-block text-5xl font-bold font-headline gradient-text">
                GP.
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight">
                Daftar Akun Admin
            </h2>
            <p className="mt-2 text-muted-foreground">
                Buat akun baru untuk mengelola konten.
            </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@contoh.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mendaftar...</> : 'Daftar'}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
