"use client";

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { getAiReply } from '@/app/actions';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

type Message = {
  text: string;
  sender: 'user' | 'ai';
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5">
    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
  </div>
);

export function AiChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Halo! Saya Elitera, asisten AI dari Guntur Padilah. Ada yang bisa saya bantu terkait karya, proyek, atau kolaborasi?',
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
        const errorMessage: Message = { text: "Maaf, sepertinya AI sedang beristirahat. Silakan coba lagi nanti.", sender: 'ai' };
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

  if (pathname === '/game') {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-8 right-8 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" className={cn("h-16 w-16 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-100", isOpen && "opacity-0 pointer-events-none")} onClick={() => setIsOpen(true)}>
              <Sparkles className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Tanya Elitera AI</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className={cn(
        "fixed bottom-28 z-40 bg-card/80 backdrop-blur-xl border-2 border-primary/20 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right",
        "w-[calc(100vw-2rem)] h-[70vh] right-4",
        "md:w-[400px] md:h-[600px] md:right-8",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="p-4 border-b border-primary/10 flex items-center justify-between gap-3">
          <div className='flex items-center gap-3'>
            <div className="relative">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Elitera AI</h3>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
           <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full">
            <X size={20}/>
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className={cn("flex items-end gap-2", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8">
                     <AvatarFallback className="bg-primary/20 text-primary">
                        <Sparkles size={18}/>
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-md",
                  msg.sender === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-muted text-muted-foreground rounded-bl-none'
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback className="bg-primary/20 text-primary">
                        <Sparkles size={18}/>
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted text-muted-foreground rounded-2xl rounded-bl-none px-4 py-3 text-sm flex items-center gap-2 shadow-md">
                    <TypingIndicator />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-primary/10">
          <div className="relative flex items-center gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya sesuatu pada Elitera..." 
              disabled={isLoading}
              className="pr-10"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="absolute right-1 h-8 w-8">
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </div>
           <p className="mt-2 text-center text-xs text-muted-foreground">Ditenagai oleh <span className="font-semibold text-primary/80">Gemini AI</span></p>
        </div>
      </div>
    </TooltipProvider>
  );
}
