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
  console.log("Prompt:", prompt);

  // --- OPSI 1: GEMINI API (Metode Paling Stabil) ---
  try {
    console.log("1. Mencoba Gemini API...");
    
    // Inisialisasi Gemini
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
    
    if (apiKey) {
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

      // Cari part yang berisi data gambar
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log("✅ Berhasil: Gemini API");
          return { success: true, imageData: base64Data, modelUsed: "Gemini 2.5 Flash" };
        }
      }
      console.warn("Gemini tidak mengembalikan gambar, mencoba fallback...");
    } else {
      console.warn("API Key Gemini tidak ditemukan, mencoba fallback...");
    }
  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }

  // --- OPSI 2: POLLINATIONS (Fallback Sangat Andal) ---
  try {
    console.log("2. Mencoba Pollinations...");
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, " ");
    const seed = Math.floor(Math.random() * 1000000);
    const enhancedPrompt = encodeURIComponent(cleanPrompt + ", high quality, 4k, masterpiece");
    const pollUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

    const response = await fetch(pollUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        const base64Data = await blobToBase64(blob);
        console.log("✅ Berhasil: Pollinations");
        return { success: true, imageData: base64Data, modelUsed: "Pollinations (Flux)" };
      }
    }
    console.warn(`Pollinations Gagal (Status: ${response.status})`);
  } catch (err: any) {
    console.warn("Pollinations Error:", err.message);
  }

  return {
    success: false,
    error: "Gagal generate gambar. Semua server (Gemini & Pollinations) sedang sibuk. Silakan coba prompt lain atau tunggu sebentar."
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
