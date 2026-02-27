import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, Loader2, LogOut, FileText, Pickaxe, CheckCircle2, Camera, ImagePlus, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

export const ServiceSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingOriginal, setIsFetchingOriginal] = useState(true);
    const [error, setError] = useState('');
    const [existingProviderId, setExistingProviderId] = useState<string | null>(null);

    // Avatar (foto de perfil)
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Fotos do serviço (portfólio)
    const [servicePhotos, setServicePhotos] = useState<{ file: File; preview: string }[]>([]);
    const servicePhotosInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

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
                    setAvatarPreview(data.avatar_url || null);
                    setExistingProviderId(data.id);
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
            // 1) Upload avatar se tiver
            let avatarUrl = avatarPreview; // Mantém o atual se não mudar
            if (avatarFile) {
                const ext = avatarFile.name.split('.').pop();
                const path = `${user.id}/avatar_${Date.now()}.${ext}`;
                avatarUrl = await uploadFile(avatarFile, path);
            }

            // 2) Criar ou Atualizar perfil
            const profileData = {
                user_id: user.id,
                name: name.trim(),
                username: username.trim().toLowerCase(),
                bio: bio.trim() || null,
                avatar_url: avatarUrl,
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

            navigate('/admin/services');
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
                <Logo variant="orange" />
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

                        {/* ====== FOTO DE PERFIL ====== */}
                        <div className="flex flex-col items-center">
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarSelect}
                            />
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="group relative w-28 h-28 rounded-full bg-neutral-100 border-4 border-white shadow-lg overflow-hidden transition-all hover:shadow-xl"
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                                        <Camera size={28} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </button>
                            <p className="text-xs font-bold text-neutral-400 mt-2 uppercase tracking-widest">
                                Foto de Perfil
                            </p>
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
                            <label className="block text-xs font-bold text-neutral-500 mb-4 uppercase tracking-widest">
                                Fotos dos seus Serviços (Opcional)
                            </label>
                            <p className="text-xs text-neutral-400 mb-4">Adicione até 6 fotos mostrando o que você faz de melhor.</p>

                            <input
                                ref={servicePhotosInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleServicePhotosSelect}
                            />

                            <div className="grid grid-cols-3 gap-3">
                                {servicePhotos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-neutral-100 group">
                                        <img src={photo.preview} alt={`Serviço ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeServicePhoto(index)}
                                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {servicePhotos.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={() => servicePhotosInputRef.current?.click()}
                                        className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:border-purple-400 hover:text-purple-500 transition-all hover:bg-purple-50"
                                    >
                                        <ImagePlus size={24} />
                                        <span className="text-[10px] font-bold mt-1">Adicionar</span>
                                    </button>
                                )}
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
