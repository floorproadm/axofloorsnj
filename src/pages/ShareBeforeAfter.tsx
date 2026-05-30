import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BeforeAfterSlider } from "@/components/admin/projects/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Pair {
  id: string;
  title: string;
  before_url: string;
  after_url: string;
  completed_date: string | null;
  created_at: string;
}

export default function ShareBeforeAfter() {
  const { token } = useParams<{ token: string }>();
  const [pair, setPair] = useState<Pair | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    (async () => {
      if (!token) return setStatus("missing");
      const { data, error } = await supabase.rpc("get_shared_before_after" as any, {
        p_token: token,
      });
      if (error || !data) return setStatus("missing");
      setPair(data as any);
      setStatus("ok");
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold tracking-tight text-lg">
            AXO <span className="text-primary">FLOORS</span>
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link to="/schedule-estimate">Get a quote</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
        )}
        {status === "missing" && (
          <p className="text-sm text-muted-foreground text-center py-12">
            This comparison is no longer available.
          </p>
        )}
        {status === "ok" && pair && (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{pair.title}</h1>
              {pair.completed_date && (
                <p className="text-sm text-muted-foreground tabular-nums">
                  Completed {format(new Date(pair.completed_date), "MMMM d, yyyy")}
                </p>
              )}
            </div>
            <BeforeAfterSlider beforeUrl={pair.before_url} afterUrl={pair.after_url} />
            <div className="rounded-lg border bg-card p-5 text-center space-y-3">
              <p className="font-semibold">Want results like this on your floors?</p>
              <p className="text-sm text-muted-foreground">
                Free estimate, transparent pricing, lifetime craftsmanship.
              </p>
              <Button asChild>
                <Link to="/schedule-estimate">Schedule a free estimate</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
