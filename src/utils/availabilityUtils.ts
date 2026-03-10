export interface Availability {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_enabled: boolean | null;
}

export interface AvailabilityStatus {
  isOpen: boolean;
  message: string;
  nextEvent?: string;
  colorClass: string;
}

/**
 * Calcula o status de disponibilidade com base no horário local
 */
export function getAvailabilityStatus(availability: Availability[]): AvailabilityStatus {
  if (!availability || availability.length === 0) {
    return {
      isOpen: false,
      message: 'Horário não informado',
      colorClass: 'text-neutral-400 bg-neutral-100'
    };
  }

  const now = new Date();
  // Get Day of week (0-6). Adjusting if necessary. 
  // In our DB: 0 (Segunda) a 6 (Domingo). 
  // JS getDay(): 0 (Dom) a 6 (Sab).
  const jsDay = now.getDay(); 
  const dbDay = jsDay === 0 ? 6 : jsDay - 1;

  const currentDaySlot = availability.find(slot => slot.day_of_week === dbDay);

  if (!currentDaySlot || !currentDaySlot.is_enabled || !currentDaySlot.start_time || !currentDaySlot.end_time) {
    return {
      isOpen: false,
      message: 'Fechado hoje',
      colorClass: 'text-red-600 bg-red-50 border-red-100'
    };
  }

  const [startH, startM] = currentDaySlot.start_time.split(':').map(Number);
  const [endH, endM] = currentDaySlot.end_time.split(':').map(Number);

  const startTime = new Date(now);
  startTime.setHours(startH, startM, 0);

  const endTime = new Date(now);
  endTime.setHours(endH, endM, 0);

  const isOpen = now >= startTime && now <= endTime;

  if (isOpen) {
    return {
      isOpen: true,
      message: 'Aberto agora',
      nextEvent: `Fecha às ${currentDaySlot.end_time.slice(0, 5)}`,
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-100'
    };
  } else {
    // Verifica se ainda vai abrir hoje ou se já fechou
    if (now < startTime) {
      return {
        isOpen: false,
        message: 'Abre em breve',
        nextEvent: `Abre às ${currentDaySlot.start_time.slice(0, 5)}`,
        colorClass: 'text-amber-700 bg-amber-50 border-amber-100'
      };
    } else {
      return {
        isOpen: false,
        message: 'Fechado agora',
        nextEvent: 'Abre no próximo dia útil',
        colorClass: 'text-red-600 bg-red-50 border-red-100'
      };
    }
  }
}
