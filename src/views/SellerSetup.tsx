import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Store, AtSign, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const SellerSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [storeName, setStoreName] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [error, setError] = useState('');

    // Verifica se o usuário já é vendedor
    useEffect(() => {
        if (authLoading) return; // Espera o auth carregar

        const checkExistingSeller = async () => {
            if (!user) {
                navigate(-1); // Volta pra página anterior, sem mandar pro login
                return;
            }

            const { data } = await supabase
                .from('sellers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                // Já tem loja, manda direto pro painel
                navigate('/admin/products');
            } else {
                setIsChecking(false);
            }
        };

        checkExistingSeller();
    }, [user, authLoading, navigate]);

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsLoading(true);
        setError('');

        // Validação básica do arroba
        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

        if (cleanUsername.length < 3) {
            setError('O nome de usuário deve ter pelo menos 3 caracteres.');
            setIsLoading(false);
            return;
        }

        try {
            // Tenta criar a loja (o username tem constraint de UNIQUE no banco)
            const { error: insertError } = await supabase
                .from('sellers')
                .insert({
                    user_id: user.id,
                    store_name: storeName.trim(),
                    username: cleanUsername,
                });

            if (insertError) {
                if (insertError.code === '23505') { // Postgres unique_violation error code
                    setError('Esse nome de usuário já está em uso por outra loja.');
                } else {
                    setError(insertError.message);
                }
                setIsLoading(false);
                return;
            }

            // Tudo certo!
            navigate('/admin/products');

        } catch (err: any) {
            setError('Ocorreu um erro ao criar a loja.');
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col p-6">
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

                <form onSubmit={handleCreateStore} className="space-y-4">
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

                    <button
                        type="submit"
                        disabled={isLoading || !storeName || !username}
                        className="w-full flex h-14 items-center justify-center rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-8"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Abrir minha Loja'}
                    </button>
                </form>
            </main>
        </div>
    );
};
