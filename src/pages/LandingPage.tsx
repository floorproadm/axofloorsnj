import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Users, DollarSign, ArrowRight, Languages } from "lucide-react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";

const BG = "#0B1120";
const BLUE = "#0066FF";

const COPY = {
  en: {
    login: "Log in",
    heroTitle1: "The Operating System for ",
    heroTitle2: "Flooring Contractors",
    heroSub:
      "Stop running your business on messages and spreadsheets. FloorPRO gives you leads, projects, proposals, payroll and your team — in one place.",
    ctaPrimary: "Get Early Access",
    ctaSecondary: "See how it works",
    socialProof: "Built by a flooring contractor. Used by AXO Floors NJ.",
    painTitle: "Sound familiar?",
    pains: [
      "I close maybe 20% of my quotes — the rest just disappear.",
      "I can't track my crew or know if a job is profitable until it's done.",
      "I work 60 hours a week but still feel like I'm losing money somewhere.",
    ],
    featuresTitle: "Everything your flooring business needs",
    featuresSub:
      "Built specifically for installation and refinishing companies — not generic trades.",
    features: [
      { title: "Lead Pipeline", desc: "Capture, track and convert leads with a pipeline built for flooring." },
      { title: "Smart Proposals", desc: "Send Good/Better/Best quotes in minutes. Clients sign online — no printing, no chasing." },
      { title: "Project Management", desc: "Every job, every photo, every cost in one place. Know your margin before you start." },
      { title: "Labor & Payroll", desc: "Daily rate or sqft production — track, approve and pay your crew the flooring way." },
      { title: "Client & Partner Portals", desc: "Your clients see their project live. Your partners track referrals and commissions." },
      { title: "Bilingual (EN/PT)", desc: "Built for Brazilian flooring contractors in the US — full English and Portuguese support." },
    ],
    quote:
      '"We built FloorPRO because we needed it ourselves. AXO Floors runs entirely on this platform — every lead, every project, every paycheck."',
    quoteAuthor: "— Eduardo Oliveira, Founder · AXO Floors NJ",
    waitlistTitle: "Get early access",
    waitlistSub:
      "We're onboarding flooring companies one by one. No credit card. No commitment.",
    fName: "Full name *",
    fCompany: "Company name *",
    fEmail: "Email *",
    fPhone: "Phone",
    fState: "State *",
    fStatePh: "Select state",
    fTeam: "How many people on your team? *",
    fTeamPh: "Select team size",
    teamOptions: ["Just me", "2-5", "6-15", "16+"],
    submit: "Request Early Access",
    submitting: "Submitting...",
    fillAll: "Please fill all required fields",
    errorTitle: "Something went wrong",
    successTitle: "You're on the list.",
    successSub: "We'll be in touch soon.",
    footerL: "FloorPRO · Built for flooring contractors",
    footerR: "© 2025 FloorPRO. All rights reserved.",
    footerLink: "Login",
  },
  pt: {
    login: "Entrar",
    heroTitle1: "O Sistema Operacional para ",
    heroTitle2: "Empresas de Piso",
    heroSub:
      "Pare de tocar a empresa em mensagens e planilhas. O FloorPRO te dá leads, projetos, propostas, folha de pagamento e sua equipe — em um só lugar.",
    ctaPrimary: "Quero Acesso Antecipado",
    ctaSecondary: "Veja como funciona",
    socialProof: "Feito por um contratante de piso. Usado pela AXO Floors NJ.",
    painTitle: "Familiar?",
    pains: [
      "Eu fecho talvez 20% dos meus orçamentos — o resto simplesmente some.",
      "Não consigo acompanhar minha equipe nem saber se um job é lucrativo até terminar.",
      "Trabalho 60 horas por semana e ainda sinto que estou perdendo dinheiro em algum lugar.",
    ],
    featuresTitle: "Tudo o que sua empresa de piso precisa",
    featuresSub:
      "Construído especificamente para instalação e refinishing — não para qualquer ramo.",
    features: [
      { title: "Pipeline de Leads", desc: "Capture, acompanhe e converta leads com um pipeline feito para piso." },
      { title: "Propostas Inteligentes", desc: "Envie orçamentos Good/Better/Best em minutos. Cliente assina online — sem imprimir, sem cobrar." },
      { title: "Gestão de Projetos", desc: "Cada job, cada foto, cada custo em um só lugar. Saiba sua margem antes de começar." },
      { title: "Folha & Mão de Obra", desc: "Diária ou por sqft — registre, aprove e pague sua equipe do jeito do piso." },
      { title: "Portais de Cliente & Parceiro", desc: "Seus clientes acompanham o projeto ao vivo. Seus parceiros veem referrals e comissões." },
      { title: "Bilíngue (EN/PT)", desc: "Feito para contratantes brasileiros nos EUA — suporte completo em inglês e português." },
    ],
    quote:
      '"Construímos o FloorPRO porque nós mesmos precisávamos. A AXO Floors roda inteira nessa plataforma — cada lead, cada projeto, cada pagamento."',
    quoteAuthor: "— Eduardo Oliveira, Founder · AXO Floors NJ",
    waitlistTitle: "Acesso antecipado",
    waitlistSub:
      "Estamos onboarding empresas de piso uma a uma. Sem cartão de crédito. Sem compromisso.",
    fName: "Nome completo *",
    fCompany: "Nome da empresa *",
    fEmail: "Email *",
    fPhone: "Telefone",
    fState: "Estado *",
    fStatePh: "Selecione o estado",
    fTeam: "Quantas pessoas no seu time? *",
    fTeamPh: "Selecione o tamanho do time",
    teamOptions: ["Só eu", "2-5", "6-15", "16+"],
    submit: "Solicitar Acesso",
    submitting: "Enviando...",
    fillAll: "Preencha todos os campos obrigatórios",
    errorTitle: "Algo deu errado",
    successTitle: "Você está na lista.",
    successSub: "Entraremos em contato em breve.",
    footerL: "FloorPRO · Feito para empresas de piso",
    footerR: "© 2025 FloorPRO. Todos os direitos reservados.",
    footerLink: "Entrar",
  },
} as const;

const PAIN_ICONS = [Clock, Users, DollarSign];

export default function LandingPage() {
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();
  const t = COPY[language];
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
      toast({ title: t.fillAll, variant: "destructive" });
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
      toast({ title: t.errorTitle, description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
  };

  const toggleLang = () => setLanguage(language === "en" ? "pt" : "en");

  return (
    <div style={{ background: BG }} className="min-h-screen text-white">
      {/* NAV */}
      <header
        className="sticky top-0 z-50 backdrop-blur"
        style={{ background: `${BG}cc`, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">
            Floor<span style={{ color: BLUE }}>PRO</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition"
              aria-label="Toggle language"
            >
              <Languages className="w-4 h-4" />
              <span className="tabular-nums">
                <span className={language === "en" ? "text-white" : "text-white/40"}>EN</span>
                <span className="text-white/30 mx-1">/</span>
                <span className={language === "pt" ? "text-white" : "text-white/40"}>PT</span>
              </span>
            </button>
            <Link to="/admin/auth">
              <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                {t.login}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            {t.heroTitle1}
            <span style={{ color: BLUE }}>{t.heroTitle2}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">{t.heroSub}</p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => scrollTo("waitlist")}
              style={{ background: BLUE }}
              className="text-white hover:opacity-90 h-12 px-8 text-base"
            >
              {t.ctaPrimary}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => scrollTo("features")}
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-8 text-base"
            >
              {t.ctaSecondary}
            </Button>
          </div>
          <p className="mt-8 text-sm text-white/50">{t.socialProof}</p>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="px-6 py-20" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t.painTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t.pains.map((text, i) => {
              const Icon = PAIN_ICONS[i];
              return (
                <div
                  key={i}
                  className="p-8 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                    style={{ background: `${BLUE}22`, color: BLUE }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-lg text-white/85 leading-relaxed">"{text}"</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">{t.featuresTitle}</h2>
            <p className="mt-4 text-white/60 text-lg">{t.featuresSub}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.map((f, i) => (
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
            {t.quote}
          </blockquote>
          <p className="mt-6 text-white/60">{t.quoteAuthor}</p>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="px-6 py-24">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold">{t.waitlistTitle}</h2>
            <p className="mt-4 text-white/60">{t.waitlistSub}</p>
          </div>

          {submitted ? (
            <div
              className="p-8 rounded-xl text-center"
              style={{ background: `${BLUE}15`, border: `1px solid ${BLUE}55` }}
            >
              <p className="text-xl font-semibold">{t.successTitle}</p>
              <p className="mt-2 text-white/70">{t.successSub}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6 md:p-8 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Field label={t.fName}>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label={t.fCompany}>
                <Input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label={t.fEmail}>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label={t.fPhone}>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </Field>
              <Field label={t.fState}>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder={t.fStatePh} />
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
              <Field label={t.fTeam}>
                <Select value={form.team} onValueChange={(v) => setForm({ ...form, team: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder={t.fTeamPh} />
                  </SelectTrigger>
                  <SelectContent>
                    {t.teamOptions.map((s) => (
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
                {submitting ? t.submitting : t.submit}
                {!submitting && <ArrowRight className="ml-1 w-4 h-4" />}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div>{t.footerL}</div>
          <div>{t.footerR}</div>
          <Link to="/admin/auth" className="hover:text-white">
            {t.footerLink}
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
