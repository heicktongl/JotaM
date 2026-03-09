import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Briefcase, Loader2, LogOut, FileText, Pickaxe, CheckCircle2, Clock, Zap, Calendar, User, Building2, Palette, Navigation, AlertCircle, XCircle, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { AvatarUploader } from '../components/AvatarUploader';
import { PortfolioUploader } from '../components/PortfolioUploader';
import { useLocationScope } from '../context/LocationContext';
import { SISBairro, extractBairroName, fetchNeighborhoodsByCity } from '../utils/sis-loca';

export const ServiceSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { location } = useLocationScope();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingOriginal, setIsFetchingOriginal] = useState(true);
    const [error, setError] = useState('');
    const [existingProviderId, setExistingProviderId] = useState<string | null>(null);
    const [themeId, setThemeId] = useState<string>('sovix_default');
    const [providerType, setProviderType] = useState<'autonomo' | 'empresa'>('autonomo');

    // Avatar e Capa
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    // URLs das fotos de portfólio capturadas pelo PortfolioUploader
    const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

    const [bairrosAtendidos, setBairrosAtendidos] = useState<string[]>([]);
    const [newBairroForm, setNewBairroForm] = useState<SISBairro>({ bairro: '', rua: '', numero: '', complemento: '' });
    const [bairroSuggestions, setBairroSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const MAX_BAIRROS = 3;

    // Buscar Sugestões de Bairro (Sis-Loca)
    useEffect(() => {
        if (location?.city) {
            fetchNeighborhoodsByCity(supabase, location.city).then(sugs => setBairroSuggestions(sugs));
        }
    }, [location]);

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


    // Carregar dados existentes
    React.useEffect(() => {
        const loadExistingProfile = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('service_providers')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (data) {
                    setName(data.name || '');
                    setUsername(data.username || '');
                    setBio(data.bio || '');
                    setAvatarUrl(data.avatar_url || null);
                    setCoverUrl(data.cover_url || null);
                    if (data.theme_id) setThemeId(data.theme_id);
                    setExistingProviderId(data.id);
                    if (data.provider_type) setProviderType(data.provider_type as 'autonomo' | 'empresa');
                    if (data.bairros_atendidos) setBairrosAtendidos(data.bairros_atendidos);

                    // Carregar horários salvos
                    const { data: avData } = await supabase
                        .from('provider_availability')
                        .select('*')
                        .eq('provider_id', data.id)
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
            } catch (err) {
                console.error("Erro ao carregar perfil existente:", err);
            } finally {
                setIsFetchingOriginal(false);
            }
        };
        loadExistingProfile();
    }, [user]);

    const handleCreateServiceProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError('');

        if (name.trim().length < 3) {
            setError('Seu nome profissional deve ter pelo menos 3 caracteres.');
            setIsLoading(false);
            return;
        }

        if (username.trim().length < 3 || /[^a-zA-Z0-9_]/.test(username)) {
            setError('O nome de usuário (URL) deve ter pelo menos 3 caracteres e conter apenas letras, números e underlines.');
            setIsLoading(false);
            return;
        }

        try {


            // 2) Criar ou Atualizar perfil
            const profileData = {
                user_id: user.id,
                name: name.trim(),
                username: username.trim().toLowerCase(),
                bio: bio.trim() || null,
                avatar_url: avatarUrl,
                cover_url: coverUrl,
                city: location?.city || null,
                neighborhood: location?.neighborhood === 'Bairro Desconhecido' ? null : (location?.neighborhood || null),
                provider_type: providerType,
                theme_id: themeId,
                bairros_atendidos: bairrosAtendidos,
            };

            let result;
            if (existingProviderId) {
                result = await supabase
                    .from('service_providers')
                    .update(profileData)
                    .eq('id', existingProviderId)
                    .select('id')
                    .single();
            } else {
                result = await supabase
                    .from('service_providers')
                    .insert(profileData)
                    .select('id')
                    .single();
            }

            if (result.error) {
                if (result.error.code === '23505') {
                    setError('Este nome de usuário já está em uso. Escolha outro.');
                } else {
                    setError(result.error.message || 'Erro ao salvar perfil.');
                }
                setIsLoading(false);
                return;
            }

            const providerId = result.data.id;

            // 3) Salvar horários de atendimento
            const availabilityRows = availability.map((slot) => ({
                provider_id: providerId,
                day_of_week: slot.dayIndex,
                is_enabled: slot.enabled,
                start_time: slot.start,
                end_time: slot.end,
            }));

            // Upsert: insere ou atualiza baseado na constraint unique(provider_id, day_of_week)
            await supabase
                .from('provider_availability')
                .upsert(availabilityRows, { onConflict: 'provider_id,day_of_week' });

            // 4) Salvar fotos de portfólio pendentes (caso new profile: uploadadas ao Storage sem providerId)
            if (portfolioUrls.length > 0) {
                // Verifica quais URLs já estão no banco para não duplicar
                const { data: existing } = await supabase
                    .from('provider_portfolio_photos')
                    .select('url')
                    .eq('provider_id', providerId);

                const existingUrls = new Set((existing || []).map((r: { url: string }) => r.url));
                const toInsert = portfolioUrls
                    .filter((url) => !existingUrls.has(url))
                    .map((url, idx) => ({
                        provider_id: providerId,
                        url,
                        position: (existing?.length || 0) + idx,
                    }));

                if (toInsert.length > 0) {
                    await supabase.from('provider_portfolio_photos').insert(toInsert);
                }
            }

            navigate('/profile');
        } catch (err: any) {
            setError(err.message || 'Erro ao processar seu perfil profissional.');
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (isFetchingOriginal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-purple-600">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <header className="p-6 border-b border-neutral-100 bg-white shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <Logo variant="orange" />
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-red-500 transition-colors"
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center p-6 md:p-12">
                <div className="w-full max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 mb-2">
                            {existingProviderId ? 'Configurar Sua Vitrine' : 'Crie sua Vitrine de Serviços'}
                        </h1>
                        <p className="text-neutral-500">
                            {existingProviderId ? 'Atualize suas informações e seu endereço exclusivo na Sovix.' : 'Crie seu perfil profissional e comece a ser descoberto na sua região.'}
                        </p>
                    </motion.div>

                    <form onSubmit={handleCreateServiceProfile} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        {/* ====== TIPO DE PRESTADOR ====== */}
                        <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                                Você atua como
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setProviderType('autonomo')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${providerType === 'autonomo'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                                        }`}
                                >
                                    <User size={22} />
                                    <span className="text-sm font-bold text-center leading-tight">Pessoa Física</span>
                                    <span className="text-[10px] text-center leading-tight opacity-70">Autônomo / Freelancer</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProviderType('empresa')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${providerType === 'empresa'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                                        }`}
                                >
                                    <Building2 size={22} />
                                    <span className="text-sm font-bold text-center leading-tight">Empresa</span>
                                    <span className="text-[10px] text-center leading-tight opacity-70">Pessoa Jurídica / CNPJ</span>
                                </button>
                            </div>
                        </div>

                        {/* ====== FOTO DE CAPA E PERFIL ====== */}
                        <div className="relative mb-24">
                            <div className="h-40 w-full rounded-2xl overflow-hidden bg-neutral-200">
                                <AvatarUploader
                                    currentUrl={coverUrl}
                                    fallbackUrl=""
                                    onUploadSuccess={(url) => {
                                        setCoverUrl(url);
                                        if (existingProviderId) {
                                            supabase.from('service_providers').update({ cover_url: url }).eq('id', existingProviderId).then();
                                        }
                                    }}
                                    uid={user?.id || ''}
                                    folder="covers"
                                    size="cover"
                                />
                            </div>
                            {/* Avatar circular com espaço para chips abaixo */}
                            <div className="absolute -bottom-20 left-6">
                                <AvatarUploader
                                    currentUrl={avatarUrl}
                                    fallbackUrl={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'S')}&background=7C3AED&color=fff&size=128`}
                                    onUploadSuccess={(url) => {
                                        setAvatarUrl(url);
                                        if (existingProviderId) {
                                            supabase.from('service_providers').update({ avatar_url: url }).eq('id', existingProviderId).then();
                                        }
                                    }}
                                    uid={user?.id || ''}
                                    folder="providers"
                                    size="lg"
                                />
                            </div>
                        </div>


                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-widest">
                                    Seu Nome Profissional
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                                        <Pickaxe size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome ou nome do negócio"
                                        className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-display"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-widest">
                                    Username da Vitrine
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                                        @
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        placeholder="ex: seunomeprofissional"
                                        className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-display lowercase"
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-2 ml-1 font-medium">
                                    Seu endereço exclusivo será: <span className="text-purple-600 font-bold">sovix.com.br/@{username || 'nome_da_vitrine'}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-widest">
                                    Sobre você (Opcional)
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-5 text-neutral-400">
                                        <FileText size={20} />
                                    </div>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Conte um pouco sobre suas especialidades e sua experiência..."
                                        rows={4}
                                        className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-4 pl-12 pr-4 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ====== TEMA DA VITRINE ====== */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                                    <Palette size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-neutral-900">Tema da Vitrine</h3>
                                    <p className="text-[11px] text-neutral-400 font-medium">Personalize o visual público do seu perfil</p>
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

                        {/* ====== BAIRROS ATENDIDOS ====== */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm mt-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
                                    <Navigation size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-black text-neutral-900">Bairros Atendidos</h3>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        Em quais bairros você presta serviço? (Máximo {MAX_BAIRROS}).
                                    </p>
                                    
                                    <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 mb-4">
                                        <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-700 font-medium">
                                            Adicione apenas bairros onde você tem disponibilidade para atender.
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
                                                        <XCircle size={16} />
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

                        {/* ====== FOTOS DO SERVIÇO (PORTFÓLIO) ====== */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    Fotos dos seus Serviços (Opcional)
                                </h3>
                            </div>
                            <p className="text-xs text-neutral-400 mb-4">A primeira foto será a capa do seu portfólio.</p>
                            <PortfolioUploader
                                uid={user?.id || ''}
                                providerId={existingProviderId}
                                onPhotosChange={setPortfolioUrls}
                            />
                        </div>

                        {/* ====== HORÁRIOS DE ATENDIMENTO ====== */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} />
                                    Horários de Atendimento
                                </h3>
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">Visível na vitrine</span>
                            </div>
                            <p className="text-xs text-neutral-400 mb-5">Seus serviços vão herdar esses horários automaticamente.</p>

                            <div className="space-y-3">
                                {availability.map((slot, idx) => (
                                    <div
                                        key={slot.day}
                                        className={`rounded-2xl border transition-all ${slot.enabled
                                            ? 'bg-white border-neutral-100 shadow-sm'
                                            : 'bg-neutral-50 border-transparent opacity-50'
                                            }`}
                                    >
                                        <div className="p-4 flex items-center gap-3">
                                            {/* Toggle do dia */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...availability];
                                                    updated[idx].enabled = !updated[idx].enabled;
                                                    setAvailability(updated);
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${slot.enabled ? 'bg-purple-600' : 'bg-neutral-300'
                                                    }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${slot.enabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                            </button>

                                            {/* Nome do dia */}
                                            <span className={`text-sm font-bold flex-1 ${slot.enabled ? 'text-neutral-900' : 'text-neutral-400'
                                                }`}>
                                                {slot.day}
                                            </span>

                                            {/* Inputs de horário */}
                                            {slot.enabled && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="time"
                                                        value={slot.start}
                                                        onChange={(e) => {
                                                            const updated = [...availability];
                                                            updated[idx].start = e.target.value;
                                                            setAvailability(updated);
                                                        }}
                                                        className="w-[90px] rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs font-bold text-neutral-700 focus:border-purple-500 focus:ring-0 transition-all"
                                                    />
                                                    <span className="text-neutral-300 text-xs">—</span>
                                                    <input
                                                        type="time"
                                                        value={slot.end}
                                                        onChange={(e) => {
                                                            const updated = [...availability];
                                                            updated[idx].end = e.target.value;
                                                            setAvailability(updated);
                                                        }}
                                                        className="w-[90px] rounded-xl border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs font-bold text-neutral-700 focus:border-purple-500 focus:ring-0 transition-all"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Atalhos */}
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAvailability(prev => prev.map((s, i) => ({
                                            ...s,
                                            enabled: i < 5,
                                            start: '08:00',
                                            end: '18:00',
                                        })));
                                    }}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-1"
                                >
                                    <Zap size={10} />
                                    Comercial (Seg-Sex 08-18h)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAvailability(prev => prev.map(s => ({
                                            ...s,
                                            enabled: true,
                                            start: '09:00',
                                            end: '22:00',
                                        })));
                                    }}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-600 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-1"
                                >
                                    <Calendar size={10} />
                                    Todos os dias (09-22h)
                                </button>
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                            <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-purple-600" />
                                Por que oferecer serviços com a gente?
                            </h3>
                            <ul className="text-xs text-purple-700 space-y-2 opacity-80">
                                <li>• Seu perfil aparecerá no Feed e na Busca.</li>
                                <li>• Agendamentos organizados em um único painel.</li>
                                <li>• Sem taxas ocultas para publicar serviços.</li>
                            </ul>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-sm font-bold text-white shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                existingProviderId ? 'Salvar Alterações' : 'Criar Perfil Profissional'
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="w-full py-4 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                        >
                            Voltar para o Perfil
                        </button>
                    </form>
                </div>
            </main >
        </div >
    );
};
