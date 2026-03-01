import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, X, Loader2, Zap, Calendar, Repeat } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useLocationScope } from '../context/LocationContext';
import { Logo } from '../components/Logo';

export const AddService: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { location } = useLocationScope();

    // Utilizaremos o bucket "avatars" por hora, agrupando na pasta "services"
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        service_type: 'immediate' as 'immediate' | 'scheduled' | 'recurring',
        response_time_mins: '30',
        duration_minutes: '60',
        billing_cycle: 'monthly' as 'weekly' | 'biweekly' | 'monthly',
        category_id: '',
    });

    useEffect(() => {
        // Buscar categorias do tipo "service"
        supabase
            .from('categories')
            .select('id, name')
            .eq('type', 'service')
            .then(({ data }) => {
                if (data && data.length > 0) {
                    setCategories(data);
                    setFormData(f => ({ ...f, category_id: data[0].id }));
                }
            });
    }, []);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limite de 5 fotos
        const remaining = 5 - images.length;
        const toAdd = files.slice(0, remaining);

        toAdd.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, file]);
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file as Blob);
        });

        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) {
            alert('Por favor, adicione pelo menos uma foto para o serviço.');
            return;
        }
        if (!user) {
            alert('Você precisa estar logado para cadastrar um serviço.');
            return;
        }

        setSaving(true);
        try {
            // Buscar o provider_id do usuário logado
            const { data: providerData, error: providerErr } = await supabase
                .from('service_providers')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (providerErr || !providerData) {
                alert('Perfil de prestador não encontrado. Crie seu perfil profissional primeiro.');
                setSaving(false);
                return;
            }

            // Upload da imagem principal (na tabela public.services só há 1 coluna image_url atualmente)
            let mainImageUrl: string | null = null;
            if (images.length > 0) {
                const file = images[0];
                const ext = file.name.split('.').pop();
                const path = `${user.id}/service_cover_${Date.now()}.${ext}`;
                mainImageUrl = await uploadFile(file, path);
            }

            const basePayload = {
                provider_id: providerData.id,
                category_id: formData.category_id || null,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                image_url: mainImageUrl,
                is_active: true,
                neighborhood: location?.neighborhood || null,
                city: location?.city || null,
                service_type: formData.service_type,
            };

            const typePayload = formData.service_type === 'immediate'
                ? { response_time_mins: parseInt(formData.response_time_mins, 10), duration_mins: null, billing_cycle: null }
                : formData.service_type === 'scheduled'
                    ? { response_time_mins: null, duration_mins: parseInt(formData.duration_minutes, 10), billing_cycle: null }
                    : { response_time_mins: null, duration_mins: null, billing_cycle: formData.billing_cycle };

            const { error } = await supabase.from('services').insert({
                ...basePayload,
                ...typePayload,
            });

            if (error) throw error;

            alert('Serviço cadastrado com sucesso!');
            navigate('/admin/services');
        } catch (err: unknown) {
            console.error('Erro ao salvar serviço:', err);
            alert('Erro ao salvar serviço. Tente novamente.');
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
                        <h1 className="text-xl font-bold text-neutral-900">Novo Serviço</h1>
                    </div>
                    <Logo variant="orange" className="scale-75 hidden sm:block" />
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Múltiplas Imagens Portfólio do Serviço */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                Fotos do Serviço ({imagePreviews.length}/5)
                            </h3>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase">A primeira foto será a capa</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {imagePreviews.map((preview, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="relative aspect-square rounded-3xl overflow-hidden bg-neutral-200 border border-neutral-100 group"
                                    >
                                        <img src={preview} className="h-full w-full object-cover" alt={`Preview ${index}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={16} />
                                        </button>
                                        {index === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-purple-600/90 py-1 text-center">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Capa</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {images.length < 5 && (
                                <label className="aspect-square rounded-3xl border-2 border-dashed border-neutral-200 bg-white flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-purple-500 hover:text-purple-500 transition-all cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <div className="p-3 rounded-full bg-neutral-50">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-xs font-bold">Adicionar da Galeria</span>
                                </label>
                            )}
                        </div>
                    </section>

                    {/* Modalidade de Serviço (Fase 1) */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Modalidade do Serviço</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Imediato */}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, service_type: 'immediate' })}
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all text-center ${formData.service_type === 'immediate' ? 'border-red-500 bg-red-50 text-red-700' : 'border-neutral-100 bg-white hover:border-red-200'}`}
                            >
                                <div className={`p-3 rounded-full ${formData.service_type === 'immediate' ? 'bg-red-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <p className="font-bold">Imediato / Urgência</p>
                                    <p className="text-xs opacity-70 mt-1">Ex: Chaveiro, Reboque, Encanador</p>
                                </div>
                            </button>

                            {/* Agendamento */}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, service_type: 'scheduled' })}
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all text-center ${formData.service_type === 'scheduled' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-100 bg-white hover:border-blue-200'}`}
                            >
                                <div className={`p-3 rounded-full ${formData.service_type === 'scheduled' ? 'bg-blue-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="font-bold">Agendamento</p>
                                    <p className="text-xs opacity-70 mt-1">Ex: Barbeiro, Psicólogo, Faxina</p>
                                </div>
                            </button>

                            {/* Recorrente */}
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, service_type: 'recurring' })}
                                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all text-center ${formData.service_type === 'recurring' ? 'border-green-500 bg-green-50 text-green-700' : 'border-neutral-100 bg-white hover:border-green-200'}`}
                            >
                                <div className={`p-3 rounded-full ${formData.service_type === 'recurring' ? 'bg-green-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <Repeat size={24} />
                                </div>
                                <div>
                                    <p className="font-bold">Plano Contínuo</p>
                                    <p className="text-xs opacity-70 mt-1">Ex: Limpeza de Piscina, Mentoria</p>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Informações Básicas */}
                    <section className="space-y-6">
                        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Detalhes do Serviço</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Qual o nome do Serviço?</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Corte de Cabelo Masculino, Instalação de Ar..."
                                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-purple-500 focus:ring-0 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-2">Descreva os detalhes (o que está incluso?)</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Descreva minuciosamente o seu pacote..."
                                    className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-purple-500 focus:ring-0 transition-all resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Precificação e Categoria */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Preço e Tipo</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">Preço (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0,00"
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-purple-500 focus:ring-0 transition-all"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">Categoria</label>
                                    <select
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-purple-500 focus:ring-0 transition-all appearance-none"
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        {categories.length === 0 ? (
                                            <option value="">Carregando categorias...</option>
                                        ) : (
                                            categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                {formData.service_type === 'immediate' ? 'Tempo de Resposta' : formData.service_type === 'scheduled' ? 'Duração da Sessão' : 'Ciclo de Pagamento'}
                            </h3>
                            <div className="space-y-4">
                                {formData.service_type === 'immediate' && (
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Em minutos (Aproximado)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ex: 30"
                                            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-red-500 focus:ring-0 transition-all"
                                            value={formData.response_time_mins}
                                            onChange={(e) => setFormData({ ...formData, response_time_mins: e.target.value })}
                                        />
                                        <p className="text-xs font-medium text-neutral-500 mt-2">Os clientes darão preferência aos profissionais mais rápidos.</p>
                                    </div>
                                )}
                                {formData.service_type === 'scheduled' && (
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Em minutos</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="Ex: 60"
                                            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-blue-500 focus:ring-0 transition-all"
                                            value={formData.duration_minutes}
                                            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        />
                                        <p className="text-xs font-medium text-neutral-500 mt-2">Duração média para que os clientes saibam quanto tempo reservar.</p>
                                    </div>
                                )}
                                {formData.service_type === 'recurring' && (
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Cobrado a cada</label>
                                        <select
                                            className="w-full rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-neutral-900 focus:border-green-500 focus:ring-0 transition-all appearance-none"
                                            value={formData.billing_cycle}
                                            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                                        >
                                            <option value="weekly">Semana</option>
                                            <option value="biweekly">Quinzena</option>
                                            <option value="monthly">Mês</option>
                                        </select>
                                        <p className="text-xs font-medium text-neutral-500 mt-2">O valor de R$ {formData.price || '0,00'} será acordado para o ciclo escolhido.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Ações */}
                    <div className="pt-8 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 rounded-2xl border border-neutral-200 bg-white py-4 text-sm font-bold text-neutral-600 hover:bg-neutral-50 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-4 text-sm font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all disabled:opacity-60"
                        >
                            {saving ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Criar Serviço Completo'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};
