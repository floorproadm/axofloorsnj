import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePlatformAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user?.id) {
      setIsPlatformAdmin(false);
      setIsLoading(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "platform_admin" as any })
      .then(({ data, error }) => {
        if (cancelled) return;
        setIsPlatformAdmin(!error && data === true);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  return { isPlatformAdmin, isLoading };
}
