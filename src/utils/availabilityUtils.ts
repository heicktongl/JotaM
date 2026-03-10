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

export function getAvailabilityStatus(availability: Availability[]): AvailabilityStatus {
  if (!availability || availability.length === 0) {
    return {
      isOpen: false,
      message: 'Horário não informado',
      colorClass: 'text-neutral-400 bg-neutral-100'
    };
  }

  const now = new Date();
  const jsDay = now.getDay(); 
  const dbDay = jsDay === 0 ? 6 : jsDay - 1;

  const currentDaySlot = availability.find(slot => slot.day_of_week === dbDay);

  // Helper para formatar dia da semana
  const dayNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  // 1. Verificar se está aberto agora
  if (currentDaySlot?.is_enabled && currentDaySlot.start_time && currentDaySlot.end_time) {
    const [startH, startM] = currentDaySlot.start_time.split(':').map(Number);
    const [endH, endM] = currentDaySlot.end_time.split(':').map(Number);

    const startTime = new Date(now);
    startTime.setHours(startH, startM, 0);

    const endTime = new Date(now);
    endTime.setHours(endH, endM, 0);

    if (now >= startTime && now <= endTime) {
      return {
        isOpen: true,
        message: 'Aberto agora',
        nextEvent: `Fecha às ${currentDaySlot.end_time.slice(0, 5)}`,
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-100'
      };
    }

    // 2. Se for antes de abrir hoje
    if (now < startTime) {
      return {
        isOpen: false,
        message: 'Fechado agora',
        nextEvent: `Abre hoje às ${currentDaySlot.start_time.slice(0, 5)}`,
        colorClass: 'text-amber-700 bg-amber-50 border-amber-100'
      };
    }
  }

  // 3. Se já fechou hoje ou está desabilitado, buscar o próximo dia que abre
  for (let i = 1; i <= 7; i++) {
    const nextDayDb = (dbDay + i) % 7;
    const nextSlot = availability.find(slot => slot.day_of_week === nextDayDb);

    if (nextSlot?.is_enabled && nextSlot.start_time) {
      let dayMsg = dayNames[nextDayDb];
      if (i === 1) dayMsg = 'amanhã';

      return {
        isOpen: false,
        message: 'Fechado agora',
        nextEvent: `Abre ${dayMsg} às ${nextSlot.start_time.slice(0, 5)}`,
        colorClass: 'text-red-600 bg-red-50 border-red-100'
      };
    }
  }

  return {
    isOpen: false,
    message: 'Fechado',
    nextEvent: 'Sem previsão de abertura',
    colorClass: 'text-neutral-400 bg-neutral-100'
  };
}
