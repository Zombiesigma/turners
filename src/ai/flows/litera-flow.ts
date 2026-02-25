'use server';
/**
 * @fileOverview A professional AI assistant for Guntur Padilah.
 *
 * - chatWithElitera - A function that handles the chat interaction.
 * - ChatInput - The input type for the chatWithElitera function.
 * - ChatOutput - The return type for the chatWithElitera function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ChatInputSchema = z.object({
  question: z.string().describe("The user's question for the AI assistant."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  reply: z.string().describe("The AI assistant's reply."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const eliteraPrompt = ai.definePrompt({
    name: 'eliteraPrompt',
    system: `Anda adalah asisten AI profesional untuk Guntur Padilah bernama Elitera.
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
- Jaga agar jawaban tetap ringkas namun lengkap.
`,
    input: { schema: z.string() },
    output: { schema: z.string() },
    config: {
        temperature: 0.5,
    },
    prompt: (input) => `User: ${input}\nAsisten:`
});


const chatFlow = ai.defineFlow(
  {
    name: 'eliteraChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const llmResponse = await eliteraPrompt(input.question);
    
    return {
      reply: llmResponse,
    };
  }
);


export async function chatWithElitera(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}
