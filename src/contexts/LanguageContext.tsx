import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Language = "pt" | "en";

// Universal words that stay in English regardless of language
// These are industry terms familiar to Brazilian immigrants in the US
const UNIVERSAL_WORDS = [
  "Jobs", "Job", "Schedule", "Leads", "Lead", "Feed", "Dashboard",
  "Settings", "Performance", "Home", "Stats", "Pipeline", "Follow up",
  "Branding", "Marketing Gallery", "Labor Rate", "Sq Ft",
] as const;

const translations = {
  // Sidebar
  "sidebar.overview": { pt: "Overview", en: "Overview" },
  "sidebar.tools": { pt: "Ferramentas", en: "Tools" },
  "sidebar.manage": { pt: "Gerenciar", en: "Manage" },
  "sidebar.support": { pt: "Suporte", en: "Support" },
  "sidebar.catalogo": { pt: "Catálogo", en: "Catalog" },
  "sidebar.ajuda": { pt: "Ajuda", en: "Help" },
  "sidebar.captacao": { pt: "Captação", en: "Intake" },
  "sidebar.medicoes": { pt: "Medições", en: "Measurements" },
  "sidebar.propostas": { pt: "Propostas", en: "Proposals" },
  "sidebar.verSite": { pt: "Ver Site", en: "View Site" },
  "sidebar.sair": { pt: "Sair do Sistema", en: "Sign Out" },
  "sidebar.sistemaOperacional": { pt: "Sistema Operacional", en: "Operating System" },

  // Layout / Header
  "layout.notificacoes": { pt: "Notificações", en: "Notifications" },
  "layout.pendentes": { pt: "pendentes", en: "pending" },
  "layout.pendente": { pt: "pendente", en: "pending" },
  "layout.nenhumaNotificacao": { pt: "Nenhuma notificação 🎉", en: "No notifications 🎉" },
  "layout.leadSemContato24h": { pt: "Lead sem contato 24h", en: "Lead no contact 24h" },
  "layout.propostaSemFollowUp": { pt: "Proposta sem follow-up", en: "Proposal without follow-up" },
  "layout.parado48h": { pt: "Parado +48h", en: "Stalled +48h" },
  "layout.verTodosLeads": { pt: "Ver todos os leads →", en: "View all leads →" },
  "layout.sairDoSistema": { pt: "Sair do sistema", en: "Sign out" },

  // Dashboard
  "dashboard.goodMorning": { pt: "Bom dia", en: "Good morning" },
  "dashboard.goodAfternoon": { pt: "Boa tarde", en: "Good afternoon" },
  "dashboard.goodEvening": { pt: "Boa noite", en: "Good evening" },
  "dashboard.jobsHoje": { pt: "jobs hoje", en: "jobs today" },
  "dashboard.semJobsHoje": { pt: "Sem jobs agendados para hoje", en: "No jobs scheduled for today" },
  "dashboard.acaoPendente": { pt: "ação pendente", en: "pending action" },
  "dashboard.acoesPendentes": { pt: "ações pendentes", en: "pending actions" },
  "dashboard.semana": { pt: "Semana", en: "Week" },
  "dashboard.leadsAtivos": { pt: "leads ativos", en: "active leads" },
  "dashboard.amanha": { pt: "amanhã", en: "tomorrow" },
  "dashboard.semContato": { pt: "sem contato", en: "no contact" },
  "dashboard.acoesUrgentes": { pt: "Ações Urgentes", en: "Urgent Actions" },
  "dashboard.verTodos": { pt: "Ver todos", en: "View all" },
  "dashboard.agendaDeHoje": { pt: "Agenda de Hoje", en: "Today's Agenda" },
  "dashboard.verAgenda": { pt: "Ver agenda", en: "View schedule" },
  "dashboard.respostaLead": { pt: "Resposta Lead", en: "Lead Response" },
  "dashboard.leadParado48h": { pt: "Lead parado +48h", en: "Lead stalled +48h" },

  // Settings
  "settings.titulo": { pt: "Configurações", en: "Settings" },
  "settings.centroGovernanca": { pt: "Centro de Governança", en: "Governance Center" },
  "settings.parametrosGlobais": { pt: "Parâmetros globais, branding e equipe.", en: "Global parameters, branding and team." },
  "settings.geral": { pt: "Geral", en: "General" },
  "settings.geralDesc": { pt: "Razão social e regras de negócio", en: "Company name and business rules" },
  "settings.brandingDesc": { pt: "Logo, cores e identidade visual", en: "Logo, colors and visual identity" },
  "settings.equipe": { pt: "Equipe", en: "Team" },
  "settings.equipeDesc": { pt: "Usuários e permissões do sistema", en: "Users and system permissions" },
  "settings.galleryDesc": { pt: "Portfólio e assets visuais", en: "Portfolio and visual assets" },
  "settings.idioma": { pt: "Idioma", en: "Language" },
  "settings.idiomaDesc": { pt: "Idioma da interface administrativa", en: "Admin interface language" },

  // General Settings
  "general.identidade": { pt: "Identidade", en: "Identity" },
  "general.razaoSocial": { pt: "Razão Social", en: "Company Name" },
  "general.regrasNegocio": { pt: "Regras de Negócio", en: "Business Rules" },
  "general.regrasDesc": { pt: "Triggers e RPCs consultam estes valores antes de permitir transições no pipeline.", en: "Triggers and RPCs check these values before allowing pipeline transitions." },
  "general.margemMinima": { pt: "Margem Mínima Obrigatória (%)", en: "Minimum Required Margin (%)" },
  "general.margemDesc": { pt: "Nenhum projeto avança para Proposta com margem abaixo deste valor.", en: "No project advances to Proposal with margin below this value." },
  "general.modeloPrecificacao": { pt: "Modelo de Precificação", en: "Pricing Model" },
  "general.porSqFt": { pt: "Por Sq Ft", en: "Per Sq Ft" },
  "general.diaria": { pt: "Diária", en: "Daily" },
  "general.laborRatePadrao": { pt: "Labor Rate Padrão", en: "Default Labor Rate" },
  "general.salvarConfiguracoes": { pt: "Salvar Configurações", en: "Save Settings" },
  "general.ultimaAtualizacao": { pt: "Última atualização", en: "Last updated" },
  "general.erro": { pt: "Erro", en: "Error" },
  "general.margemErro": { pt: "Margem deve ser entre 0 e 100%", en: "Margin must be between 0 and 100%" },
  "general.laborRateErro": { pt: "Labor rate inválido", en: "Invalid labor rate" },
  "general.salvo": { pt: "✓ Salvo", en: "✓ Saved" },
  "general.salvoDesc": { pt: "Configurações atualizadas com sucesso.", en: "Settings updated successfully." },
  "general.erroSalvar": { pt: "Erro ao salvar", en: "Error saving" },
  "general.tenteNovamente": { pt: "Tente novamente", en: "Try again" },

  // Mobile Bottom Nav
  "mobile.criar": { pt: "Criar", en: "Create" },
  "mobile.novaTarefa": { pt: "Nova Tarefa", en: "New Task" },
  "mobile.novoJob": { pt: "Novo Job", en: "New Job" },
  "mobile.novoLead": { pt: "Novo Lead", en: "New Lead" },
  "mobile.novoOrcamento": { pt: "Novo Orçamento", en: "New Estimate" },
  "mobile.novaOrdem": { pt: "Nova Ordem", en: "New Order" },
  "mobile.novaDespesa": { pt: "Nova Despesa", en: "New Expense" },
  "mobile.novaFatura": { pt: "Nova Fatura", en: "New Invoice" },
  "mobile.novaFoto": { pt: "Nova Foto", en: "New Photo" },
  "mobile.criarNovo": { pt: "Criar novo", en: "Create new" },

  // Auth / Logout
  "auth.logoutRealizado": { pt: "Logout realizado", en: "Logged out" },
  "auth.logoutDesc": { pt: "Você foi desconectado com sucesso.", en: "You have been signed out successfully." },
  "auth.erroLogout": { pt: "Erro ao fazer logout", en: "Error signing out" },
  "auth.tenteNovamente": { pt: "Tente novamente.", en: "Please try again." },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "axo-admin-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "en" || stored === "pt") ? stored : "pt";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.pt;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
