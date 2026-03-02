"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Github, Globe, Instagram, Loader2, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus memiliki minimal 2 karakter.' }),
  email: z.string().email({ message: 'Alamat email tidak valid.' }),
  phone: z.string().optional(),
  projectType: z.string().min(1, { message: 'Silakan pilih jenis kolaborasi.' }),
  message: z.string().min(10, { message: 'Pesan harus memiliki minimal 10 karakter.' }),
});

async function submitAction(data: z.infer<typeof formSchema>) {
  // In a real app, you would send this data to your backend or an email service.
  // For this example, we'll just simulate a successful submission.
  console.log('Form submitted:', data);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, name: data.name };
}

export function ContactSection() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      projectType: '',
      message: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await submitAction(values);
    if (result.success) {
      toast({
        title: 'Pesan Terkirim!',
        description: `Terima kasih ${result.name}, pesan Anda telah berhasil dikirim.`,
      });
      form.reset();
    } else {
      toast({
        title: 'Gagal Mengirim Pesan',
        description: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    }
  };

  const contactInfo = [
    { icon: <Mail size={20} />, label: "Email", value: "gunturfadilah140@gmail.com" },
    { icon: <Phone size={20} />, label: "Telepon/WhatsApp", value: "+62 856-5554-8656" },
    { icon: <MapPin size={20} />, label: "Lokasi", value: "Sukabumi, Jawa Barat, Indonesia" },
  ];

  const socialLinks = [
    { icon: <Instagram />, href: "https://www.instagram.com/guntur_padilah", label: "Instagram" },
    { icon: <Github />, href: "https://github.com/Zombiesigma", label: "GitHub" },
    { icon: <Globe />, href: "https://www.gunturpadilah.web.id", label: "Website" },
  ];


  return (
    <section id="contact" className="py-24 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-16 font-headline text-4xl font-bold md:text-5xl gradient-text">Mari Berkolaborasi</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <div className="animate-in fade-in-up">
            <h3 className="font-headline text-2xl font-bold">Tertarik dengan Karya Saya?</h3>
            <p className="my-6 text-muted-foreground">Saya selalu terbuka untuk kolaborasi kreatif, proyek menulis, komisi lukisan, atau pengembangan aplikasi yang menarik. Mari kita ciptakan sesuatu yang luar biasa bersama.</p>
            <div className="space-y-4">
              {contactInfo.map(info => (
                <div key={info.label} className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{info.icon}</div>
                  <div>
                    <p className="text-sm text-muted-foreground">{info.label}</p>
                    <p className="font-semibold">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
             <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Follow Saya di:</h4>
                <div className="flex space-x-2">
                    {socialLinks.map(link => (
                        <Button key={link.label} asChild variant="outline" size="icon" className="rounded-full">
                            <Link href={link.href} aria-label={link.label} target="_blank" rel="noopener noreferrer">
                                {link.icon}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>
          </div>

          <div className="animate-in fade-in-up" style={{ animationDelay: '200ms' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Nama Anda" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Alamat Email</FormLabel><FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="projectType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kolaborasi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih jenis proyek" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="writing">Proyek Menulis</SelectItem>
                        <SelectItem value="painting">Komisi Lukisan</SelectItem>
                        <SelectItem value="development">Web Development</SelectItem>
                        <SelectItem value="consultation">Konsultasi Kreatif</SelectItem>
                        <SelectItem value="other">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem><FormLabel>Pesan Anda</FormLabel><FormControl><Textarea placeholder="Ceritakan ide atau proyek Anda..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</> : 'Kirim Pesan'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
