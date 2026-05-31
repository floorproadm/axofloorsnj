// Centralized config for the 5 business roles (+ legacy).
// Colors are explicit per request: admin=red, manager=orange, salesperson=blue,
// installer=green, accountant=purple.

export type AppRole =
  | "admin"
  | "manager"
  | "salesperson"
  | "installer"
  | "sander"
  | "sander_installer"
  | "accountant"
  | "moderator";

export interface RoleMeta {
  value: AppRole;
  label: string;
  short: string;
  description: string;
  access: string;
  // Tailwind classes for badge (bg + text + border)
  badgeClass: string;
  dotClass: string;
}

export const ROLE_META: Record<AppRole, RoleMeta> = {
  admin: {
    value: "admin",
    label: "Administrador",
    short: "Admin",
    description: "Controle total: usuários, configurações, financeiro, operação.",
    access: "Acesso total ao sistema.",
    badgeClass: "bg-red-500/15 text-red-400 border border-red-500/30",
    dotClass: "bg-red-500",
  },
  manager: {
    value: "manager",
    label: "Gerente",
    short: "Manager",
    description: "Visão completa de vendas, operação e financeiro (sem gestão de usuários).",
    access: "Leads, propostas, projetos, faturas, custos: total. Configurações: editar.",
    badgeClass: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    dotClass: "bg-orange-500",
  },
  salesperson: {
    value: "salesperson",
    label: "Vendedor",
    short: "Salesperson",
    description: "Trabalha o próprio funil de leads e acompanha propostas.",
    access: "Vê apenas leads próprios. Propostas: total. Faturas/custos: leitura.",
    badgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    dotClass: "bg-blue-500",
  },
  installer: {
    value: "installer",
    label: "Instalador",
    short: "Installer",
    description: "Equipe de campo — executa serviços e lança próprias diárias/SqFt.",
    access: "Apenas projetos atribuídos. Mão de obra: só os próprios lançamentos.",
    badgeClass: "bg-green-500/15 text-green-400 border border-green-500/30",
    dotClass: "bg-green-500",
  },
  accountant: {
    value: "accountant",
    label: "Financeiro",
    short: "Accountant",
    description: "Cuida do fluxo financeiro, faturas e pagamentos.",
    access: "Faturas, pagamentos e custos: total. Propostas/projetos: leitura.",
    badgeClass: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    dotClass: "bg-purple-500",
  },
  moderator: {
    value: "moderator",
    label: "Moderador (legado)",
    short: "Moderator",
    description: "Perfil legado — use Manager para casos novos.",
    access: "Mantido para compatibilidade.",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    dotClass: "bg-muted-foreground",
  },
};

// Roles offered in the invite/edit selector (legacy 'moderator' excluded from new assignments)
export const ASSIGNABLE_ROLES: AppRole[] = [
  "admin",
  "manager",
  "salesperson",
  "installer",
  "accountant",
];

export function getRoleMeta(role: string): RoleMeta {
  return (ROLE_META as Record<string, RoleMeta>)[role] ?? ROLE_META.moderator;
}
