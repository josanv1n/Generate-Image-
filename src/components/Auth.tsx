import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { gasService } from '../services/gasService';

interface AuthProps {
  onLogin: (userId: string, userName: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [nama, setNama] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !password) return;

    setIsLoading(true);
    try {
      const res = isLogin 
        ? await gasService.login(nama, password)
        : await gasService.register(nama, password);

      if (res.success && res.userId) {
        onLogin(res.userId, res.userName || nama);
      } else {
        alert(res.error || "Login Gagal: Nama atau Password salah");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 techno-card mb-4"
        >
          <div className="w-16 h-16 bg-[#00ff9d] rounded-full flex items-center justify-center shadow-[0_0_30px_#00ff9d]">
            <Lock className="text-black" size={32} />
          </div>
        </motion.div>
        <h1 className="font-display text-3xl glow-text text-[#00ff9d]">NANO BANANA</h1>
        <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em]">Neural Image Interface</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="techno-card p-1 flex items-center">
          <div className="p-3 text-[#00ff9d]"><User size={20} /></div>
          <input
            type="text"
            placeholder="USERNAME"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono placeholder:text-white/20"
          />
        </div>

        <div className="techno-card p-1 flex items-center">
          <div className="p-3 text-[#00ff9d]"><Lock size={20} /></div>
          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-mono placeholder:text-white/20"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-[#00ff9d] text-black font-display font-bold text-sm tracking-widest rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              {isLogin ? 'INITIATE LOGIN' : 'REGISTER NEURAL ID'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="text-white/40 font-mono text-[10px] uppercase tracking-widest hover:text-[#00ff9d] transition-colors"
      >
        {isLogin ? "Don't have an ID? Register here" : "Already registered? Login here"}
      </button>
    </div>
  );
}
