import React from 'react';
import { Clock } from 'lucide-react';
import { getAvailabilityStatus, Availability } from '../utils/availabilityUtils';

interface AvailabilityBadgeProps {
  availability: Availability[];
  className?: string;
  showIcon?: boolean;
}

/**
 * Componente padrão do sistema TTDD-T para exibir status de funcionamento.
 * Automatiza a lógica de "Aberto/Fechado" para qualquer tema.
 */
export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ 
  availability, 
  className = '',
  showIcon = true
}) => {
  const status = getAvailabilityStatus(availability);

  return (
    <div className={`flex items-center gap-3 p-4 rounded-3xl border transition-all ${status.colorClass} ${className}`}>
      {showIcon && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-current opacity-80 bg-white/50`}>
          <Clock size={18} />
        </div>
      )}
      <div>
        <h4 className="font-bold text-sm leading-tight">{status.message}</h4>
        {status.nextEvent && (
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-tight mt-0.5">
            {status.nextEvent}
          </p>
        )}
      </div>
    </div>
  );
};
