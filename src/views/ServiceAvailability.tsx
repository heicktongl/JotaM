import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Clock, Calendar, Save, Trash2, Plus, X, Copy, Zap } from 'lucide-react';
import { Logo } from '../components/Logo';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  enabled: boolean;
  slots: TimeSlot[];
}

const DAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

export const ServiceAvailability: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Jardinagem',
    homeService: true,
  });

  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS.map(day => ({
      day,
      enabled: day !== 'Sábado' && day !== 'Domingo',
      slots: [{ id: Math.random().toString(), start: '09:00', end: '18:00' }]
    }))
  );

  const categories = ['Jardinagem', 'Limpeza', 'Manutenção', 'Consultoria', 'Outros'];

  const addMockImage = () => {
    if (images.length < 5) {
      const newImage = `https://picsum.photos/seed/${Math.random()}/800/600`;
      setImages([...images, newImage]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleDay = (index: number) => {
    const newAvailability = [...availability];
    newAvailability[index].enabled = !newAvailability[index].enabled;
    setAvailability(newAvailability);
  };

  const addSlot = (dayIndex: number) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots.push({
      id: Math.random().toString(),
      start: '09:00',
      end: '18:00'
    });
    setAvailability(newAvailability);
  };

  const removeSlot = (dayIndex: number, slotId: string) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots = newAvailability[dayIndex].slots.filter(s => s.id !== slotId);
    setAvailability(newAvailability);
  };

  const updateSlot = (dayIndex: number, slotId: string, field: 'start' | 'end', value: string) => {
    const newAvailability = [...availability];
    const slot = newAvailability[dayIndex].slots.find(s => s.id === slotId);
    if (slot) {
      slot[field] = value;
    }
    setAvailability(newAvailability);
  };

  const copyToAll = (dayIndex: number) => {
    const sourceSlots = availability[dayIndex].slots.map(s => ({ ...s, id: Math.random().toString() }));
    const newAvailability = availability.map((day, idx) => {
      if (idx === dayIndex) return day;
      return { ...day, enabled: true, slots: [...sourceSlots.map(s => ({ ...s, id: Math.random().toString() }))] };
    });
    setAvailability(newAvailability);
    alert(`Horários de ${availability[dayIndex].day} copiados para todos os dias!`);
  };

  const applyPreset = (dayIndex: number, start: string, end: string) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots = [{ id: Math.random().toString(), start, end }];
    newAvailability[dayIndex].enabled = true;
    setAvailability(newAvailability);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      alert('Por favor, adicione pelo menos uma foto do seu serviço.');
      return;
    }
    // @DB_TODO: Save service details (formData, images) and availability schedule to 'services' and 'service_availability' tables
    alert('Serviço configurado com sucesso!');
    navigate('/admin/services');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl pt-6 pb-4 px-6 shadow-sm border-b border-neutral-100">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-neutral-900">Configurar Serviço</h1>
          </div>
          <Logo variant="orange" className="scale-75 hidden sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8">
        <form onSubmit={handleSave} className="space-y-10">
          {/* Photos Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Fotos do Serviço ({images.length}/5)</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {images.map((img, index) => (
                  <motion.div 
                    key={img}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-200 border border-neutral-100 group"
                  >
                    <img src={img} className="h-full w-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-orange-600/90 py-1 text-center">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Principal</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {images.length < 5 && (
                <button 
                  type="button"
                  onClick={addMockImage}
                  className="aspect-square rounded-3xl border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-orange-500 hover:text-orange-500 transition-all"
                >
                  <Plus size={24} />
                  <span className="text-xs font-bold">Adicionar Foto</span>
                </button>
              )}
            </div>
          </section>

          {/* Basic Info */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Informações do Serviço</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Nome do Serviço</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Consultoria de Jardinagem"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Descrição</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Descreva o que está incluso no seu serviço..."
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Preço Base (R$)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-700 mb-2">Categoria</label>
                  <select 
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block">Atendimento a Domicílio</span>
                    <span className="text-xs text-neutral-500">Você vai até o local do cliente</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, homeService: !formData.homeService})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.homeService ? 'bg-orange-600' : 'bg-neutral-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.homeService ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Availability Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Horários de Atendimento</h3>
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">Dica: Use os atalhos para agilizar</span>
            </div>
            
            <div className="space-y-4">
              {availability.map((dayData, dayIndex) => (
                <div 
                  key={dayData.day} 
                  className={`rounded-3xl border transition-all ${dayData.enabled ? 'bg-white border-neutral-100 shadow-md' : 'bg-neutral-100/50 border-transparent opacity-60'}`}
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => toggleDay(dayIndex)}
                          className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${dayData.enabled ? 'bg-orange-600 text-white' : 'bg-neutral-200 text-neutral-400'}`}
                        >
                          <Calendar size={20} />
                        </button>
                        <div>
                          <span className={`font-bold block ${dayData.enabled ? 'text-neutral-900' : 'text-neutral-400'}`}>{dayData.day}</span>
                          {dayData.enabled && (
                            <button 
                              type="button"
                              onClick={() => copyToAll(dayIndex)}
                              className="text-[10px] font-bold text-orange-600 flex items-center gap-1 hover:underline"
                            >
                              <Copy size={10} />
                              Copiar para todos
                            </button>
                          )}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => toggleDay(dayIndex)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${dayData.enabled ? 'bg-orange-600' : 'bg-neutral-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dayData.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {dayData.enabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        {/* Presets */}
                        <div className="flex flex-wrap gap-2">
                          <button 
                            type="button"
                            onClick={() => applyPreset(dayIndex, '08:00', '18:00')}
                            className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-1"
                          >
                            <Zap size={10} />
                            Comercial (08-18h)
                          </button>
                          <button 
                            type="button"
                            onClick={() => applyPreset(dayIndex, '09:00', '12:00')}
                            className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-1"
                          >
                            <Zap size={10} />
                            Manhã (09-12h)
                          </button>
                          <button 
                            type="button"
                            onClick={() => applyPreset(dayIndex, '13:00', '18:00')}
                            className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-orange-50 hover:text-orange-600 transition-colors flex items-center gap-1"
                          >
                            <Zap size={10} />
                            Tarde (13-18h)
                          </button>
                        </div>

                        <div className="space-y-3">
                          {dayData.slots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-3">
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                  <input 
                                    type="time" 
                                    value={slot.start}
                                    onChange={(e) => updateSlot(dayIndex, slot.id, 'start', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-3 text-sm font-bold focus:border-orange-500 focus:ring-0 transition-all"
                                  />
                                </div>
                                <div className="relative">
                                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                  <input 
                                    type="time" 
                                    value={slot.end}
                                    onChange={(e) => updateSlot(dayIndex, slot.id, 'end', e.target.value)}
                                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-3 text-sm font-bold focus:border-orange-500 focus:ring-0 transition-all"
                                  />
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeSlot(dayIndex, slot.id)}
                                className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button 
                          type="button"
                          onClick={() => addSlot(dayIndex)}
                          className="flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors mt-2 bg-orange-50/50 px-4 py-2 rounded-xl border border-dashed border-orange-200 w-full justify-center"
                        >
                          <Plus size={14} />
                          Adicionar outro intervalo
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white py-4 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all"
            >
              <Save size={18} />
              Salvar Serviço
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};