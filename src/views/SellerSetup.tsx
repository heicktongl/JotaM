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
    Camera,
    Palette,
    Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AvatarUploader } from '../components/AvatarUploader';
import { PortfolioUploader } from '../components/PortfolioUploader';
import { getDetailedLocation } from '../utils/geolocation';
import { SISBairro, extractBairroName, fetchNeighborhoodsByCity } from '../utils/sis-loca';

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

const MAX_LOCATIONS = 1;

export const SellerSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [storeName, setStoreName] = useState('');
    const [username, setUsername] = useState('');
    const [locations, setLocations] = useState<StoreLocation[]>([createEmptyLocation(true, 0)]);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState('');
    const [existingSellerId, setExistingSellerId] = useState<string | null>(null);
    const [themeId, setThemeId] = useState<string>('sovix_default');

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    const [bairrosAtendidos, setBairrosAtendidos] = useState<string[]>([]);
    const [newBairroForm, setNewBairroForm] = useState<SISBairro>({ bairro: '', rua: '', numero: '', complemento: '' });
    const [bairroSuggestions, setBairroSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
    const MAX_BAIRROS = 3;

    // Buscar Sugestões de Bairro (Sis-Loca)
    useEffect(() => {
        const primaryCity = locations.find(l => l.is_primary)?.city;
        if (primaryCity) {
            fetchNeighborhoodsByCity(supabase, primaryCity).then(sugs => setBairroSuggestions(sugs));
        }
    }, [locations]);

    // Horários de atendimento (grade semanal)
    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const [availability, setAvailability] = useState(
        DAYS.map((day, i) => ({
            day,
            dayIndex: i,
            enabled: i < 5, // Seg-Sex habilitado por padrão
            start: '09:00',
            end: '18:00',
        }))
    );

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
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setExistingSellerId(data.id);
                setStoreName(data.store_name || '');
                setUsername(data.username || '');
                setAvatarUrl(data.avatar_url || null);
                setCoverUrl(data.cover_url || null);
                if (data.theme_id) setThemeId(data.theme_id);
                if (data.bairros_atendidos) setBairrosAtendidos(data.bairros_atendidos);
                // Busca localizações se existir
                const { data: locs } = await supabase
                    .from('store_locations')
                    .select('*')
                    .eq('seller_id', data.id)
                    .order('is_primary', { ascending: false });

                if (locs && locs.length > 0) {
                    setLocations(locs.map(l => ({
                        label: l.label,
                        zip_code: l.zip_code,
                        street: l.street || '',
                        number: l.number || '',
                        complement: l.complement || '',
                        neighborhood: l.neighborhood || '',
                        city: l.city || '',
                        state: l.state || '',
                        is_primary: l.is_primary,
                        latitude: l.latitude,
                        longitude: l.longitude,
                        cepLoading: false,
                        cepError: '',
                        cepSuccess: true,
                        neighborhoodStatus: 'idle',
                        neighborhoodEditable: false,
                        gpsAccuracy: null
                    })));
                }

                // Carregar horários salvos
                const { data: avData } = await supabase
                    .from('seller_availability')
                    .select('*')
                    .eq('seller_id', data.id)
                    .order('day_of_week');

                if (avData && avData.length > 0) {
                    setAvailability(prev => prev.map((slot, i) => {
                        const saved = avData.find(a => a.day_of_week === i);
                        if (saved) {
                            return {
                                ...slot,
                                enabled: saved.is_enabled,
                                start: saved.start_time?.slice(0, 5) || '09:00',
                                end: saved.end_time?.slice(0, 5) || '18:00',
                            };
                        }
                        return slot;
                    }));
                }
            }
            setIsChecking(false);
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
                    const locData = await getDetailedLocation(latitude, longitude);

                    let neighborhood = locData.neighborhood;
                    let city = locData.city;
                    let street = locData.condo.split(',')[0] || '';
                    let state = '';
                    let zipCode = '';

                    // Busca CEP reverso apenas para preencher autocompletion de "state" e "zipCode" visual,
                    // MAS sem sobrescrever o nome do bairro extraído com alta precisão pelo Google/Nominatim.
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`);
                        const nmData = await res.json();
                        if (nmData && nmData.address) {
                            state = nmData.address.state_code?.toUpperCase() || nmData.address.state?.slice(0, 2)?.toUpperCase() || '';
                            zipCode = (nmData.address.postcode || '').replace(/\D/g, '');
                        }
                    } catch (e) { /* ignore */ }

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

        let sellerId = existingSellerId;

        try {
            if (existingSellerId) {
                // Atualiza
                const { error: updateError } = await supabase
                    .from('sellers')
                    .update({
                        store_name: storeName.trim(),
                        username: cleanUsername,
                        theme_id: themeId,
                        bairros_atendidos: bairrosAtendidos,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingSellerId);

                if (updateError) throw updateError;

                // Deleta locs antigas
                await supabase.from('store_locations').delete().eq('seller_id', existingSellerId);

                // Insere as novas
                const locationInserts = locations.map(loc => ({
                    seller_id: existingSellerId,
                    label: loc.label.trim() || 'Principal',
                    zip_code: loc.zip_code.replace(/\D/g, ''),
                    street: loc.street,
                    number: loc.number || null,
                    complement: loc.complement || null,
                    neighborhood: loc.neighborhood,
                    city: loc.city,
                    state: loc.state,
                    latitude: loc.latitude ?? null,
                    longitude: loc.longitude ?? null,
                    is_primary: loc.is_primary,
                }));
                await supabase.from('store_locations').insert(locationInserts);

                // (A navegação foi movida para o final para garantir salvamento de horários)
            } else {
                // Cria loja e locs
                const { data: sellerData, error: insertError } = await supabase
                    .from('sellers')
                    .insert({
                        user_id: user.id,
                        store_name: storeName.trim(),
                        username: cleanUsername,
                        theme_id: themeId,
                        bairros_atendidos: bairrosAtendidos
                    })
                    .select('id')
                    .single();

                if (sellerData) sellerId = sellerData.id;

                if (insertError) {
                    if (insertError.code === '23505') {
                        setError('Esse nome de usuário já está em uso por outra loja.');
                    } else {
                        setError(insertError.message);
                    }
                    setIsLoading(false);
                    return;
                }

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
                    latitude: loc.latitude ?? null,
                    longitude: loc.longitude ?? null,
                    is_primary: loc.is_primary,
                }));

                const { error: locError } = await supabase.from('store_locations').insert(locationInserts);

                if (locError) {
                    if (locError.code === '23505') {
                        setError('Você já tem um ponto de venda nesse bairro. Escolha bairros diferentes.');
                    } else {
                        setError('Erro ao salvar localizações: ' + locError.message);
                    }
                    await supabase.from('sellers').delete().eq('id', sellerData.id);
                    setIsLoading(false);
                    return;
                }
            }

            if (sellerId) {
                // 3) Salvar horários de funcionamento
                const availabilityRows = availability.map((slot) => ({
                    seller_id: sellerId,
                    day_of_week: slot.dayIndex,
                    is_enabled: slot.enabled,
                    start_time: slot.start,
                    end_time: slot.end,
                }));

                // Upsert: insere ou atualiza baseado na constraint unique(seller_id, day_of_week)
                await supabase
                    .from('seller_availability')
                    .upsert(availabilityRows, { onConflict: 'seller_id,day_of_week' });

                // 4) Se for uma nova loja, salvar as fotos do portfólio que já foram enviadas ao storage
                if (!existingSellerId && portfolioUrls.length > 0) {
                    const portfolioInserts = portfolioUrls.map((url, index) => ({
                        seller_id: sellerId,
                        url,
                        position: index
                    }));
                    await supabase.from('seller_portfolio_photos').insert(portfolioInserts);
                }
            }

            navigate('/profile');
        } catch (err: any) {
            console.error('Erro crítico ao salvar loja:', err);
            setError(err.message || 'Ocorreu um erro ao salvar a loja.');
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
                    Crie sua Vitrine na Sovix
                </h1>
                <p className="text-neutral-500 text-sm mt-1">
                    Defina o nome e o endereço exclusivo da sua vitrine.
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
                    {/* Visualização de Fotos (Capa + Perfil) usando AvatarUploader */}
                    {existingSellerId && (
                        <div className="relative mb-24">
                            <div className="h-40 w-full rounded-2xl overflow-hidden bg-neutral-200">
                                <AvatarUploader
                                    currentUrl={coverUrl}
                                    fallbackUrl={`https://picsum.photos/seed/${username}cover/800/400`}
                                    onUploadSuccess={(url) => {
                                        setCoverUrl(url);
                                        supabase.from('sellers').update({ cover_url: url }).eq('id', existingSellerId).then();
                                    }}
                                    uid={user?.id || ''}
                                    folder="covers"
                                    size="cover"
                                />
                            </div>
                            {/* Avatar circular posicionado com espaço para chips abaixo */}
                            <div className="absolute -bottom-20 left-6">
                                <AvatarUploader
                                    currentUrl={avatarUrl}
                                    fallbackUrl={`https://picsum.photos/seed/${username}profile/200/200`}
                                    onUploadSuccess={(url) => {
                                        setAvatarUrl(url);
                                        supabase.from('sellers').update({ avatar_url: url }).eq('id', existingSellerId).then();
                                    }}
                                    uid={user?.id || ''}
                                    folder="stores"
                                    size="lg"
                                />
                            </div>
                        </div>
                    )}


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

                    {/* Username da Vitrine */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-900 mb-2">Username da Vitrine</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-400">
                                <AtSign size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ex: doceria.mari"
                                className="w-full rounded-2xl bg-white border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm lowercase"
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-2 ml-1 font-medium">
                            Seu endereço exclusivo será: <span className="text-orange-600">sovix.com.br/@{username || 'nome_da_vitrine'}</span>
                        </p>
                    </div>

                    {/* ====== FOTOS DA VITRINE ====== */}
                    <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                        <div className="flex items-start gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                                <Camera size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-neutral-900">Fotos da Vitrine</h3>
                                <p className="text-[11px] text-neutral-400 font-medium">
                                    Adicione até 6 fotos para mostrar seus produtos ou seu espaço.
                                </p>
                            </div>
                        </div>

                        <PortfolioUploader 
                            uid={user.id} 
                            sellerId={existingSellerId} 
                            type="seller" 
                            onPhotosChange={setPortfolioUrls} 
                        />
                    </div>

                    {/* Separador de Tema e Seleção - Apenas para vitrines já existentes */}
                    {existingSellerId && (
                        <>
                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-neutral-50 px-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                        Aparência da Vitrine
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                                        <Palette size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-black text-neutral-900">Tema da Vitrine</h3>
                                        <p className="text-[11px] text-neutral-400 font-medium">Personalize o visual público da sua loja</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate('/theme-gallery')}
                                    className="w-full mt-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-2xl py-3.5 px-4 text-sm font-bold text-neutral-700 transition-all flex items-center justify-between group"
                                >
                                    <span>Ver Galeria de Temas</span>
                                    <ChevronLeft size={18} className="rotate-180 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </>
                    )}

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
                                Informe o CEP do seu local base. Este é o ponto principal da sua vitrine.
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

                    {/* ====== HORÁRIOS DE FUNCIONAMENTO ====== */}
                    <div className="relative py-2 mt-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-neutral-50 px-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                Horários de Funcionamento
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm overflow-hidden mt-2 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-neutral-900">Dias e Horários</h3>
                                <p className="text-[11px] text-neutral-400 font-medium">Configure quando sua loja está aberta.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {availability.map((slot, i) => (
                                <div key={slot.day} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border transition-all ${slot.enabled ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-transparent opacity-70'}`}>
                                    <div className="flex items-center justify-between sm:w-1/3">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={slot.enabled}
                                                onChange={(e) => {
                                                    setAvailability(prev => {
                                                        const newArr = [...prev];
                                                        newArr[i].enabled = e.target.checked;
                                                        return newArr;
                                                    });
                                                }}
                                                className="w-5 h-5 rounded-md border-neutral-300 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className={`font-bold text-sm ${slot.enabled ? 'text-neutral-900' : 'text-neutral-500'}`}>{slot.day}</span>
                                        </label>
                                        {!slot.enabled && <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider sm:hidden">Fechado</span>}
                                    </div>
                                    
                                    {slot.enabled ? (
                                        <div className="flex items-center gap-2 sm:flex-1">
                                            <input
                                                type="time"
                                                value={slot.start}
                                                onChange={(e) => {
                                                    setAvailability(prev => {
                                                        const newArr = [...prev];
                                                        newArr[i].start = e.target.value;
                                                        return newArr;
                                                    });
                                                }}
                                                className="flex-1 rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 text-sm font-bold text-neutral-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            />
                                            <span className="text-neutral-400 font-medium text-xs">até</span>
                                            <input
                                                type="time"
                                                value={slot.end}
                                                onChange={(e) => {
                                                    setAvailability(prev => {
                                                        const newArr = [...prev];
                                                        newArr[i].end = e.target.value;
                                                        return newArr;
                                                    });
                                                }}
                                                className="flex-1 rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 text-sm font-bold text-neutral-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            />
                                        </div>
                                    ) : (
                                        <div className="hidden sm:block sm:flex-1 text-center">
                                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider bg-neutral-100 px-3 py-1 rounded-lg">Fechado</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bairros Atendidos */}
                    <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm mt-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
                                <Navigation size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-neutral-900">Bairros Atendidos</h3>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Além do seu Local Base, em quais bairros você entrega ou atende? (Máximo {MAX_BAIRROS}).
                                </p>
                                
                                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 mb-4">
                                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 font-medium">
                                        Adicione apenas bairros onde você realmente consegue entregar com facilidade ou possui filial.
                                    </p>
                                </div>

                                {/* Lista de Bairros Adicionados */}
                                <div className="flex flex-col gap-3 mb-6">
                                    {bairrosAtendidos.map((bRaw, idx) => {
                                        let parsed: SISBairro | null = null;
                                        try { parsed = JSON.parse(bRaw) as SISBairro; } catch {}
                                        const nomeBairro = parsed ? parsed.bairro : bRaw;
                                        const temDetalhes = parsed && (parsed.rua || parsed.numero || parsed.complemento);
                                        
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-100 rounded-xl">
                                                <div className="flex items-start gap-3">
                                                    <MapPin size={18} className="text-purple-500 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-purple-900">{nomeBairro}</p>
                                                        {temDetalhes && (
                                                            <p className="text-xs text-purple-600 mt-0.5">
                                                                {parsed?.rua}{parsed?.numero ? `, ${parsed.numero}` : ''}{parsed?.complemento ? ` - ${parsed.complemento}` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setBairrosAtendidos(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-2 text-purple-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {bairrosAtendidos.length === 0 && (
                                        <div className="text-sm text-neutral-400 font-medium italic p-4 text-center border border-dashed border-neutral-200 rounded-xl">
                                            Nenhum bairro adicional cadastrado.
                                        </div>
                                    )}
                                </div>

                                {/* Formulario para Adicionar Bairro */}
                                {bairrosAtendidos.length < MAX_BAIRROS && (
                                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
                                        <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Adicionar Novo Bairro</h4>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-neutral-500 mb-1.5">Nome do Bairro *</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={newBairroForm.bairro}
                                                    onChange={e => {
                                                        setNewBairroForm(prev => ({ ...prev, bairro: e.target.value }));
                                                        setShowSuggestions(true);
                                                    }}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                    placeholder="Ex: Centro"
                                                    className="w-full rounded-xl border border-neutral-200 p-3 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                                />
                                                {/* Dropdown de Sugestões Sis-Loca */}
                                                <AnimatePresence>
                                                    {showSuggestions && bairroSuggestions.length > 0 && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                            className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                                        >
                                                            {bairroSuggestions
                                                                .filter(s => s.toLowerCase().includes(newBairroForm.bairro.toLowerCase()))
                                                                .map((sug, i) => (
                                                                    <button
                                                                        key={i}
                                                                        type="button"
                                                                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                                                                        onClick={() => {
                                                                            setNewBairroForm(prev => ({ ...prev, bairro: sug }));
                                                                            setShowSuggestions(false);
                                                                        }}
                                                                    >
                                                                        {sug}
                                                                    </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-neutral-500 mb-1.5">Rua (Opcional)</label>
                                                <input
                                                    type="text"
                                                    value={newBairroForm.rua}
                                                    onChange={e => setNewBairroForm(prev => ({ ...prev, rua: e.target.value }))}
                                                    placeholder="Ex: Av. Brasil"
                                                    className="w-full rounded-xl bg-white border border-neutral-200 p-3 text-sm font-medium text-neutral-700 focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-500 mb-1.5">Número</label>
                                                    <input
                                                        type="text"
                                                        value={newBairroForm.numero}
                                                        onChange={e => setNewBairroForm(prev => ({ ...prev, numero: e.target.value }))}
                                                        placeholder="123"
                                                        className="w-full rounded-xl bg-white border border-neutral-200 p-3 text-sm font-medium text-neutral-700 focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-neutral-500 mb-1.5">Compl.</label>
                                                    <input
                                                        type="text"
                                                        value={newBairroForm.complemento}
                                                        onChange={e => setNewBairroForm(prev => ({ ...prev, complemento: e.target.value }))}
                                                        placeholder="Sala 2"
                                                        className="w-full rounded-xl bg-white border border-neutral-200 p-3 text-sm font-medium text-neutral-700 focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newBairroForm.bairro.trim()) {
                                                    const bairroData: SISBairro = {
                                                        bairro: newBairroForm.bairro.trim(),
                                                        rua: newBairroForm.rua?.trim() || undefined,
                                                        numero: newBairroForm.numero?.trim() || undefined,
                                                        complemento: newBairroForm.complemento?.trim() || undefined,
                                                    };
                                                    
                                                    // Checagem para evitar que o usuario adicione o mesmo bairro 2x
                                                    const alreadyExists = bairrosAtendidos.some(bRaw => {
                                                        try {
                                                            return (JSON.parse(bRaw) as SISBairro).bairro.toLowerCase() === bairroData.bairro.toLowerCase();
                                                        } catch {
                                                            return bRaw.toLowerCase() === bairroData.bairro.toLowerCase();
                                                        }
                                                    });

                                                    if (!alreadyExists) {
                                                        setBairrosAtendidos(prev => [...prev, JSON.stringify(bairroData)]);
                                                    }
                                                    
                                                    setNewBairroForm({ bairro: '', rua: '', numero: '', complemento: '' });
                                                }
                                            }}
                                            disabled={!newBairroForm.bairro.trim()}
                                            className="w-full px-4 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                        >
                                            Adicionar à Lista de Atendimento
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Botão criar */}
                    <button
                        type="submit"
                        disabled={isLoading || !storeName || !username || !allLocationsValid}
                        className="w-full flex h-14 items-center justify-center rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : (existingSellerId ? 'Salvar Alterações' : 'Abrir minha Loja')}
                    </button>
                </form>
            </main>
        </div>
    );
};
