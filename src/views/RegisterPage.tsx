import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setIsLoading(false);
            return;
        }

        const { data, error: signUpError } = await signUp(email, password, name);

        if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
            return;
        }

        if (data.user) {
            // Inserir perfil básico na tabela estendida users
            const { error: insertError } = await supabase.from('users').insert({
                id: data.user.id,
                email: email,
                name: name,
                role: 'consumer' // role padrao
            });

            if (insertError) {
                console.error('Erro ao criar perfil:', insertError);
            }

            navigate('/profile');
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 relative">
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100"
            >
                <ChevronLeft size={20} />
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm space-y-8"
            >
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <Logo variant="orange" className="mb-4" />
                    <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Criar Conta</h1>
                    <p className="text-sm text-neutral-500">Junte-se à nossa comunidade</p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-400">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome completo"
                                className="w-full rounded-2xl bg-white border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-400">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Seu email"
                                className="w-full rounded-2xl bg-white border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-neutral-400">
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Crie uma senha forte"
                                className="w-full rounded-2xl bg-white border border-neutral-200 py-4 pl-12 pr-4 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !name || !email || !password}
                        className="w-full flex h-14 items-center justify-center rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                    >
                        {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'Criar minha conta'}
                    </button>
                </form>

                <div className="flex flex-col gap-4 text-center mt-8">
                    <p className="text-sm font-bold text-neutral-500">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-orange-600 hover:text-orange-700 hover:underline">
                            Fazer Login
                        </Link>
                    </p>

                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-neutral-200"></div>
                        <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs font-bold uppercase tracking-widest">ou</span>
                        <div className="flex-grow border-t border-neutral-200"></div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        Continuar como visitante
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
