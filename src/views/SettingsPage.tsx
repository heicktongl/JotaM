import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, ShieldCheck, Mail, Phone, Hash, User, Save, MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AvatarUploader } from '../components/AvatarUploader';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email] = useState(user?.email || '');
  const [whatsapp, setWhatsapp] = useState(user?.user_metadata?.whatsapp || '');
  const [cpf, setCpf] = useState(user?.user_metadata?.cpf || '');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Máscara de telefone: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Máscara de CPF: XXX.XXX.XXX-XX
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleAvatarUpdate = async (newUrl: string | null) => {
    if (!user) return;
    try {
      setIsUpdatingUser(true);
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar URL no auth.users:', err);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          phone: whatsapp.replace(/\D/g, ''),
          whatsapp: whatsapp.replace(/\D/g, ''),
          cpf: cpf.replace(/\D/g, ''),
        }
      });

      if (error) throw error;

      // Sincroniza telefones nos perfis públicos (ignora erros de não existir)
      await supabase.from('service_providers').update({
        phone: whatsapp.replace(/\D/g, ''),
        whatsapp: whatsapp.replace(/\D/g, '')
      }).eq('user_id', user.id);

      await supabase.from('sellers').update({
        whatsapp: whatsapp.replace(/\D/g, '')
      }).eq('user_id', user.id);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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
          <button
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            title="Sair"
          >
            <LogOut size={18} />
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
              size="lg"
            />
            {isUpdatingUser && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow border border-neutral-100 flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-orange-500" />
                <span className="text-[10px] font-bold text-neutral-500">Salvando...</span>
              </div>
            )}
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

      </main>
    </div>
  );
};
