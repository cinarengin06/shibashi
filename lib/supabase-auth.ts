"use client";

import { createClient, type User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseAuth =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

export function useShibashiAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabaseAuth) {
      setReady(true);
      return;
    }

    void supabaseAuth.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return useMemo(
    () => ({
      configured: Boolean(supabaseAuth),
      ready,
      signInWithGoogle: async () => {
        if (!supabaseAuth) {
          return { error: new Error("Supabase Auth yapılandırılmadı.") };
        }
        return supabaseAuth.auth.signInWithOAuth({
          options: {
            redirectTo: window.location.origin,
          },
          provider: "google",
        });
      },
      signOut: async () => {
        if (!supabaseAuth) return;
        await supabaseAuth.auth.signOut();
      },
      user,
    }),
    [ready, user],
  );
}
