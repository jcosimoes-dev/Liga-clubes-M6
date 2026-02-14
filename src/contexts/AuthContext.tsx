import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Player } from '../lib/database.types';

interface AuthContextType {
  user: User | null;
  player: Player | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone: string, preferredSide?: string, federationPoints?: number) => Promise<{ error: AuthError | null; user?: User }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshPlayer: () => Promise<void>;
  isCaptain: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  canManageTeam: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadPlayer(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadPlayer(session.user.id);
        } else {
          setPlayer(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPlayer = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setPlayer(data);
    } catch (error) {
      console.error('Error loading player:', error);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string, preferredSide?: string, federationPoints?: number) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: new Error('User creation failed') as AuthError };

      const { error: playerError } = await supabase
        .from('players')
        .insert({
          user_id: authData.user.id,
          name,
          email,
          phone,
          preferred_side: preferredSide || 'both',
          federation_points: federationPoints || 0,
          is_active: true,
          role: 'jogador',
          team_id: '00000000-0000-0000-0000-000000000001',
        });

      if (playerError) {
        console.error('Error creating player profile:', playerError);
        return { error: playerError as unknown as AuthError, user: authData.user };
      }

      await loadPlayer(authData.user.id);

      return { error: null, user: authData.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setPlayer(null);
      setSession(null);
    }
    return { error };
  };

  const refreshPlayer = async () => {
    if (user?.id) {
      await loadPlayer(user.id);
    }
  };

  const value = {
    user,
    player,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshPlayer,
    isCaptain: player?.role === 'capitao',
    isAdmin: player?.role === 'admin',
    isCoordinator: player?.role === 'coordenador',
    canManageTeam: player?.role === 'admin' || player?.role === 'capitao',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
