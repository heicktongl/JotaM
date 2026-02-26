import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light' | 'orange';
}

export const Logo: React.FC<LogoProps> = ({ className, variant = 'orange' }) => {
  const colors = {
    dark: 'text-neutral-900',
    light: 'text-white',
    orange: 'text-orange-600'
  };

  return (
    <div className={cn("flex items-center gap-2 font-display", className)}>
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl shadow-lg -rotate-3 transition-transform hover:rotate-0",
        variant === 'light' ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'
      )}>
        <span className="text-2xl font-black tracking-tighter">J</span>
      </div>
      <span className={cn("text-2xl font-black tracking-tighter uppercase", colors[variant])}>
        jotaM
      </span>
    </div>
  );
};

