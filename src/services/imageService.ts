/**
 * Service untuk generate image langsung dari frontend
 */

// Ambil token dari environment variable (VITE_HF_TOKEN)
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

export const generateImageFrontend = async (prompt: string): Promise<{ success: boolean; imageData?: string; error?: string; modelUsed?: string }> => {
  console.log("Memulai generate image di frontend...");
  console.log("HF Token status:", HF_TOKEN ? "Ditemukan" : "TIDAK Ditemukan (Cek Vercel Env)");

  const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, " ");
  const seed = Math.floor(Math.random() * 1000000);

  // --- OPSI 1: POLLINATIONS (Utama) ---
  try {
    console.log("Mencoba Pollinations...");
    const enhancedPrompt = encodeURIComponent(cleanPrompt + ", high quality, 4k, masterpiece");
    const pollUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

    const response = await fetch(pollUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      return { success: true, imageData: base64Data, modelUsed: "Pollinations (Flux)" };
    }
  } catch (err) {
    console.warn("Pollinations gagal:", err);
  }

  // --- OPSI 2: MAGIC STUDIO (Cadangan Sangat Stabil) ---
  try {
    console.log("Mencoba Magic Studio...");
    const magicUrl = `https://api.magicstudio.com/v1/ai-art-generator?prompt=${encodeURIComponent(cleanPrompt)}&seed=${seed}`;
    const response = await fetch(magicUrl);
    if (response.ok) {
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      return { success: true, imageData: base64Data, modelUsed: "Magic Studio" };
    }
  } catch (err) {
    console.warn("Magic Studio gagal:", err);
  }

  // --- OPSI 3: HUGGING FACE (Cadangan Terakhir) ---
  if (HF_TOKEN) {
    try {
      console.log("Mencoba Hugging Face...");
      const hfModel = "black-forest-labs/FLUX.1-schnell";
      const hfUrl = `https://api-inference.huggingface.co/models/${hfModel}`;
      
      const response = await fetch(hfUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const base64Data = await blobToBase64(blob);
        return { success: true, imageData: base64Data, modelUsed: "HuggingFace (Flux)" };
      }
    } catch (err) {
      console.error("Hugging Face Error:", err);
    }
  }

  return {
    success: false,
    error: `Gagal generate. ${!HF_TOKEN ? "Token HF tidak ditemukan di Env Vercel." : "Semua server sedang sibuk."}`
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
