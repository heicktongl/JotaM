import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export const FloatingCart: React.FC = () => {
  const { totalItems } = useCart();
  const location = useLocation();

  // Don't show on admin routes, cart, checkout, or item detail
  const hiddenRoutes = ['/admin', '/cart', '/checkout', '/item'];
  const isHidden = hiddenRoutes.some(route => location.pathname.startsWith(route));

  if (isHidden || totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-28 right-6 z-50"
      >
        <Link 
          to="/cart"
          className="flex h-14 items-center gap-3 rounded-full bg-neutral-900 pl-4 pr-6 text-white shadow-2xl shadow-neutral-900/30 transition-transform hover:scale-105 active:scale-95"
        >
          <motion.div 
            key={totalItems}
            initial={{ scale: 1.4, rotate: 15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-orange-600"
          >
            <ShoppingBag size={16} />
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 15 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-orange-600 shadow-sm"
            >
              {totalItems}
            </motion.span>
          </motion.div>
          <span className="font-bold text-sm">Ver Carrinho</span>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};
