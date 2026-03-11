import React, { useState, useRef } from 'react';
import { Camera, Upload, Image as ImageIcon, Sparkles, Trash2, LogOut, History, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { gasService } from '../services/gasService';
import { generateImageFrontend } from '../services/imageService';
import { GeneratedImage } from '../types';

interface GeneratorProps {
  userId: string;
  userName: string;
  onLogout: () => void;
}

export default function Generator({ userId, userName, onLogout }: GeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream as MediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/png');
        setImages(prev => [...prev, data]);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const generate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null); // Clear previous image
    try {
      // Menggunakan service frontend baru (Pollinations & Hugging Face)
      const result = await generateImageFrontend(prompt);
      
      if (result.success && result.imageData) {
        setGeneratedImage(result.imageData);
        console.log("Model yang digunakan:", result.modelUsed);
      } else {
        throw new Error(result.error || "Gagal menghasilkan gambar.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal menghasilkan gambar. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    if (!generatedImage || !prompt) return;
    setIsSaving(true);
    try {
      const res = await gasService.saveImage(userId, prompt, generatedImage);
      if (res.success) {
        alert("Saved to Drive & Sheets!");
        fetchHistory();
      } else {
        alert(res.error || "Save failed");
      }
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await gasService.getHistory(userId);
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getDirectUrl = (url: string) => {
    if (!url) return '';
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
      if (id) return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  const deleteItem = async (seq: number) => {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await gasService.deleteImage(seq, userId);
      if (res.success) {
        fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <header className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h1 className="font-display text-xl glow-text text-[#00ff9d]">NANO BANANA</h1>
          <p className="text-xs text-white/50 font-mono uppercase tracking-widest">User: {userName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHistory(true)} className="p-2 techno-card hover:bg-white/10 transition-colors">
            <History size={20} className="text-[#00ff9d]" />
          </button>
          <button onClick={onLogout} className="p-2 techno-card hover:bg-red-500/20 transition-colors">
            <LogOut size={20} className="text-red-400" />
          </button>
        </div>
      </header>

      <main className="space-y-6">
        {/* Reference Images */}
        <section className="space-y-2">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">Reference Assets</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <label className="flex-shrink-0 w-16 h-16 techno-card flex items-center justify-center cursor-pointer hover:bg-white/5">
              <Upload size={20} className="text-white/40" />
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={startCamera} className="flex-shrink-0 w-16 h-16 techno-card flex items-center justify-center hover:bg-white/5">
              <Camera size={20} className="text-white/40" />
            </button>
            {images.map((img, i) => (
              <div key={i} className="flex-shrink-0 w-16 h-16 techno-card relative group">
                <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Prompt Input */}
        <section className="space-y-2">
          <label className="text-[10px] font-mono text-white/40 uppercase tracking-tighter">Neural Prompt</label>
          <div className="techno-card p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your vision..."
              className="w-full bg-transparent border-none focus:ring-0 text-sm min-h-[100px] resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={generate}
                disabled={isGenerating || !prompt}
                className="flex items-center gap-2 bg-[#00ff9d] text-black px-4 py-2 rounded-lg font-display text-xs font-bold disabled:opacity-50 hover:shadow-[0_0_15px_#00ff9d] transition-all"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                GENERATE
              </button>
            </div>
          </div>
        </section>

        {/* Result & Loading */}
        <section className="min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="techno-card aspect-square flex flex-col items-center justify-center space-y-4 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#00ff9d]/5 to-transparent animate-pulse"></div>
                <div className="relative">
                  <Loader2 className="animate-spin text-[#00ff9d]" size={48} />
                  <div className="absolute inset-0 blur-lg bg-[#00ff9d]/30 animate-pulse"></div>
                </div>
                <div className="text-center space-y-1 relative z-10">
                  <p className="font-display text-[#00ff9d] text-sm animate-pulse">NEURAL PROCESSING</p>
                  <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">Synthesizing Pixels...</p>
                </div>
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
              </motion.div>
            ) : generatedImage ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="techno-card aspect-square overflow-hidden relative">
                  <img src={generatedImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[20px] border-transparent border-t-white/5 border-l-white/5"></div>
                </div>
                <button
                  onClick={save}
                  disabled={isSaving}
                  className="w-full py-3 techno-card flex items-center justify-center gap-2 font-display text-sm tracking-widest hover:bg-[#00ff9d]/10 transition-colors"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                  SAVE TO ARCHIVE
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="techno-card aspect-square flex flex-col items-center justify-center border-dashed border-white/10"
              >
                <ImageIcon size={48} className="text-white/10 mb-2" />
                <p className="font-mono text-[10px] text-white/20 uppercase">Waiting for Input</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
            <div className="p-8 flex justify-between items-center bg-black/80 backdrop-blur-md">
              <button onClick={stopCamera} className="p-4 techno-card"><X size={24} /></button>
              <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-[#00ff9d] p-1">
                <div className="w-full h-full rounded-full bg-white"></div>
              </button>
              <div className="w-12"></div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Sidebar/Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-40 bg-black/90 backdrop-blur-xl p-4 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg text-[#00ff9d]">ARCHIVE</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 techno-card"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {history.length === 0 ? (
                <p className="text-center text-white/30 font-mono text-sm mt-20">No records found.</p>
              ) : (
                history.map((item) => (
                  <div key={item.seq} className="techno-card p-3 space-y-3">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img src={getDirectUrl(item.url)} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs text-white/80 line-clamp-2">{item.prompt}</p>
                        <p className="text-[10px] font-mono text-white/30">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                      <button onClick={() => deleteItem(item.seq)} className="text-red-400 p-1 hover:bg-red-400/10 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
