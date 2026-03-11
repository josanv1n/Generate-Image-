import { GASResponse } from '../types';

const GAS_URL = import.meta.env.VITE_GAS_URL;

export const gasService = {
  async request<T>(action: string, data?: any): Promise<GASResponse<T>> {
    if (!GAS_URL) {
      throw new Error('VITE_GAS_URL is not configured. Please add it to your environment variables.');
    }

    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors for simple POST or it fails preflight
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    // Note: no-cors means we can't read the response body directly in the browser.
    // However, for Apps Script, we often use a JSONP-like approach or just handle the UI optimistically.
    // BUT, since we need data back (userId, history), we actually NEED a proper CORS setup.
    // To fix this, we'll use a standard fetch and expect the user to have deployed GAS correctly.
    // Actually, GAS Web Apps DO support CORS if handled correctly, but often it's easier to use a proxy or 
    // just accept that we might need to handle the redirect.
    
    // Let's try standard fetch first. If it fails, we'll suggest the user check their deployment.
    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...data }),
      });
      return await res.json();
    } catch (e) {
      console.error('GAS Request failed:', e);
      throw e;
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
