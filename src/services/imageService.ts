/**
 * Service untuk generate image langsung dari frontend
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Service untuk generate image menggunakan Gemini API (Utama) 
 * dan Pollinations (Fallback)
 */

export const generateImageFrontend = async (prompt: string): Promise<{ success: boolean; imageData?: string; error?: string; modelUsed?: string }> => {
  console.log("--- Memulai Proses Generate ---");
  
  // Ambil API Key dari berbagai kemungkinan sumber
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
  
  console.log("API Key status:", apiKey ? "Tersedia" : "KOSONG (Cek Vercel Env)");

  // --- OPSI 1: GEMINI API ---
  if (apiKey) {
    try {
      console.log("1. Mencoba Gemini API...");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          return { success: true, imageData: base64Data, modelUsed: "Gemini 2.5 Flash" };
        }
      }
    } catch (err: any) {
      console.error("Gemini Error:", err.message);
      // Jika error karena API Key tidak valid, kita beri tahu
      if (err.message.includes("API_KEY_INVALID") || err.message.includes("403")) {
        return { success: false, error: "API Key Gemini di Vercel tidak valid atau tidak diizinkan." };
      }
    }
  }

  // --- OPSI 2: POLLINATIONS (Fallback) ---
  try {
    console.log("2. Mencoba Pollinations...");
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, " ");
    const seed = Math.floor(Math.random() * 1000000);
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

    const response = await fetch(pollUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        const base64Data = await blobToBase64(blob);
        return { success: true, imageData: base64Data, modelUsed: "Pollinations (Flux)" };
      }
    }
  } catch (err: any) {
    console.warn("Pollinations Error:", err.message);
  }

  // Jika sampai sini berarti semua gagal
  let specificError = "Semua server sedang sibuk.";
  if (!apiKey) {
    specificError = "API Key Gemini belum dipasang di Vercel. Silakan tambahkan VITE_GEMINI_API_KEY di Environment Variables Vercel.";
  }

  return {
    success: false,
    error: specificError
  };
};

// Helper untuk konversi Blob ke Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
