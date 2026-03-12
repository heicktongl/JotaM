import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { withRetry } from '../utils/network';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    useEffect(() => {
        // Pegar sessão atual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({ user: session?.user ?? null, session, loading: false });
        });

        // Escutar mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({ user: session?.user ?? null, session, loading: false });
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            return await withRetry(() => supabase.auth.signInWithPassword({ email, password }));
        } catch (error: any) {
            return { data: { user: null, session: null }, error };
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            return await withRetry(() => supabase.auth.signUp({
                email,
                password,
                options: { data: { name } },
            }));
        } catch (error: any) {
            return { data: { user: null, session: null }, error };
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return { ...state, signIn, signUp, signOut };
}
