import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronLeft,
    Store,
    AtSign,
    Loader2,
    AlertCircle,
    MapPin,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    Navigation,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface StoreLocation {
    label: string;
    zip_code: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    is_primary: boolean;
    latitude: number | null;
    longitude: number | null;
    // Estado local do campo
    cepLoading: boolean;
    cepError: string;
    cepSuccess: boolean;
    neighborhoodStatus: 'idle' | 'checking' | 'available' | 'taken';
    neighborhoodEditable: boolean;  // true quando GPS impreciso (usuário deve confirmar)
    gpsAccuracy: number | null;     // metros de margem do GPS
}

const createEmptyLocation = (isPrimary: boolean, index: number): StoreLocation => ({
    label: isPrimary ? 'Principal' : `Ponto ${index + 1}`,
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    is_primary: isPrimary,
    latitude: null,
    longitude: null,
    cepLoading: false,
    cepError: '',
    cepSuccess: false,
    neighborhoodStatus: 'idle',
    neighborhoodEditable: false,
    gpsAccuracy: null,
});

const MAX_LOCATIONS = 5;

export const SellerSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [storeName, setStoreName] = useState('');
    const [username, setUsername] = useState('');
    const [locations, setLocations] = useState<StoreLocation[]>([createEmptyLocation(true, 0)]);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState('');

    // Verifica se o usuário já é vendedor
    useEffect(() => {
        if (authLoading) return;

        const checkExistingSeller = async () => {
            if (!user) {
                navigate(-1);
                return;
            }

            const { data } = await supabase
                .from('sellers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                navigate('/admin/products');
            } else {
                setIsChecking(false);
            }
        };

        checkExistingSeller();
    }, [user, authLoading, navigate]);

    // Atualiza um campo de uma localização específica
    const updateLocation = (index: number, updates: Partial<StoreLocation>) => {
        setLocations(prev => prev.map((loc, i) => (i === index ? { ...loc, ...updates } : loc)));
    };

    // Busca endereço via ViaCEP
    const fetchCep = async (index: number, rawCep: string) => {
        const cep = rawCep.replace(/\D/g, '');
        updateLocation(index, { zip_code: rawCep });

        if (cep.length < 8) {
            updateLocation(index, {
                street: '',
                neighborhood: '',
                city: '',
                state: '',
                cepSuccess: false,
                cepError: '',
                neighborhoodStatus: 'idle',
            });
            return;
        }

        if (cep.length === 8) {
            updateLocation(index, { cepLoading: true, cepError: '', cepSuccess: false });

            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();

                if (data.erro) {
                    updateLocation(index, {
                        cepLoading: false,
                        cepError: 'CEP não encontrado.',
                        street: '',
                        neighborhood: '',
                        city: '',
                        state: '',
                        cepSuccess: false,
                        neighborhoodStatus: 'idle',
                    });
                    return;
                }

                const neighborhood = data.bairro || '';
                const city = data.localidade || '';

                updateLocation(index, {
                    street: data.logradouro || '',
                    neighborhood,
                    city,
                    state: data.uf || '',
                    cepLoading: false,
                    cepSuccess: true,
                    cepError: '',
                });

                // Verifica se o bairro já está em uso por ESTA loja (em outros pontos)
                if (neighborhood) {
                    checkNeighborhoodLocal(index, neighborhood, city);
                }
            } catch {
                updateLocation(index, {
                    cepLoading: false,
                    cepError: 'Erro ao buscar CEP. Verifique sua conexão.',
                    cepSuccess: false,
                });
            }
        }
    };

    // Geolocalização: sempre prossegue independente de precisão
    // Se precisão > 1000m (IP-based, ex: laptop sem GPS), bairro fica editável para o usuário confirmar
    const useCurrentLocation = async (index: number) => {
        if (!navigator.geolocation) {
            updateLocation(index, { cepError: 'Seu navegador não suporta geolocalização.' });
            return;
        }

        updateLocation(index, { cepLoading: true, cepError: '', cepSuccess: false, neighborhoodEditable: false });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                // Em PCs de mesa (cabo de rede), a precisão é via provedor de IP e costuma ter erro > 5km.
                // Se a margem for maior que 1000 metros, não tentamos adivinhar pra não errar feio.
                if (accuracy > 1000) {
                    updateLocation(index, {
                        cepLoading: false,
                        cepError: 'Localização do Computador é muito imprecisa. Por favor, digite seu CEP manualmente para garantir o bairro correto.',
                        cepSuccess: false,
                    });
                    return;
                }

                try {
                    // zoom=18 = nível de rua (máxima granularidade do Nominatim)
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`,
                        { headers: { 'User-Agent': 'JotaM-App/1.0' } }
                    );
                    const data = await response.json();
                    const addr = data.address || {};

                    // Prioridade de campos de bairro do Nominatim (do mais preciso ao menos)
                    let neighborhood =
                        addr.quarter ||
                        addr.suburb ||
                        addr.neighbourhood ||
                        addr.city_district ||
                        '';

                    let city =
                        addr.city ||
                        addr.town ||
                        addr.municipality ||
                        addr.county ||
                        '';

                    let state =
                        addr.state_code?.toUpperCase() ||
                        addr.state?.slice(0, 2)?.toUpperCase() ||
                        '';

                    let street = addr.road || addr.pedestrian || addr.path || '';
                    const zipCode = (addr.postcode || '').replace(/\D/g, '');

                    // ENRIQUECIMENTO DE PRECISÃO COM VIACEP
                    // Se o GPS encontrou um CEP válido, checamos na base oficial dos correios
                    // Isso corrige distorções de nome de bairro que existem no OpenStreetMap
                    if (zipCode.length === 8) {
                        try {
                            const viaCepRes = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
                            const viaCepData = await viaCepRes.json();
                            if (!viaCepData.erro) {
                                neighborhood = viaCepData.bairro || neighborhood;
                                city = viaCepData.localidade || city;
                                state = viaCepData.uf || state;
                                street = viaCepData.logradouro || street;
                            }
                        } catch {
                            // Se falhar o ViaCEP, usamos silenciosamente os dados do Nominatim como fallback
                        }
                    }

                    if (!city) {
                        updateLocation(index, {
                            cepLoading: false,
                            cepError: 'Cidade não identificada. Por favor, informe o CEP manualmente.',
                            cepSuccess: false,
                        });
                        return;
                    }

                    updateLocation(index, {
                        zip_code: zipCode,
                        street,
                        neighborhood,    // agora validado pelo ViaCEP
                        city,
                        state,
                        latitude,
                        longitude,
                        gpsAccuracy: Math.round(accuracy),
                        neighborhoodEditable: false,  // Sempre false porque barramos a baixa precisão antes
                        cepLoading: false,
                        cepSuccess: true,
                        cepError: '',
                    });

                    if (neighborhood) {
                        checkNeighborhoodLocal(index, neighborhood, city);
                    }
                } catch {
                    updateLocation(index, {
                        cepLoading: false,
                        cepError: 'Erro ao identificar endereço. Verifique sua conexão ou use o CEP.',
                        cepSuccess: false,
                    });
                }
            },
            (err) => {
                let msg = 'Não foi possível acessar sua localização.';
                if (err.code === err.PERMISSION_DENIED)
                    msg = 'Permissão de GPS negada. Ative nas configurações do navegador ou informe o CEP.';
                if (err.code === err.TIMEOUT)
                    msg = 'GPS demorou muito. Verifique o sinal e tente novamente.';
                updateLocation(index, { cepLoading: false, cepError: msg, cepSuccess: false });
            },
            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 0,
            }
        );
    };

    // Verifica duplicidade de bairro apenas dentro dos pontos locais
    const checkNeighborhoodLocal = (currentIndex: number, neighborhood: string, city: string) => {
        const normalizedNeighborhood = neighborhood.toLowerCase().trim();
        const normalizedCity = city.toLowerCase().trim();

        const isDuplicate = locations.some(
            (loc, i) =>
                i !== currentIndex &&
                loc.neighborhood.toLowerCase().trim() === normalizedNeighborhood &&
                loc.city.toLowerCase().trim() === normalizedCity
        );

        if (isDuplicate) {
            updateLocation(currentIndex, { neighborhoodStatus: 'taken' });
        } else {
            updateLocation(currentIndex, { neighborhoodStatus: 'available' });
        }
    };

    // Adiciona novo ponto de venda
    const addLocation = () => {
        if (locations.length >= MAX_LOCATIONS) return;
        setLocations(prev => [...prev, createEmptyLocation(false, prev.length)]);
    };

    // Remove ponto de venda
    const removeLocation = (index: number) => {
        if (locations.length <= 1) return;
        setLocations(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // Garante que sempre tenha um primário
            if (!updated.some(loc => loc.is_primary) && updated.length > 0) {
                updated[0].is_primary = true;
                updated[0].label = 'Principal';
            }
            return updated;
        });
    };

    // Valida se todos os pontos estão preenchidos
    const allLocationsValid = locations.every(
        loc =>
            loc.zip_code.replace(/\D/g, '').length === 8 &&
            loc.street &&
            loc.neighborhood &&
            loc.city &&
            loc.cepSuccess &&
            loc.neighborhoodStatus !== 'taken'
    );

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError('');

        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

        if (cleanUsername.length < 3) {
            setError('O nome de usuário deve ter pelo menos 3 caracteres.');
            setIsLoading(false);
            return;
        }

        if (!allLocationsValid) {
            setError('Preencha corretamente todos os pontos de venda.');
            setIsLoading(false);
            return;
        }

        try {
            // 1. Cria a loja
            const { data: sellerData, error: insertError } = await supabase
                .from('sellers')
                .insert({
                    user_id: user.id,
                    store_name: storeName.trim(),
                    username: cleanUsername,
                })
                .select('id')
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('Esse nome de usuário já está em uso por outra loja.');
                } else {
                    setError(insertError.message);
                }
                setIsLoading(false);
                return;
            }

            // 2. Insere as localizações
            const locationInserts = locations.map(loc => ({
                seller_id: sellerData.id,
                label: loc.label.trim() || 'Principal',
                zip_code: loc.zip_code.replace(/\D/g, ''),
                street: loc.street,
                number: loc.number || null,
                complement: loc.complement || null,
                neighborhood: loc.neighborhood,
                city: loc.city,
                state: loc.state,
                latitude: loc.latitude ?? null,    // GPS real (null se veio só pelo CEP)
                longitude: loc.longitude ?? null,  // GPS real (null se veio só pelo CEP)
                is_primary: loc.is_primary,
            }));

            const { error: locError } = await supabase.from('store_locations').insert(locationInserts);

            if (locError) {
                if (locError.code === '23505') {
                    setError('Você já tem um ponto de venda nesse bairro. Escolha bairros diferentes.');
                } else {
                    setError('Erro ao salvar localizações: ' + locError.message);
                }
                // Desfaz a criação da loja se localizações falharem
                await supabase.from('sellers').delete().eq('id', sellerData.id);
                setIsLoading(false);
                return;
            }

            // Tudo certo!
            navigate('/profile');
        } catch {
            setError('Ocorreu um erro ao criar a loja.');
            setIsLoading(false);
        }
    };

    // Formata CEP (00000-000)
    const formatCep = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        if (digits.length > 5) {
            return `${digits.slice(0, 5)}-${digits.slice(5)}`;
        }
        return digits;
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col p-6 pb-12">
            <header className="pt-6 pb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 mb-6"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-3 text-orange-600 mb-2">
                    <div className="p-2 bg-orange-100 rounded-xl">
                        <Store size={24} />
                    </div>
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
                    Crie sua Loja Virtual
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                    Comece a vender para a sua vizinhança agora mesmo.
                </p>
            </header>

            <main className="flex-1">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100 mb-6"
                    >
                        <AlertCircle size={18} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleCreateStore} className="space-y-6">
                    {/* Nome da Loja */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-900 mb-2">Nome da Loja</label>
                        <input
                            type="text"
                            required
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="Ex: Doceria da Mari"
                            className="w-full rounded-2xl bg-white border border-neutral-200 p-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* Link da Loja */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-900 mb-2">Link da Loja (@username)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-400">
                                <AtSign size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="doceria.mari"
                                className="w-full rounded-2xl bg-white border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm lowercase"
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 ml-1">
                            Seu link será: <span className="font-bold text-neutral-700">jotam.com.br/@{username || 'seu_link'}</span>
                        </p>
                    </div>

                    {/* Separador */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-neutral-50 px-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                Pontos de Venda
                            </span>
                        </div>
                    </div>

                    {/* Descrição da seção */}
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-blue-900">Onde fica sua loja?</p>
                            <p className="text-xs text-blue-600 mt-1">
                                Informe o CEP de cada ponto de venda. Você pode ter até {MAX_LOCATIONS} pontos em bairros diferentes.
                                É necessário pelo menos 1 ponto de venda.
                            </p>
                        </div>
                    </div>

                    {/* Lista de Localizações */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {locations.map((loc, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm space-y-4"
                                >
                                    {/* Header do ponto */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${loc.is_primary ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                                <MapPin size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={loc.label}
                                                onChange={(e) => updateLocation(index, { label: e.target.value })}
                                                className="text-sm font-bold text-neutral-900 bg-transparent border-none focus:outline-none w-32"
                                                placeholder="Nome do ponto"
                                            />
                                            {loc.is_primary && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                                                    Principal
                                                </span>
                                            )}
                                        </div>
                                        {locations.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLocation(index)}
                                                className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {/* CEP */}
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 mb-1.5">CEP</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={formatCep(loc.zip_code)}
                                                onChange={(e) => fetchCep(index, e.target.value)}
                                                placeholder="00000-000"
                                                maxLength={9}
                                                className={`w-full rounded-xl bg-neutral-50 border p-3 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all ${loc.cepError
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                                    : loc.cepSuccess
                                                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                                        : 'border-neutral-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                                                    }`}
                                            />
                                            {loc.cepLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Loader2 size={16} className="animate-spin text-orange-500" />
                                                </div>
                                            )}
                                            {loc.cepSuccess && !loc.cepLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                </div>
                                            )}
                                            {loc.cepError && !loc.cepLoading && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <XCircle size={16} className="text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                        {loc.cepError && (
                                            <p className="text-xs text-red-500 font-bold mt-1">{loc.cepError}</p>
                                        )}

                                        {/* Botão Usar Localização Atual */}
                                        {!loc.cepSuccess && (
                                            <button
                                                type="button"
                                                onClick={() => useCurrentLocation(index)}
                                                disabled={loc.cepLoading}
                                                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loc.cepLoading ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Navigation size={14} />
                                                )}
                                                Usar minha localização atual
                                            </button>
                                        )}
                                    </div>

                                    {/* Campos preenchidos automaticamente */}
                                    {loc.cepSuccess && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-3"
                                        >
                                            {/* Rua (readonly) */}
                                            <div>
                                                <label className="block text-xs font-bold text-neutral-500 mb-1.5">Rua / Logradouro</label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={loc.street}
                                                    className="w-full rounded-xl bg-neutral-100 border border-neutral-200 p-3 text-sm text-neutral-700 cursor-not-allowed"
                                                />
                                            </div>

                                            {/* Número + Complemento */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-500 mb-1.5">Número</label>
                                                    <input
                                                        type="text"
                                                        value={loc.number}
                                                        onChange={(e) => updateLocation(index, { number: e.target.value })}
                                                        placeholder="123"
                                                        className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-500 mb-1.5">Complemento</label>
                                                    <input
                                                        type="text"
                                                        value={loc.complement}
                                                        onChange={(e) => updateLocation(index, { complement: e.target.value })}
                                                        placeholder="Sala 2"
                                                        className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-3 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Bairro (editável se GPS impreciso) */}
                                            <div>
                                                <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                                                    Bairro
                                                    {loc.neighborhoodEditable && (
                                                        <span className="ml-2 text-amber-600 normal-case font-bold">
                                                            — confirme ou corrija
                                                        </span>
                                                    )}
                                                </label>
                                                {/* Aviso de precisão baixa */}
                                                {loc.neighborhoodEditable && (
                                                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-2">
                                                        <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                                        <p className="text-xs text-amber-700 font-medium">
                                                            Localização aproximada por IP (sem GPS). Verifique e corrija o bairro se necessário.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        readOnly={!loc.neighborhoodEditable}
                                                        value={loc.neighborhood}
                                                        onChange={(e) => {
                                                            updateLocation(index, { neighborhood: e.target.value });
                                                            if (e.target.value && loc.city) {
                                                                checkNeighborhoodLocal(index, e.target.value, loc.city);
                                                            }
                                                        }}
                                                        placeholder={loc.neighborhoodEditable ? 'Digite o nome do seu bairro' : ''}
                                                        className={`w-full rounded-xl border p-3 text-sm font-bold transition-all ${loc.neighborhoodEditable
                                                            ? 'bg-amber-50 border-amber-300 text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                                                            : loc.neighborhoodStatus === 'taken'
                                                                ? 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'
                                                                : loc.neighborhoodStatus === 'available'
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed'
                                                                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 cursor-not-allowed'
                                                            }`}
                                                    />
                                                    {loc.neighborhoodStatus === 'available' && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                        </div>
                                                    )}
                                                    {loc.neighborhoodStatus === 'taken' && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <XCircle size={16} className="text-red-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                {loc.neighborhoodStatus === 'taken' && (
                                                    <p className="text-xs text-red-500 font-bold mt-1">
                                                        Você já tem um ponto nesse bairro. Escolha um bairro diferente.
                                                    </p>
                                                )}
                                                {loc.neighborhoodStatus === 'available' && (
                                                    <p className="text-xs text-emerald-600 font-bold mt-1">
                                                        ✓ Bairro disponível
                                                    </p>
                                                )}
                                            </div>

                                            {/* Cidade + Estado (readonly) */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-neutral-500 mb-1.5">Cidade</label>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={loc.city}
                                                        className="w-full rounded-xl bg-neutral-100 border border-neutral-200 p-3 text-sm text-neutral-700 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-500 mb-1.5">UF</label>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={loc.state}
                                                        className="w-full rounded-xl bg-neutral-100 border border-neutral-200 p-3 text-sm text-neutral-700 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Botão adicionar ponto */}
                    {locations.length < MAX_LOCATIONS && (
                        <button
                            type="button"
                            onClick={addLocation}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-4 text-sm font-bold text-neutral-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                        >
                            <Plus size={18} />
                            Adicionar Ponto de Venda ({locations.length}/{MAX_LOCATIONS})
                        </button>
                    )}

                    {/* Botão criar */}
                    <button
                        type="submit"
                        disabled={isLoading || !storeName || !username || !allLocationsValid}
                        className="w-full flex h-14 items-center justify-center rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Abrir minha Loja'}
                    </button>
                </form>
            </main>
        </div>
    );
};
