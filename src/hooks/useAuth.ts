import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (ADMIN_EMAIL && email !== ADMIN_EMAIL) {
      throw new Error('관리자 이메일이 아닙니다.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw new Error(signUpError.message);
        const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
        if (retryError) throw new Error(retryError.message);
      } else {
        throw new Error(error.message);
      }
    }
  };

  const signOut = () => supabase.auth.signOut();

  const isAdmin = !!user && (!ADMIN_EMAIL || user.email === ADMIN_EMAIL);

  return { user, isAdmin, loading, signIn, signOut };
}
