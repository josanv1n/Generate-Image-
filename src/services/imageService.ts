/**
 * Service untuk generate image langsung dari frontend
 */

// Ambil token dari environment variable (VITE_HF_TOKEN)
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

export const generateImageFrontend = async (prompt: string): Promise<{ success: boolean; imageData?: string; error?: string; modelUsed?: string }> => {
  console.log("Memulai generate image di frontend...");

  // --- OPSI 1: POLLINATIONS (Utama - Tanpa Key) ---
  try {
    console.log("Mencoba Pollinations...");
    const cleanPrompt = prompt.replace(/[^a-zA-Z0-9 ]/g, "");
    const enhancedPrompt = encodeURIComponent(cleanPrompt + ", techno graphic, neon cyberpunk style, high quality, 4k");
    const seed = Math.floor(Math.random() * 1000000);
    const pollUrl = `https://image.pollinations.ai/prompt/${enhancedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;

    const response = await fetch(pollUrl);
    if (response.ok) {
      const blob = await response.blob();
      const base64Data = await blobToBase64(blob);
      return {
        success: true,
        imageData: base64Data,
        modelUsed: "Pollinations (Flux)"
      };
    }
    console.warn("Pollinations gagal, mencoba Hugging Face...");
  } catch (err) {
    console.error("Pollinations Error:", err);
  }

  // --- OPSI 2: HUGGING FACE (Cadangan) ---
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
        return {
          success: true,
          imageData: base64Data,
          modelUsed: "HuggingFace (Flux Schnell)"
        };
      }
      const errorText = await response.text();
      console.error("Hugging Face Error:", errorText);
    } catch (err) {
      console.error("Hugging Face Error:", err);
    }
  }

  return {
    success: false,
    error: "Semua metode generate di frontend gagal. Silakan coba lagi nanti."
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
