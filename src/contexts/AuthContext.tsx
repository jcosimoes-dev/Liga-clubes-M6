// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type PreferredSide =
  | "Jogador Esquerda"
  | "Jogador Direita"
  | "Ambos os Lados";

export interface Player {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  federation_points: number;
  preferred_side: PreferredSide;
  profile_completed: boolean;
  role?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  player: Player | null;
  loading: boolean;

  refreshPlayer: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchPlayerByUserId(userId: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Player | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPlayer = async (userId: string) => {
    try {
      setLoading(true);
      const p = await fetchPlayerByUserId(userId);
      setPlayer(p);
    } catch (err) {
      console.error("Erro ao carregar player:", err);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshPlayer = async () => {
    if (!user?.id) return;
    await loadPlayer(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setPlayer(null);
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();

        if (!isMounted) return;

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user?.id) {
          await loadPlayer(currentSession.user.id);
        } else {
          setPlayer(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro ao iniciar sessão:", err);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setPlayer(null);
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user?.id) {
          await loadPlayer(newSession.user.id);
        } else {
          setPlayer(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      player,
      loading,
      refreshPlayer,
      signOut,
    }),
    [user, session, player, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}