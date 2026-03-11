export interface User {
  id: string;
  nama: string;
}

export interface GeneratedImage {
  id: string;
  seq: number;
  timestamp: string;
  prompt: string;
  url: string;
}

export interface GASResponse<T = any> {
  success: boolean;
  error?: string;
  userId?: string;
  userName?: string;
  history?: T[];
  driveUrl?: string;
}
