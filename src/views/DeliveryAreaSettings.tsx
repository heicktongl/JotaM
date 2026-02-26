import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MapPin, 
  Search, 
  Check, 
  Plus, 
  X, 
  Home, 
  Globe,
  Save
} from 'lucide-react';
import { Logo } from '../components/Logo';

// @DB_TODO: Fetch available neighborhoods from 'neighborhoods' or 'service_areas' table
const MOCK_NEIGHBORHOODS = [
  'Centro',
  'Vila Nova',
  'Jardim América',
  'Bela Vista',
  'Santa Cruz',
  'Parque das Nações',
  'Alto da Glória',
  'Setor Bueno',
  'Setor Oeste',
  'Setor Marista'
];

export const DeliveryAreaSettings: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCondoOnly, setIsCondoOnly] = useState(false);
  const [isWholeCity, setIsWholeCity] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(['Centro', 'Vila Nova']);
  
  // Location Simulation State
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [isInCondo, setIsInCondo] = useState(false);

  // Simulate location check on mount
  React.useEffect(() => {
    const checkLocation = async () => {
      // @DB_TODO: [MIGRAÇÃO OBRIGATÓRIA] Implementar verificação rigorosa de GPS (navigator.geolocation) cruzando com o polígono (geofence) do condomínio no Banco de Dados. A opção "Apenas meu Condomínio" SÓ PODE aparecer se a validação no backend retornar true.
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Randomly determine if in condo (or force true for demo purposes if needed)
      // For this demo, we'll default to TRUE to show the feature, but allow toggling via a hidden dev tool
      setIsInCondo(true); 
      setIsCheckingLocation(false);
    };
    
    checkLocation();
  }, []);

  const filteredNeighborhoods = MOCK_NEIGHBORHOODS.filter(n => 
    n.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedNeighborhoods.includes(n)
  );

  const handleCondoToggle = () => {
    setIsCondoOnly(!isCondoOnly);
    if (!isCondoOnly) setIsWholeCity(false);
  };

  const handleWholeCityToggle = () => {
    setIsWholeCity(!isWholeCity);
    if (!isWholeCity) setIsCondoOnly(false);
  };

  const toggleNeighborhood = (name: string) => {
    if (selectedNeighborhoods.includes(name)) {
      setSelectedNeighborhoods(selectedNeighborhoods.filter(n => n !== name));
    } else {
      setSelectedNeighborhoods([...selectedNeighborhoods, name]);
    }
  };

  const handleSave = () => {
    // @DB_TODO: Save area preferences (isCondoOnly, isWholeCity, selectedNeighborhoods) to 'delivery_areas' table
    alert('Área de atuação atualizada com sucesso!');
    navigate('/admin/delivery');
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
            <h1 className="text-xl font-bold text-neutral-900">Área de Atuação</h1>
          </div>
          <Logo variant="orange" className="scale-75 hidden sm:block" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Onde você quer entregar?</h2>
          <p className="text-neutral-500">Defina os bairros e locais onde você está disponível para realizar entregas.</p>
        </div>

        <div className="space-y-6">
          {/* Main Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Condominium Toggle - Only visible if in condo */}
            <AnimatePresence>
              {isCheckingLocation ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-sm flex flex-col justify-center items-center gap-3 h-full min-h-[180px]"
                >
                  <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-orange-500 animate-spin" />
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Verificando localização...</p>
                </motion.div>
              ) : isInCondo ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleCondoToggle}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[180px] ${isCondoOnly ? 'bg-orange-50 border-orange-500 shadow-lg shadow-orange-500/10' : 'bg-white border-neutral-100 shadow-sm hover:border-neutral-200'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${isCondoOnly ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                      <Home size={24} />
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isCondoOnly ? 'bg-orange-600 border-orange-600' : 'border-neutral-200'}`}>
                      {isCondoOnly && <Check size={14} className="text-white" />}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-lg text-neutral-900 block">Apenas meu Condomínio</span>
                    <span className="text-sm text-neutral-500">Entregas ultra-rápidas sem sair do complexo.</span>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Whole City Toggle */}
            <div 
              onClick={handleWholeCityToggle}
              className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between h-full min-h-[180px] ${isWholeCity ? 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-white border-neutral-100 shadow-sm hover:border-neutral-200'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${isWholeCity ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                  <Globe size={24} />
                </div>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${isWholeCity ? 'bg-blue-600 border-blue-600' : 'border-neutral-200'}`}>
                  {isWholeCity && <Check size={14} className="text-white" />}
                </div>
              </div>
              <div>
                <span className="font-bold text-lg text-neutral-900 block">Cidade Toda</span>
                <span className="text-sm text-neutral-500">Receba pedidos de qualquer lugar da cidade.</span>
              </div>
            </div>
          </div>

          {/* Dev Tool: Toggle Location Simulation */}
          <div className="flex justify-center">
            <button 
              onClick={() => setIsInCondo(!isInCondo)}
              className="text-[10px] font-bold text-neutral-300 hover:text-neutral-500 uppercase tracking-widest transition-colors"
            >
              [Dev: Simular {isInCondo ? 'Fora' : 'Dentro'} de Condomínio]
            </button>
          </div>

          {/* Neighborhood Selection */}
          <AnimatePresence mode="wait">
            {!isCondoOnly && !isWholeCity && (
              <motion.section 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Expansão por Bairros</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <Globe size={14} />
                    {selectedNeighborhoods.length} bairros selecionados
                  </div>
                </div>

                {/* Selected Neighborhoods Chips */}
                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map(n => (
                    <motion.span 
                      key={n}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                    >
                      {n}
                      <button onClick={() => toggleNeighborhood(n)} className="hover:bg-white/20 rounded-full p-0.5">
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                  {selectedNeighborhoods.length === 0 && (
                    <p className="text-sm text-neutral-400 italic">Nenhum bairro selecionado. Você não receberá pedidos de fora.</p>
                  )}
                </div>

                {/* Search and Add */}
                <div className="space-y-4">
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar bairros..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white pl-12 pr-5 py-4 text-neutral-900 focus:border-orange-500 focus:ring-0 transition-all shadow-sm"
                    />
                  </div>

                  <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                    <div className="max-h-60 overflow-y-auto divide-y divide-neutral-50">
                      {filteredNeighborhoods.map(n => (
                        <button 
                          key={n}
                          onClick={() => toggleNeighborhood(n)}
                          className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin size={18} className="text-neutral-300 group-hover:text-orange-500 transition-colors" />
                            <span className="font-bold text-neutral-700">{n}</span>
                          </div>
                          <div className="h-8 w-8 rounded-xl bg-neutral-100 text-neutral-400 flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-600 transition-all">
                            <Plus size={18} />
                          </div>
                        </button>
                      ))}
                      {filteredNeighborhoods.length === 0 && searchQuery && (
                        <div className="p-8 text-center">
                          <p className="text-sm text-neutral-400">Nenhum bairro encontrado para "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="pt-8 flex gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white py-4 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all"
            >
              <Save size={18} />
              Salvar Área
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
