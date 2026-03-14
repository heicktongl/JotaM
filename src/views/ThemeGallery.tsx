import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronLeft, Palette, Check, Eye, Sparkles, Type, Paintbrush,
    MousePointerClick, Briefcase, ShoppingBag, Loader2,
    CheckCircle2, AlertCircle, Zap, Undo2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { withRetry } from '../utils/network';
import { THEME_REGISTRY } from '../lib/themeRegistry';
import { ThemeCustomization, generateThemeCSSVariables } from '../lib/themeEngine';

export const ThemeGallery: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [userType, setUserType] = useState<'seller' | 'provider' | null>(null);
    const [currentThemeId, setCurrentThemeId] = useState('sovix_default');
    const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

    const [customization, setCustomization] = useState<ThemeCustomization>({});
    const [isCustomizing, setIsCustomizing] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const detect = async () => {
            if (!user) return;
            setIsLoading(true);

            const { data: seller } = await supabase.from('sellers').select('id, theme_id, theme_customization').eq('user_id', user.id).maybeSingle();
            if (seller) {
                setUserType('seller');
                setCurrentThemeId(seller.theme_id || 'sovix_default');
                setCustomization(seller.theme_customization || {});
                setIsLoading(false);
                return;
            }

            const { data: provider } = await supabase.from('service_providers').select('id, theme_id, theme_customization').eq('user_id', user.id).maybeSingle();
            if (provider) {
                setUserType('provider');
                setCurrentThemeId(provider.theme_id || 'sovix_default');
                setCustomization(provider.theme_customization || {});
            }
            setIsLoading(false);
        };
        detect();
    }, [user]);

    const availableThemes = THEME_REGISTRY.filter(
        (t) => userType ? (t.targetType === 'both' || t.targetType === userType) : true
    );

    const activePreview = selectedThemeId ? THEME_REGISTRY.find(t => t.id === selectedThemeId) : THEME_REGISTRY.find(t => t.id === currentThemeId);
    const previewCSSVars = activePreview ? generateThemeCSSVariables(activePreview, customization) : {};
    const activePrimaryColor = customization.colors?.primary || activePreview?.colors.primary || '#f97316';

    const handleApplyTheme = async () => {
        if (!user || !activePreview || !userType) return;
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            const table = userType === 'seller' ? 'sellers' : 'service_providers';
            const { error } = await withRetry(async () => await supabase.from(table).update({ theme_id: activePreview.id, theme_customization: customization }).eq('user_id', user.id));
            if (error) throw error;

            setCurrentThemeId(activePreview.id);
            setSelectedThemeId(null);
            setIsCustomizing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setSaveError(err.message || 'Erro ao salvar tema e customizações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleColorChange = (key: keyof NonNullable<ThemeCustomization['colors']>, value: string) => {
        setCustomization(prev => ({ ...prev, colors: { ...(prev.colors || {}), [key]: value } }));
    };

    const resetCustomization = () => setCustomization({});

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-orange-500 animate-spin" />
                    <p className="text-neutral-500 font-bold text-sm">Carregando Studio...</p>
                </div>
            </div>
        );
    }
return (
    <div className="min-h-screen bg-[#F5F5F7] text-neutral-900 pb-32 font-sans selection:bg-orange-500/30">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 flex items-center gap-2 tracking-tight">
                            <Sparkles size={22} className="text-orange-500" />
                            Sovix Theme Studio
                        </h1>
                    </div>
                </div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
            <AnimatePresence>
                {saveSuccess && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        <p className="text-sm font-bold text-emerald-800">Vitrine atualizada com maestria!</p>
                    </motion.div>
                )}
                {saveError && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        <AlertCircle size={20} className="text-red-600 shrink-0" />
                        <p className="text-sm font-bold text-red-800">{saveError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isCustomizing && (
                <section className="mb-14">
                    <h2 className="text-xs font-black text-neutral-400 tracking-widest uppercase mb-4 pl-1">Vitrine Ativa</h2>
                    <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                        <div className="w-full sm:w-48 aspect-[16/10] sm:aspect-square rounded-2xl overflow-hidden shadow-inner bg-neutral-100 relative shrink-0 group">
                            <img
                                src={THEME_REGISTRY.find(t => t.id === currentThemeId)?.thumbnail || ''}
                                alt="Tema Atual"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 border border-black/5 rounded-2xl pointer-events-none" />
                        </div>
                        <div className="flex-1 w-full text-center sm:text-left">
                            <h3 className="text-2xl font-black text-neutral-900 tracking-tight mb-2">
                                {THEME_REGISTRY.find(t => t.id === currentThemeId)?.name || 'Padrão'}
                            </h3>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${Object.keys(customization).length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                    {Object.keys(customization).length > 0 ? 'Personalizado' : 'Design Original'}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedThemeId(currentThemeId);
                                    setIsCustomizing(true);
                                }}
                                className="w-full sm:w-auto px-8 py-3.5 bg-neutral-900 text-white rounded-full font-bold shadow-lg shadow-neutral-900/20 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                            >
                                <Paintbrush size={18} /> Continuar Edição
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <section>
                <div className="flex items-center justify-between mb-8 pl-1">
                    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Galeria Premium</h2>
                    <span className="text-xs font-bold bg-neutral-200 text-neutral-600 px-3 py-1 rounded-full">{availableThemes.length} Temas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableThemes.map((theme) => {
                        const isActive = currentThemeId === theme.id;
                        return (
                            <motion.div
                                key={theme.id}
                                whileHover={{ y: -4 }}
                                className="group relative bg-white rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300"
                                onClick={() => {
                                    setSelectedThemeId(theme.id);
                                    if (theme.id !== currentThemeId) setCustomization({});
                                    setIsCustomizing(true);
                                }}
                            >
                                <div className="aspect-[16/11] relative overflow-hidden bg-neutral-100">
                                    <img src={theme.thumbnail} alt={theme.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 mix-blend-multiply" />
                                    {isActive && (
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                                                <Check size={12} strokeWidth={3} /> Ativo
                                            </span>
                                        </div>
                                    )}
                                    {theme.targetType === 'provider' && (
                                        <div className="absolute top-4 right-4 bg-purple-500 text-white p-1.5 rounded-full shadow-md"><Briefcase size={14} /></div>
                                    )}
                                    {theme.targetType === 'seller' && (
                                        <div className="absolute top-4 right-4 bg-orange-500 text-white p-1.5 rounded-full shadow-md"><ShoppingBag size={14} /></div>
                                    )}

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
                                        <div className="bg-white/90 text-neutral-900 backdrop-blur-md px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                                            <Eye size={18} /> Abrir Studio
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-neutral-900 mb-1 tracking-tight">{theme.name}</h3>
                                    <p className="text-xs text-neutral-500 font-medium leading-relaxed line-clamp-2">{theme.description}</p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </section>
        </main>
{/* FULLSCREEN STUDIO MODAL (TTDDT) */ }
<AnimatePresence>
    {isCustomizing && activePreview && (
        <motion.div
            className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Header Modal */}
            <div className="h-16 lg:h-20 bg-white border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setIsCustomizing(false);
                            if (activePreview.id !== currentThemeId) setSelectedThemeId(null);
                        }}
                        className="p-2 sm:px-4 sm:py-2 rounded-full sm:rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold text-sm transition-colors flex items-center gap-2"
                    >
                        <ChevronLeft size={18} />
                        <span className="hidden sm:inline">Voltar à Galeria</span>
                    </button>
                    <div className="hidden md:block w-px h-6 bg-neutral-200 mx-2" />
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Editando Estilo</span>
                        <h2 className="text-sm font-black text-neutral-900 leading-tight">{activePreview.name}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={resetCustomization} className="hidden sm:flex text-neutral-500 hover:text-red-500 font-bold text-xs p-2 transition-colors items-center gap-1">
                        <Undo2 size={14} /> Resetar
                    </button>
                    <button
                        onClick={handleApplyTheme}
                        disabled={isSaving}
                        style={{ backgroundColor: activePrimaryColor }}
                        className="text-white px-6 py-2.5 sm:py-3 rounded-full font-black text-sm shadow-xl shadow-black/10 hover:brightness-110 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        <span className="hidden sm:inline">Publicar Vitrine</span>
                        <span className="sm:hidden">Publicar</span>
                    </button>
                </div>
            </div>

            {/* Corpo do Studio: Layout Split (Propriedades + Sandbox) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* Esquerda: Propriedades (Customizadores) */}
                <div className="w-full md:w-[320px] lg:w-[400px] xl:w-[450px] bg-white border-r border-neutral-200 overflow-y-auto shrink-0 z-10 hidden md:flex flex-col shadow-xl">
                    <div className="p-6 space-y-8">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Zap size={20} /></div>
                            <div>
                                <h4 className="text-sm font-black text-orange-900 mb-1">Transmutador Ativo</h4>
                                <p className="text-xs font-medium text-orange-700/80 leading-relaxed">
                                    As personalizações refletem no preview ao vivo via motor CSS. Edite sem medo.
                                </p>
                            </div>
                        </div>

                        <section>
                            <h4 className="text-xs font-black text-neutral-400 tracking-widest uppercase mb-4 flex items-center gap-2"><Palette size={14} /> Paleta da Marca</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Cor Principal', key: 'primary' as const, fallback: activePreview.colors.primary },
                                    { label: 'Fundo da Loja', key: 'background' as const, fallback: activePreview.colors.background },
                                    { label: 'Superfícies (Cards)', key: 'surface' as const, fallback: activePreview.colors.surface },
                                    { label: 'Texto Primário', key: 'text' as const, fallback: activePreview.colors.text },
                                ].map(({ label, key, fallback }) => (
                                    <div key={key} className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex flex-col items-center justify-center gap-3 hover:border-orange-200 transition-colors">
                                        <span className="text-[11px] font-bold text-neutral-500 text-center">{label}</span>
                                        <div className="relative group">
                                            <div className="w-12 h-12 rounded-full shadow-inner cursor-pointer overflow-hidden border-2 border-white ring-1 ring-neutral-200" style={{ backgroundColor: customization.colors?.[key] || fallback }}>
                                                <input type="color" value={customization.colors?.[key] || fallback} onChange={(e) => handleColorChange(key, e.target.value)} className="opacity-0 w-[200%] h-[200%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer" />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest">{customization.colors?.[key] || fallback}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs font-black text-neutral-400 tracking-widest uppercase mb-4 flex items-center gap-2"><Type size={14} /> Tipografia</h4>
                            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex flex-col gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Família de Títulos</label>
                                    <div className="relative">
                                        <select className="w-full appearance-none bg-white border border-neutral-200 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-neutral-900 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm cursor-pointer" value={customization.typography?.heading || activePreview.layout.fontFamilyHeading} onChange={(e) => setCustomization(prev => ({ ...prev, typography: { ...prev.typography, heading: e.target.value } }))}>
                                            <option value="inherit">Sistema (Misto Seguro)</option>
                                            <option value="'Playfair Display', serif">Playfair Display (Elegante)</option>
                                            <option value="'Outfit', sans-serif">Outfit (Moderno/Arrojado)</option>
                                            <option value="'Manrope', sans-serif">Manrope (Geométrico)</option>
                                            <option value="'Inter', sans-serif">Inter (Tech/Neutro)</option>
                                        </select>
                                        <ChevronLeft className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-neutral-400" size={16} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-xs font-black text-neutral-400 tracking-widest uppercase mb-4 flex items-center gap-2"><MousePointerClick size={14} /> Chamada para Ação</h4>
                            <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-2 block">Texto do Botão Flutuante</label>
                                <input type="text" className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold text-neutral-900 placeholder-neutral-400 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm" placeholder={activePreview.layout.ctaLabel} value={customization.ctaLabel || ''} onChange={(e) => setCustomization(prev => ({ ...prev, ctaLabel: e.target.value }))} />
                            </div>
                        </section>
                        <div className="h-10"></div>
                    </div>
                </div>
{/* Direita: Live Preview Imersivo (Sandbox) */ }
<div className="flex-1 bg-neutral-900/5 md:bg-transparent overflow-y-auto md:p-8 flex items-center justify-center relative">

    {/* Bg decorativo do preview */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-20" style={{ backgroundColor: activePrimaryColor }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-10" style={{ backgroundColor: activePreview.colors.surface }} />
    </div>

    <div className="w-full max-w-[420px] md:scale-[0.9] lg:scale-[1.1] md:h-auto h-full flex flex-col relative z-10 shadow-2xl md:rounded-[40px] overflow-hidden md:border-8 border-neutral-900 bg-white">

        {/* Notch Mobile Fake na Navbar Desktop */}
        <div className="hidden md:block absolute top-0 inset-x-0 h-7 bg-neutral-900 z-50 rounded-b-3xl w-40 mx-auto"></div>

        {/* O TTDDT Wrapper que injeta CSS Variables no Scopo Real do iframe-fake */}
        <div
            className="w-full h-full md:h-[800px] flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide relative bg-white pb-24 md:pb-0"
            style={previewCSSVars as any}
        >
            <div
                className="w-full min-h-full bg-white transition-colors duration-500 relative"
                style={{ backgroundColor: 'var(--theme-background, #fafafa)' }}
            >
                {/* Capa */}
                <div className="h-56 relative w-full">
                    <img src={activePreview.thumbnail} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-6 bottom-6 flex justify-between items-end">
                        <div>
                            <span className="bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shadow-sm">
                                {userType === 'provider' ? 'Serviços' : 'Loja'}
                            </span>
                            <h1
                                className="text-3xl font-black drop-shadow-md text-white mt-1 leading-tight tracking-tight transition-all duration-300"
                                style={{ fontFamily: 'var(--theme-font-heading)' }}
                            >
                                Minha Marca<br />Incrível
                            </h1>
                        </div>
                        <div className="w-16 h-16 rounded-full border-2 border-white shadow-xl bg-white overflow-hidden shrink-0">
                            <img src={`https://picsum.photos/seed/${user?.id || '2'}/100/100`} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-8 relative z-10">
                    {/* Card Principal */}
                    <div
                        className="rounded-[24px] p-6 shadow-xl transition-all duration-500 border border-black/5"
                        style={{ backgroundColor: 'var(--theme-surface, #fff)' }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: 'var(--theme-primary, #f97316)' }} />
                            <h3 style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }} className="font-black text-xl">
                                Bem-vindo(a)!
                            </h3>
                        </div>
                        <p
                            className="text-sm font-medium leading-relaxed transition-all duration-500"
                            style={{ color: 'var(--theme-text, #171717)', opacity: 0.8, fontFamily: 'var(--theme-font-body)' }}
                        >
                            Esta área simula perfeitamente como sua vitrine reagirá. Suas cores, sua tipografia. Uma vitrine premium, montada com o motor de performance TTDDT.
                        </p>

                        <button
                            className="w-full mt-6 py-4 rounded-2xl text-white font-black flex items-center justify-center gap-2 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            style={{ backgroundColor: 'var(--theme-primary, #f97316)' }}
                        >
                            <Sparkles size={18} />
                            {customization.ctaLabel || activePreview.layout.ctaLabel}
                        </button>
                    </div>

                    {/* Grid Secundário */}
                    <div>
                        <h3 style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }} className="font-black text-lg mb-4 ml-2">Destaques</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className="rounded-[24px] p-3 shadow-lg border border-black/5 transition-all hover:-translate-y-1"
                                style={{ backgroundColor: 'var(--theme-surface, #fff)' }}
                            >
                                <div className="h-32 rounded-xl bg-neutral-100 mb-3 overflow-hidden relative">
                                    <img src="https://picsum.photos/seed/a/200/200" className="w-full h-full object-cover" />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[8px] font-black" style={{ color: 'var(--theme-primary)' }}>NEW</div>
                                </div>
                                <h5 style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }} className="font-bold text-sm tracking-tight mb-1 truncate">Produto Elite</h5>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-black" style={{ color: 'var(--theme-primary)' }}>R$ 149,90</span>
                                    <button className="w-6 h-6 rounded-full flex justify-center items-center bg-black/5 text-black/50 hover:bg-black/10 transition-colors">+</button>
                                </div>
                            </div>

                            <div
                                className="rounded-[24px] p-3 shadow-lg border border-black/5 transition-all hover:-translate-y-1"
                                style={{ backgroundColor: 'var(--theme-surface, #fff)' }}
                            >
                                <div className="h-32 rounded-xl bg-neutral-100 mb-3 overflow-hidden relative">
                                    <img src="https://picsum.photos/seed/b/200/200" className="w-full h-full object-cover filter grayscale" />
                                </div>
                                <h5 style={{ color: 'var(--theme-text)', fontFamily: 'var(--theme-font-heading)' }} className="font-bold text-sm tracking-tight mb-1 truncate">Serviço Premium</h5>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-black" style={{ color: 'var(--theme-primary)' }}>R$ 299,00</span>
                                    <button className="w-6 h-6 rounded-full flex justify-center items-center bg-black/5 text-black/50 hover:bg-black/10 transition-colors">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{/* Editor Mobile Toggler - Sobreposto na parte de baixo se for celular */ }
<div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t rounded-t-[32px] p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] z-40">
    <h4 className="font-black text-center text-sm mb-4 tracking-widest uppercase text-neutral-400">Personalizar Cor</h4>
    <div className="flex items-center justify-center gap-6">
        {[
            { label: 'Primária', key: 'primary' as const, fallback: activePreview.colors.primary },
            { label: 'Fundo', key: 'background' as const, fallback: activePreview.colors.background },
        ].map(({ label, key, fallback }) => (
            <div key={key} className="flex flex-col items-center gap-2">
                <div className="relative group">
                    <div className="w-12 h-12 rounded-full shadow-inner cursor-pointer overflow-hidden border-2 border-white ring-2 ring-neutral-200" style={{ backgroundColor: customization.colors?.[key] || fallback }}>
                        <input
                            type="color"
                            value={customization.colors?.[key] || fallback}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="opacity-0 w-[200%] h-[200%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        />
                    </div>
                </div>
                <span className="text-[10px] font-bold text-neutral-500 text-center">{label}</span>
            </div>
        ))}
        <div className="bg-neutral-100 rounded-xl p-3 text-xs font-bold text-neutral-500 text-center flex items-center">
            Para fontes, abra no Desktop.
        </div>
    </div>
</div>
                        </div >
                    </motion.div >
                )}
            </AnimatePresence >
        </div >
    );
};
