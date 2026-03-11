import { gasService } from "./gasService";

export const geminiService = {
  async generateImage(prompt: string, referenceImages: string[]) {
    try {
      const res = await gasService.request('generateImage', { prompt, referenceImages });
      
      if (res.success && res.imageData) {
        return res.imageData;
      }
      
      throw new Error(res.error || "Gagal menghasilkan gambar melalui server.");
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      throw error;
    }
  }
};
