import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../core/supabaseClient';
import posthog from '../core/analytics';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (!error && data) {
            setProfile(data);
            // Identify user in PostHog for analytics
            posthog.identify(userId, {
                email: data.email,
                nombre: data.nombre_display,
                rol: data.rol,
                tipo_invitacion: data.tipo_invitacion,
            });
        }
    };

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data, error }) => {
            const session = data?.session;
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                posthog.reset();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        posthog.reset();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
