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

      <span className={cn("text-2xl font-black tracking-tighter uppercase", colors[variant])}>
        Sovix
      </span>
    </div>
  );
};

