'use server';

import { chatWithElitera, type ChatInput } from "@/ai/flows/litera-flow";

export async function getAiReply(input: ChatInput) {
    try {
        const result = await chatWithElitera(input);
        return result.reply;
    } catch (error) {
        console.error("AI flow error:", error);
        return "Maaf, sepertinya AI sedang istirahat. Coba lagi nanti.";
    }
}
