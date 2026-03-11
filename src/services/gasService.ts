import { GASResponse } from '../types';

const GAS_URL_RAW = import.meta.env.VITE_GAS_URL;

export const gasService = {
  async request<T>(action: string, data?: any): Promise<GASResponse<T>> {
    if (!GAS_URL_RAW) {
      throw new Error('VITE_GAS_URL is not configured.');
    }

    // Auto-fix URL if /exec is missing
    let url = GAS_URL_RAW.trim();
    if (url.includes('script.google.com') && !url.endsWith('/exec')) {
      url = url.endsWith('/') ? url + 'exec' : url + '/exec';
    }

    try {
      // A true "simple request" has NO custom headers and uses text/plain
      // This is the most reliable way to talk to GAS from a browser
      const response = await fetch(url, {
        method: 'POST',
        // No headers here to keep it "simple"
        body: JSON.stringify({ action, ...data }),
      });

      const result = await response.json();
      return result;
    } catch (e: any) {
      console.error('GAS Request failed:', e);
      throw new Error(`Koneksi Gagal: ${e.message || 'Cek koneksi internet atau deployment GAS'}`);
    }
  },

  async login(nama: string, password: string) {
    return this.request('login', { data: { nama, password } });
  },

  async register(nama: string, password: string) {
    return this.request('register', { data: { nama, password } });
  },

  async saveImage(userId: string, promptteks: string, photoBase64: string) {
    return this.request('saveImage', { data: { userId, promptteks, photoBase64 } });
  },

  async getHistory(userId: string) {
    return this.request('getHistory', { userId });
  },

  async deleteImage(seq: number, userId: string) {
    return this.request('deleteImage', { id: seq, userId });
  }
};
