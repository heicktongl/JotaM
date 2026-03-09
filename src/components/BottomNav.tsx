import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // SIS-NAVIGATION-SMOOTH: Garante que a barra esteja visível ao trocar de página
  // sem disparar as animações de AnimatePresence que causam flicker.
  useEffect(() => {
    setIsVisible(true);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Threshold de 30px para evitar flicker
      if (Math.abs(currentScrollY - lastScrollY) < 30) return;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Rolando para baixo - Esconde
        setIsVisible(false);
      } else {
        // Rolando para cima ou topo - Mostra
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  return (
    <motion.nav 
      initial={false}
      animate={{ 
        y: isVisible ? 0 : 120, // Move para fora da tela em vez de desmontar
        x: '-50%', 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed bottom-6 left-1/2 z-50 pointer-events-auto"
    >
      <div className="flex items-center gap-10 rounded-full bg-white px-10 py-4 text-neutral-900 shadow-2xl border border-neutral-100 backdrop-blur-lg">
        {[
          { to: '/', icon: Package, label: 'Feed' },
          { to: '/search', icon: Search, label: 'Busca' },
          { to: '/profile', icon: User, label: 'Perfil' },
        ].map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className="relative"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <Icon size={22} className={isActive ? 'fill-orange-600/10' : ''} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
