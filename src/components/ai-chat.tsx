"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Headset, Loader2, Paperclip, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  text: string;
  sender: 'user' | 'ai';
};

const personalContext = `
Anda adalah asisten AI profesional untuk Guntur Padilah bernama Litera.
IDENTITAS:
- Nama: Guntur Padilah
- Profesi: Penulis (Novelis), Pelukis, Web Developer
- Lokasi: Pelabuhan Ratu, Sukabumi, Jawa Barat, Indonesia
- Email: gunturfadilah140@gmail.com
- WhatsApp: +62 856-5554-8656
- Website: gunturpadilah.web.id

KARYA UTAMA:
- Buku: "Beri Ruang Untuk Kelelahan" (Best Seller 2024, Penerbit Budhi Mulia)
- Sertifikat: Dicoding Indonesia (Web & JavaScript), Digitech University

KEAHLIAN:
- Menulis: Fiksi, Non-Fiksi, Puisi (95% Fiksi)
- Seni: Oil Painting, Watercolor, Digital Art
- Tech: Frontend (90%), Backend (80%), UI/UX (87%)

SOPAN RESPON:
- Jawab dengan ramah, profesional, dan informatif.
- Jika ada pertanyaan kolaborasi, arahkan ke email atau WhatsApp.
- Gunakan bahasa Indonesia.
- Jangan mengaku sebagai Guntur Padilah, tetapi sebagai asisten yang mewakilinya.
- Jika ditanya siapa pengembang website ini, jawab Guntur Padilah.
`;


export function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Halo! Saya Litera AI, asisten Guntur Padilah. Ada yang bisa saya bantu terkait karya, proyek, atau kolaborasi?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const fullPrompt = `${personalContext}\nUser: ${input}\nAsisten:`;
    const url = "https://api.himmel.web.id/api/ai/gemini";
    const params = new URLSearchParams({
        "apikey": "hmlt_hOn2k83lsV2lhZ8LQD4n",
        "question": fullPrompt
    });

    try {
        const response = await fetch(`${url}?${params}`);
        const rawData = await response.json();
        
        let reply = "Maaf, sistem sedang sibuk atau terjadi galat.";

        if (rawData.success && rawData.data && rawData.data.response) {
            reply = rawData.data.response;
        } else if (typeof rawData === 'string') {
            try {
                const parsed = JSON.parse(rawData);
                reply = parsed.response || parsed.data?.response || rawData;
            } catch (e) {
                reply = rawData;
            }
        }

        const aiMessage: Message = { text: reply.replace(/\\n/g, '\n').replace(/\*\*(.*?)\*\*/g, '$1'), sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        console.error("AI Error:", error);
        const errorMessage: Message = { text: "Maaf, terjadi kesalahan koneksi.", sender: 'ai' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  return (
    <>
      <div className="fixed bottom-24 right-8 z-50">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setIsOpen(!isOpen)}>
          <Bot />
        </Button>
      </div>
      <div className={cn(
        "fixed bottom-24 right-8 z-40 w-[350px] h-[450px] bg-card/80 backdrop-blur-lg border rounded-xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="p-4 bg-primary/10 flex items-center gap-3">
          <Headset className="text-primary"/>
          <h3 className="font-semibold text-foreground">Litera AI</h3>
        </div>
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>Mengetik...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya sesuatu..." 
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
