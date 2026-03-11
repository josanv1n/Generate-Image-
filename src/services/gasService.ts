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
      // We use a "simple request" (no Content-Type header) to avoid CORS preflight issues with GAS
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (e) {
      console.error('GAS Request failed. URL used:', url, 'Error:', e);
      throw new Error('Connection failed. Ensure GAS is deployed as "Anyone" and URL ends with /exec');
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
