import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Sintonizando seu bairro...",
  "Trazendo as melhores vitrines...",
  "Conectando você à comunidade...",
  "Buscando novidades fresquinhas...",
  "Quase lá! Preparando seu feed..."
];

export const PremiumFeedLoader: React.FC = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="relative mb-8">
        {/* Animated Aura Rings - Persistent abstract background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-32 w-32 rounded-full bg-gradient-to-tr from-orange-400/20 to-amber-500/30 blur-3xl"
        />
      </div>

      {/* Dynamic Text with AnimatePresence */}
      <div className="h-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-sm font-bold text-neutral-500 tracking-wide uppercase"
          >
            {messages[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-0.5 mt-8 bg-gradient-to-r from-transparent via-orange-300 to-transparent rounded-full opacity-50"
      />
    </div>
  );
};
