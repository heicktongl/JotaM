import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Search, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-8 rounded-full bg-white px-8 py-4 text-neutral-900 shadow-2xl border border-neutral-100 backdrop-blur-lg">
        <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'}`}>
          <Package size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Feed</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/search' ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'}`}>
          <Search size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Busca</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/profile' ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'}`}>
          <User size={20} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Perfil</span>
        </Link>
      </div>
    </nav>
  );
};
