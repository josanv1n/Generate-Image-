import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async generateImage(prompt: string, referenceImages: string[]) {
    const model = "gemini-2.5-flash-image"; // As requested
    
    const parts: any[] = referenceImages.map(base64 => {
      const mimeType = base64.match(/data:(.*?);base64/)?.[1] || "image/png";
      return {
        inlineData: {
          data: base64.split(',')[1],
          mimeType: mimeType
        }
      };
    });

    parts.push({ text: prompt });

    try {
      const response = await genAI.models.generateContent({
        model: model,
        contents: { parts },
      });

      const candidate = response.candidates?.[0];
      if (!candidate) throw new Error("No candidates returned from Gemini.");

      for (const part of candidate.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
      
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Permintaan ditolak karena alasan keamanan (Safety Filter).");
      }

      throw new Error("Model tidak menghasilkan gambar. Coba ubah prompt Anda.");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
};
