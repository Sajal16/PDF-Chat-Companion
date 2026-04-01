import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? "User",
        });
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? "User",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    // Explicitly define the absolute local URL instead of window.location.origin
    // Change exactly to whichever port Vite runs on (e.g. 5173 or 8080)
    const localUrl = "http://116.202.210.102:10055"; 
    
    console.log("Redirecting to: ", localUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: localUrl
      }
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, login, loginWithGoogle, signup, logout, isAuthenticated: !!user, loading };
}
