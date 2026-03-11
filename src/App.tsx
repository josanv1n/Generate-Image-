import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Generator from './components/Generator';

export default function App() {
  const [user, setUser] = useState<{ id: string; nama: string } | null>(null);

  // Load user from session storage
  useEffect(() => {
    const savedUser = sessionStorage.getItem('nano_banana_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (id: string, nama: string) => {
    const userData = { id, nama };
    setUser(userData);
    sessionStorage.setItem('nano_banana_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('nano_banana_user');
  };

  return (
    <div className="android-container flex flex-col">
      <div className="scanline"></div>
      
      <div className="flex-1">
        {!user ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <Generator userId={user.id} userName={user.nama} onLogout={handleLogout} />
        )}
      </div>

      <footer className="p-6 space-y-6 border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-white/40 font-mono text-[10px] tracking-widest">DONASI VIA</p>
          <div className="flex gap-6 items-center opacity-60 hover:opacity-100 transition-opacity">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg" alt="Shopee" className="h-4 grayscale invert" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg" alt="Gopay" className="h-4 grayscale invert" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_ovo.svg" alt="Ovo" className="h-4 grayscale invert" referrerPolicy="no-referrer" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg" alt="Dana" className="h-4 grayscale invert" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-white/30 font-mono text-[10px] tracking-tighter">
            Copyright©2026 - JOHAN - 081341300100
          </p>
          <div className="flex justify-center gap-1">
            {[...Array(20)].map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${i % 3 === 0 ? 'bg-[#00ff9d]' : 'bg-white/10'}`}></div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
