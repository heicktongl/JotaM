import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';

interface PremiumLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  message = "Conectando ao seu bairro...", 
  fullScreen = false 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center p-8 ${
        fullScreen ? 'fixed inset-0 z-[100] bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl' : 'w-full py-20'
      }`}
    >
      <div className="relative">
        {/* Animated Aura */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -m-8 bg-gradient-to-tr from-orange-500/30 via-amber-500/20 to-transparent blur-3xl rounded-full"
        />
        
        {/* Pulsing Logo */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10"
        >
          <Logo variant="orange" size="large" />
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center"
      >
        <span className="font-display text-lg font-extrabold tracking-tighter text-neutral-900 dark:text-neutral-50 block">
          {message}
        </span>
        <div className="mt-4 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="h-1.5 w-1.5 rounded-full bg-orange-500"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
