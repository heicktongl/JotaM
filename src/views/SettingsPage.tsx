import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, LogOut, Loader2, ShieldCheck, Mail, Phone, Hash, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { AvatarUploader } from '../components/AvatarUploader';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Como é só visual pra próxima feature de "Edit Profile", deixaremos states preparados
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email] = useState(user?.email || '');
  const [phone] = useState(user?.user_metadata?.phone || '');
  const [cpf] = useState(user?.user_metadata?.cpf || '');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const handleAvatarUpdate = async (newUrl: string | null) => {
    if (!user) return;
    try {
      setIsUpdatingUser(true);
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl }
      });
      if (error) throw error;
      // Sessão já é atualizada no auth listener no useAuth, refletirá em todo app.
    } catch (err) {
      console.error('Erro ao atualizar URL no auth.users:', err);
    } finally {
      setIsUpdatingUser(false);
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

        {/* Formulário Dados Pessoais (Read Only Visual Block) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Dados Pessoais
            </h2>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              Edição em breve
            </span>
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
                  readOnly
                  className="w-full rounded-2xl bg-neutral-50 border border-neutral-100 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none transition-all opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full rounded-2xl bg-neutral-50 border border-neutral-100 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none transition-all opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Input Telefone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2">
                  Celular
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="text"
                    value={phone || 'Não informado'}
                    readOnly
                    className="w-full rounded-2xl bg-neutral-50 border border-neutral-100 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none transition-all opacity-80 cursor-not-allowed"
                  />
                </div>
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
                    value={cpf || 'Não informado'}
                    readOnly
                    className="w-full rounded-2xl bg-neutral-50 border border-neutral-100 py-3.5 pl-12 pr-4 text-sm font-bold text-neutral-900 focus:outline-none transition-all opacity-80 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};
