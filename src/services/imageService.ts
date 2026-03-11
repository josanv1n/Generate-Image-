/**
 * Service untuk generate image langsung dari frontend
 */

// Ambil token dari environment variable (VITE_HF_TOKEN)
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

export const generateImageFrontend = async (prompt: string): Promise<{ success: boolean; imageData?: string; error?: string; modelUsed?: string }> => {
  console.log("--- Memulai Proses Generate ---");
  console.log("Prompt:", prompt);
  console.log("HF Token status:", HF_TOKEN ? "Ditemukan" : "TIDAK Ditemukan (Cek Vercel Env)");

  const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, " ");
  const seed = Math.floor(Math.random() * 1000000);

  // --- OPSI 1: POLLINATIONS (Sangat Andal) ---
  try {
    console.log("1. Mencoba Pollinations...");
    const enhancedPrompt = encodeURIComponent(cleanPrompt + ", high quality, 4k, masterpiece, cinematic lighting");
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

  // --- OPSI 2: MAGIC STUDIO ---
  try {
    console.log("2. Mencoba Magic Studio...");
    const magicUrl = `https://api.magicstudio.com/v1/ai-art-generator?prompt=${encodeURIComponent(cleanPrompt)}&seed=${seed}`;
    const response = await fetch(magicUrl);
    if (response.ok) {
      const blob = await response.blob();
      if (blob.type.startsWith('image/')) {
        const base64Data = await blobToBase64(blob);
        console.log("✅ Berhasil: Magic Studio");
        return { success: true, imageData: base64Data, modelUsed: "Magic Studio" };
      }
    }
    console.warn(`Magic Studio Gagal (Status: ${response.status})`);
  } catch (err: any) {
    console.warn("Magic Studio Error:", err.message);
  }

  // --- OPSI 3: HUGGING FACE (FLUX) ---
  if (HF_TOKEN) {
    try {
      console.log("3. Mencoba Hugging Face (Flux)...");
      const hfUrl = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";
      
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
        console.log("✅ Berhasil: Hugging Face (Flux)");
        return { success: true, imageData: base64Data, modelUsed: "HuggingFace (Flux)" };
      }
      console.warn(`HF Flux Gagal (Status: ${response.status})`);
    } catch (err: any) {
      console.error("HF Flux Error:", err.message);
    }

    // --- OPSI 4: HUGGING FACE (SDXL - Fallback HF) ---
    try {
      console.log("4. Mencoba Hugging Face (SDXL)...");
      const hfUrl = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
      
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
        console.log("✅ Berhasil: Hugging Face (SDXL)");
        return { success: true, imageData: base64Data, modelUsed: "HuggingFace (SDXL)" };
      }
      console.warn(`HF SDXL Gagal (Status: ${response.status})`);
    } catch (err: any) {
      console.error("HF SDXL Error:", err.message);
    }
  }

  return {
    success: false,
    error: `Gagal generate. ${!HF_TOKEN ? "Token HF tidak ditemukan." : "Semua server (Pollinations, MagicStudio, HF) sedang sibuk. Coba prompt lain atau tunggu sebentar."}`
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
