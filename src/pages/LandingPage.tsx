import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Users, DollarSign, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

const FEATURES = [
  {
    title: "Lead Pipeline",
    desc: "Capture, track and convert leads with a pipeline built for flooring.",
  },
  {
    title: "Smart Proposals",
    desc: "Send Good/Better/Best quotes in minutes. Clients sign online — no printing, no chasing.",
  },
  {
    title: "Project Management",
    desc: "Every job, every photo, every cost in one place. Know your margin before you start.",
  },
  {
    title: "Labor & Payroll",
    desc: "Daily rate or sqft production — track, approve and pay your crew the flooring way.",
  },
  {
    title: "Client & Partner Portals",
    desc: "Your clients see their project live. Your partners track referrals and commissions.",
  },
  {
    title: "Bilingual (EN/PT)",
    desc: "Built for Brazilian flooring contractors in the US — full English and Portuguese support.",
  },
];

const PAINS = [
  {
    icon: Clock,
    text: "I close maybe 20% of my quotes — the rest just disappear.",
  },
  {
    icon: Users,
    text: "I can't track my crew or know if a job is profitable until it's done.",
  },
  {
    icon: DollarSign,
    text: "I work 60 hours a week but still feel like I'm losing money somewhere.",
  },
];

const BG = "#0B1120";
const BLUE = "#0066FF";

export default function LandingPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    state: "",
    team: "",
  });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.company || !form.email || !form.state || !form.team) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      email: form.email,
      phone: form.phone || "n/a",
      city: form.state,
      lead_source: "floorpro_waitlist",
      status: "cold_lead",
      priority: "high",
      notes: `Company: ${form.company} | Team: ${form.team}`,
      organization_id: AXO_ORG_ID,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  return (
    <div style={{ background: BG }} className="min-h-screen text-white">
      {/* NAV */}
      <header className="sticky top-0 z-50 backdrop-blur" style={{ background: `${BG}cc`, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">
            Floor<span style={{ color: BLUE }}>PRO</span>
          </div>
          <Link to="/admin/auth">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            The Operating System for{" "}
            <span style={{ color: BLUE }}>Flooring Contractors</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Stop running your business on WhatsApp and spreadsheets. FloorPRO gives you leads, projects, proposals, payroll and your team — in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => scrollTo("waitlist")}
              style={{ background: BLUE }}
              className="text-white hover:opacity-90 h-12 px-8 text-base"
            >
              Get Early Access
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo("features")}
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-8 text-base"
            >
              See how it works
            </Button>
          </div>
          <p className="mt-8 text-sm text-white/50">
            Built by a flooring contractor. Used by AXO Floors NJ.
          </p>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="px-6 py-20" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Sound familiar?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PAINS.map((p, i) => (
              <div
                key={i}
                className="p-8 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                  style={{ background: `${BLUE}22`, color: BLUE }}
                >
                  <p.icon className="w-6 h-6" />
                </div>
                <p className="text-lg text-white/85 leading-relaxed">"{p.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything your flooring business needs
            </h2>
            <p className="mt-4 text-white/60 text-lg">
              Built specifically for installation and refinishing companies — not generic trades.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-7 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-xs font-semibold mb-3" style={{ color: BLUE }}>
                  0{i + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-white/65 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="px-6 py-24" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl md:text-3xl font-medium leading-snug text-white/90">
            "We built FloorPRO because we needed it ourselves. AXO Floors runs entirely on this platform — every lead, every project, every paycheck."
          </blockquote>
          <p className="mt-6 text-white/60">
            — Eduardo Oliveira, Founder · AXO Floors NJ
          </p>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="px-6 py-24">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">Get early access</h2>
            <p className="mt-4 text-white/60">
              We're onboarding flooring companies one by one. No credit card. No commitment.
            </p>
          </div>

          {submitted ? (
            <div
              className="p-8 rounded-xl text-center"
              style={{ background: `${BLUE}15`, border: `1px solid ${BLUE}55` }}
            >
              <p className="text-xl font-semibold">You're on the list.</p>
              <p className="mt-2 text-white/70">We'll be in touch soon.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6 md:p-8 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Field label="Full name *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label="Company name *">
                <Input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label="Email *">
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label="Phone">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label="State *">
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {["NJ", "NY", "PA", "CT", "FL", "TX", "CA", "Other"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="How many people on your team? *">
                <Select value={form.team} onValueChange={(v) => setForm({ ...form, team: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Just me", "2-5", "6-15", "16+"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Button
                type="submit"
                disabled={submitting}
                style={{ background: BLUE }}
                className="w-full text-white hover:opacity-90 h-12 text-base mt-2"
              >
                {submitting ? "Submitting..." : "Request Early Access"}
                {!submitting && <ArrowRight className="ml-1 w-4 h-4" />}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-6 py-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div>FloorPRO · Built for flooring contractors</div>
          <div>© 2025 FloorPRO. All rights reserved.</div>
          <Link to="/admin/auth" className="hover:text-white">
            Login
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-white/80 text-sm">{label}</Label>
      {children}
    </div>
  );
}
