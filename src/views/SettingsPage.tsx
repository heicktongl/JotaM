import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, ShieldCheck, Mail, Phone, Hash, User, Save, MessageCircle, CheckCircle2, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AvatarUploader } from '../components/AvatarUploader';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { mode, toggle } = useTheme();

  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email] = useState(user?.email || '');
  const [whatsapp, setWhatsapp] = useState(
    user?.user_metadata?.whatsapp
      ? formatPhoneDisplay(user.user_metadata.whatsapp)
      : ''
  );
  const [cpf, setCpf] = useState(
    user?.user_metadata?.cpf
      ? formatCpfDisplay(user.user_metadata.cpf)
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Re-sincroniza os campos sempre que o user mudar (ex: após updateUser disparar onAuthStateChange)
  useEffect(() => {
    if (!user) return;
    setName(user.user_metadata?.name || '');
    setWhatsapp(
      user.user_metadata?.whatsapp
        ? formatPhoneDisplay(user.user_metadata.whatsapp)
        : ''
    );
    setCpf(
      user.user_metadata?.cpf
        ? formatCpfDisplay(user.user_metadata.cpf)
        : ''
    );
  }, [user]);

  // Formata telefone a partir de dígitos puros (para exibir dados vindos do banco)
  function formatPhoneDisplay(digits: string): string {
    const d = digits.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  // Formata CPF a partir de dígitos puros (para exibir dados vindos do banco)
  function formatCpfDisplay(digits: string): string {
    const d = digits.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  // Máscara de telefone: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => formatPhoneDisplay(value);

  // Máscara de CPF: XXX.XXX.XXX-XX
  const formatCpf = (value: string) => formatCpfDisplay(value);

  const handleAvatarUpdate = async (newUrl: string | null) => {
    if (!user) return;
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar URL no auth.users:', err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { data: updated, error } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          phone: whatsapp.replace(/\D/g, ''),
          whatsapp: whatsapp.replace(/\D/g, ''),
          cpf: cpf.replace(/\D/g, ''),
        }
      });

      if (error) throw error;

      // Sincroniza imediatamente os estados locais com os dados recém-salvos
      if (updated?.user?.user_metadata) {
        const meta = updated.user.user_metadata;
        setName(meta.name || '');
        setWhatsapp(meta.whatsapp ? formatPhoneDisplay(meta.whatsapp) : '');
        setCpf(meta.cpf ? formatCpfDisplay(meta.cpf) : '');
      }

      // Sincroniza telefones nos perfis públicos (ignora erros de não existir)
      await supabase.from('service_providers').update({
        phone: whatsapp.replace(/\D/g, ''),
        whatsapp: whatsapp.replace(/\D/g, '')
      }).eq('user_id', user.id);

      await supabase.from('sellers').update({
        whatsapp: whatsapp.replace(/\D/g, '')
      }).eq('user_id', user.id);

      setSaveSuccess(true);

      const pendingPublish = sessionStorage.getItem('jotam_pending_publish');
      if (pendingPublish) {
        sessionStorage.removeItem('jotam_pending_publish');
        // Redireciona de volta após um pequeno delay para mostrar a mensagem de sucesso
        setTimeout(() => navigate(pendingPublish), 1500);
      } else {
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar dados pessoais:', err);
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">

      {/* Toast de sucesso */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-neutral-900/30 pointer-events-none"
          >
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-bold whitespace-nowrap">Dados salvos com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100 pt-8 pb-4 px-6">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
              Minha Conta
            </h1>
          </div>

          {/* Toggle de tema — cicla entre system → dark → light */}
          <button
            onClick={toggle}
            title={mode === 'system' ? 'Modo do sistema' : mode === 'dark' ? 'Modo escuro' : 'Modo claro'}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-all hover:bg-neutral-200 hover:scale-105 active:scale-95"
          >
            {mode === 'dark' ? (
              <Moon size={18} className="text-indigo-500" />
            ) : mode === 'light' ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Monitor size={18} className="text-neutral-500" />
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8 space-y-8">

        {/* Seção Avatar (Em Destaque) */}
        <section className="flex flex-col items-center bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-orange-400 to-rose-500 opacity-20 -z-0" />

          <div className="relative z-10 mb-4 mt-8">
            <AvatarUploader
              currentUrl={user.user_metadata?.avatar_url || null}
              fallbackUrl={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=ea580c`}
              onUploadSuccess={handleAvatarUpdate}
              uid={user.id}
              folder="users"
              size="lg"
            />
          </div>

          <h2 className="text-xl font-black text-neutral-900 z-10">{name || 'Usuário JotaM'}</h2>
          <p className="text-sm font-bold text-neutral-400 z-10 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            Conta Verificada
          </p>
        </section>

        {/* Formulário Dados Pessoais (Editável) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Dados Pessoais
            </h2>
            {saveSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
                ✓ Salvo com sucesso
              </span>
            )}
          </div>

          <div className="bg-white rounded-[2rem] p-6 space-y-5 shadow-sm border border-neutral-100">
            {/* Input Nome */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2">
                Nome de Exibição
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Input Email (somente leitura - vinculado ao login) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                E-mail
                <span className="text-[9px] font-bold text-neutral-300 bg-neutral-100 px-1.5 py-0.5 rounded">vinculado ao login</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-2xl bg-neutral-50 border border-neutral-100 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none transition-all opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Input WhatsApp */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                <MessageCircle size={12} className="text-emerald-500" />
                WhatsApp
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  placeholder="(XX) XXXXX-XXXX"
                  className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
              <p className="text-[11px] text-neutral-400 pl-2">Usado para contato direto por clientes e confirmações de serviço.</p>
            </div>

            {/* Input CPF */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2">
                CPF
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Hash size={18} />
                </div>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full rounded-2xl bg-neutral-50 border border-neutral-200 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Botão Salvar */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none mt-2"
            >
              {isSaving ? (
                <><Loader2 size={18} className="animate-spin" /> Salvando...</>
              ) : (
                <><Save size={18} /> Salvar Alterações</>
              )}
            </button>
          </div>
        </section>

        {/* Sair da conta */}
        <section className="mx-auto max-w-2xl px-6 pb-10">
          <div className="border-t border-neutral-100 pt-6">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-bold text-red-500 hover:bg-red-100 hover:border-red-200 transition-all active:scale-[0.98]"
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};
