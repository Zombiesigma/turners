"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Headset, Loader2, Send, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { getAiReply } from '@/app/actions';

type Message = {
  text: string;
  sender: 'user' | 'ai';
};

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
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        const reply = await getAiReply({ question: currentInput });
        const aiMessage: Message = { text: reply, sender: 'ai' };
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
      <div className="fixed bottom-8 right-8 z-50">
        <Button size="icon" className={cn("h-14 w-14 rounded-full shadow-lg transition-opacity", isOpen && "opacity-0 pointer-events-none")} onClick={() => setIsOpen(true)}>
          <Bot />
        </Button>
      </div>
      <div className={cn(
        "fixed bottom-28 z-40 bg-card/80 backdrop-blur-lg border rounded-xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
        "w-[calc(100vw-2rem)] h-[60vh] right-4",
        "sm:w-[350px] sm:h-[450px] sm:right-8",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="p-4 bg-primary/10 flex items-center justify-between gap-3">
          <div className='flex items-center gap-3'>
            <Headset className="text-primary"/>
            <h3 className="font-semibold text-foreground">Litera AI</h3>
          </div>
           <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
            <X size={20}/>
          </Button>
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
