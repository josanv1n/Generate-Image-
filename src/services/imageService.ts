/**
 * Service untuk generate image langsung dari frontend
 */

import { GoogleGenAI } from "@google/genai";

/**
 * Service untuk generate image menggunakan Gemini API Seri Terbaru
 * Mengutamakan kualitas tinggi (Gemini 3.1 & 2.5)
 * Mendukung referensi gambar (Image-to-Image)
 */

export const generateImageFrontend = async (
  prompt: string, 
  referenceImages: string[] = []
): Promise<{ success: boolean; imageData?: string; error?: string; modelUsed?: string }> => {
  console.log("--- Memulai Proses Generate High Quality ---");
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { 
      success: false, 
      error: "API Key Gemini belum dipasang di Vercel. Silakan tambahkan VITE_GEMINI_API_KEY di Environment Variables Vercel." 
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  // Siapkan parts untuk Gemini (Teks + Gambar Referensi)
  const parts: any[] = [{ text: prompt + ", high resolution, cinematic, masterpiece, highly detailed, maintain style of reference images" }];
  
  // Tambahkan gambar referensi jika ada
  for (const base64 of referenceImages) {
    const mimeType = base64.split(';')[0].split(':')[1];
    const data = base64.split(',')[1];
    parts.push({
      inlineData: {
        mimeType,
        data
      }
    });
  }

  // --- OPSI 1: GEMINI 3.1 FLASH IMAGE (Kualitas Tertinggi) ---
  try {
    console.log("1. Mencoba Gemini 3.1 Flash Image (High Quality)...");
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log("✅ Berhasil: Gemini 3.1");
        return { success: true, imageData: base64Data, modelUsed: "Gemini 3.1 Flash (1K)" };
      }
    }
  } catch (err: any) {
    console.warn("Gemini 3.1 Gagal:", err.message);
  }

  // --- OPSI 2: GEMINI 2.5 FLASH IMAGE ---
  try {
    console.log("2. Mencoba Gemini 2.5 Flash Image...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log("✅ Berhasil: Gemini 2.5");
        return { success: true, imageData: base64Data, modelUsed: "Gemini 2.5 Flash" };
      }
    }
  } catch (err: any) {
    console.warn("Gemini 2.5 Gagal:", err.message);
  }

  // --- OPSI 3: POLLINATIONS (Fallback Terakhir) ---
  try {
    console.log("3. Mencoba Pollinations Fallback...");
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

  return {
    success: false,
    error: "Gagal generate gambar. Semua model (Gemini 3.1, 2.5, & Pollinations) sedang sibuk."
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
