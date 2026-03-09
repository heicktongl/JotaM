import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, MapPin, Search, Check, Plus, X, Home, Globe, Save, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
}

export const DeliveryAreaSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCondoOnly, setIsCondoOnly] = useState(false);
  const [isWholeCity, setIsWholeCity] = useState(false);

  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<Neighborhood[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Neighborhood[]>([]);

  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [isInCondo, setIsInCondo] = useState(false);
  const [saving, setSaving] = useState(false);

  // 1. Verificar GPS Real
  useEffect(() => {
    const checkLocation = () => {
      if (!navigator.geolocation) {
        setIsCheckingLocation(false);
        setIsInCondo(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Aqui no mundo real cruzaríamos coords com o polígono do BD.
          // Para o MVP (após permitir GPS), assumimos true se ele permitiu ler o GPS.
          setIsInCondo(true);
          setIsCheckingLocation(false);
        },
        (error) => {
          console.error("GPS Error:", error);
          setIsInCondo(false);
          setIsCheckingLocation(false);
        },
        { timeout: 10000, maximumAge: 0 }
      );
    };
    checkLocation();
  }, []);

  // 2. Carregar bairros e áreas do banco
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // 2.1 Bairros disponíveis
      const { data: neighData } = await supabase
        .from('neighborhoods')
        .select('id, name, city')
        .eq('is_active', true)
        .order('name');

      if (neighData) setAvailableNeighborhoods(neighData);

      // 2.2 Perfil atual do vendedor/prestador (Busca o seller ativo)
      let profileType = '';
      let profileId = '';
      let bairrosAtd = [];

      // Tenta buscar como seller
      const { data: seller } = await supabase
        .from('sellers')
        .select('id, bairros_atendidos')
        .eq('user_id', user.id)
        .single();
      
      if (seller) {
        profileType = 'seller';
        profileId = seller.id;
        bairrosAtd = seller.bairros_atendidos || [];
      } else {
        // Tenta buscar como service_provider
        const { data: provider } = await supabase
          .from('service_providers')
          .select('id, bairros_atendidos')
          .eq('user_id', user.id)
          .single();
          
        if (provider) {
          profileType = 'provider';
          profileId = provider.id;
          bairrosAtd = provider.bairros_atendidos || [];
        }
      }

      if (!profileId) return;

      // Armazenamos info persistida
      (window as any).__sovix_profile_type = profileType;
      (window as any).__sovix_profile_id = profileId;

      // 2.3 Área de atuação salva (Herdada dos bairros_atendidos)
      if (bairrosAtd.length > 0 && neighData) {
        const preSelected = neighData.filter(n => bairrosAtd.includes(n.name));
        setSelectedNeighborhoods(preSelected);
      }
    };

    loadData();
  }, [user]);

  const filteredNeighborhoods = availableNeighborhoods.filter(n =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedNeighborhoods.find(sn => sn.id === n.id)
  );

  const handleCondoToggle = () => {
    setIsCondoOnly(!isCondoOnly);
    if (!isCondoOnly) setIsWholeCity(false);
  };

  const handleWholeCityToggle = () => {
    setIsWholeCity(!isWholeCity);
    if (!isWholeCity) setIsCondoOnly(false);
  };

  const toggleNeighborhood = (n: Neighborhood) => {
    const isSelected = selectedNeighborhoods.find(sn => sn.id === n.id);
    if (isSelected) {
      setSelectedNeighborhoods(ps => ps.filter(sn => sn.id !== n.id));
    } else {
      if (selectedNeighborhoods.length >= 3) {
        alert("Você pode adicionar no máximo 3 bairros para manter o padrão hiperlocal.");
        return;
      }
      setSelectedNeighborhoods(ps => [...ps, n]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const profileType = (window as any).__sovix_profile_type;
    const profileId = (window as any).__sovix_profile_id;
    
    if (!profileId || !profileType) {
        alert("Conta comercial não encontrada.");
        return;
    }

    setSaving(true);
    try {
      // Salva array das STRINGS (nomes dos bairros) no banco master do usuário
      const neighborhoodNames = selectedNeighborhoods.map(n => n.name);
      
      const tableName = profileType === 'seller' ? 'sellers' : 'service_providers';

      const { error } = await supabase
        .from(tableName as any)
        .update({ bairros_atendidos: neighborhoodNames })
        .eq('id', profileId);

      if (error) throw error;
      
      alert('Áreas de cobertura salvas com sucesso!');
      navigate('/admin/delivery');
    } catch (err) {
      console.error('Erro ao salvar área:', err);
      alert('Erro ao salvar dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {isCheckingLocation ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-sm flex flex-col justify-center items-center gap-3 h-full min-h-[180px]"
                >
                  <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-orange-500 animate-spin" />
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest text-center">Permita o acesso<br />ao GPS no navegador...</p>
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
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-6 rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col justify-center items-center text-center h-full min-h-[180px]"
                >
                  <Home className="text-neutral-300 mb-2" size={32} />
                  <span className="font-bold text-sm text-neutral-400">Condomínio Indisponível</span>
                  <span className="text-xs text-neutral-400 mt-1">É necessário permitir o GPS no navegador primeiro.</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Aviso de recomendação UX */}
            <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-100 flex items-start gap-3 col-span-1 md:col-span-2">
                <Globe className="text-orange-500 mt-0.5 shrink-0" size={20} />
                <p className="text-sm font-medium text-orange-900 leading-snug">
                  Adicione apenas bairros onde você realmente consegue entregar com facilidade ou possui filial. Limite de 3 bairros.
                </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setIsInCondo(!isInCondo)}
              className="text-[10px] font-bold text-neutral-300 hover:text-neutral-500 uppercase tracking-widest transition-colors cursor-pointer"
            >
              [Dev: Simular {isInCondo ? 'Fora' : 'Dentro'} de Condomínio]
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!isCondoOnly && (
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

                <div className="flex flex-wrap gap-2">
                  {selectedNeighborhoods.map(n => (
                    <motion.span
                      key={n.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                    >
                      {n.name}
                      <button onClick={() => toggleNeighborhood(n)} className="hover:bg-white/20 rounded-full p-0.5">
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}
                  {selectedNeighborhoods.length === 0 && (
                    <p className="text-sm text-neutral-400 italic">Nenhum bairro selecionado. Você não receberá pedidos de fora.</p>
                  )}
                </div>

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
                          key={n.id}
                          onClick={() => toggleNeighborhood(n)}
                          className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin size={18} className="text-neutral-300 group-hover:text-orange-500 transition-colors" />
                            <span className="font-bold text-neutral-700">{n.name}</span>
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

          <div className="pt-8 flex gap-4">
            <button
              disabled={saving}
              onClick={() => navigate(-1)}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white py-4 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Área
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
