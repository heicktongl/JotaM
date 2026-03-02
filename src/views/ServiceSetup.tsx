import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Briefcase, Loader2, LogOut, FileText, Pickaxe, CheckCircle2, Camera, ImagePlus, X, Clock, Copy, Zap, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { AvatarUploader } from '../components/AvatarUploader';
import { useLocationScope } from '../context/LocationContext';

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

    // Avatar e Capa
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    // Fotos do serviço (portfólio)
    const [servicePhotos, setServicePhotos] = useState<{ file: File; preview: string }[]>([]);

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


    const handleServicePhotosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remaining = 6 - servicePhotos.length;
        const toAdd = files.slice(0, remaining);

        toAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setServicePhotos((prev) => [...prev, { file, preview: reader.result as string }]);
            };
            reader.readAsDataURL(file as Blob);
        });

        // Limpa o input pra permitir re-selecionar o mesmo arquivo
        e.target.value = '';
    };

    const removeServicePhoto = (index: number) => {
        setServicePhotos((prev) => prev.filter((_, i) => i !== index));
    };

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
                    setExistingProviderId(data.id);

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

    const uploadFile = async (file: File, path: string): Promise<string | null> => {
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(path);

        return publicUrl;
    };

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

            // 3) Upload fotos de portfólio
            if (servicePhotos.length > 0) {
                const uploadPromises = servicePhotos.map(async (photo, index) => {
                    const ext = photo.file.name.split('.').pop();
                    const path = `${user.id}/service_${providerId}_${index}_${Date.now()}.${ext}`;
                    return uploadFile(photo.file, path);
                });
                await Promise.all(uploadPromises);
            }

            // 4) Salvar horários de atendimento
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
                            {existingProviderId ? 'Configurar Sua Vitrine' : 'Ofereça Seus Serviços'}
                        </h1>
                        <p className="text-neutral-500">
                            {existingProviderId ? 'Atualize suas informações e seu link público.' : 'Crie seu perfil profissional e comece a receber agendamentos.'}
                        </p>
                    </motion.div>

                    <form onSubmit={handleCreateServiceProfile} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        {/* ====== FOTO DE CAPA E PERFIL ====== */}
                        <div className="relative mb-8">
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
                            <div className="absolute -bottom-10 left-6">
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
                                    Sua URL (jotaM.app/@...)
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
                                        placeholder="seunomeprofissional"
                                        className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-display lowercase"
                                    />
                                </div>
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

                        {/* ====== FOTOS DO SERVIÇO (PORTFÓLIO) ====== */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    Fotos dos seus Serviços (Opcional)
                                </h3>
                                <span className="text-[10px] font-bold text-neutral-400 uppercase">{servicePhotos.length}/6 fotos</span>
                            </div>
                            <p className="text-xs text-neutral-400 mb-4">A primeira foto será a capa do seu portfólio.</p>

                            <div className="grid grid-cols-3 gap-3">
                                <AnimatePresence mode="popLayout">
                                    {servicePhotos.map((photo, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-neutral-100 group"
                                        >
                                            <img src={photo.preview} alt={`Serviço ${index + 1}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeServicePhoto(index)}
                                                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                            {index === 0 && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-purple-600/90 py-1 text-center">
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Capa</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {servicePhotos.length < 6 && (
                                    <label
                                        htmlFor="portfolio-image-upload"
                                        className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-purple-500 hover:text-purple-500 transition-all cursor-pointer"
                                    >
                                        <input
                                            id="portfolio-image-upload"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleServicePhotosSelect}
                                        />
                                        <div className="p-2 rounded-full bg-neutral-50">
                                            <ImagePlus size={22} />
                                        </div>
                                        <span className="text-[10px] font-bold text-center">Adicionar da<br />Galeria</span>
                                    </label>
                                )}
                            </div>
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

                        {/* Benefícios */}
                        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                            <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-purple-600" />
                                Por que oferecer serviços?
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
            </main>
        </div>
    );
};
