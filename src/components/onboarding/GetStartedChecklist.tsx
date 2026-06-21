import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Rocket, ChevronDown, ChevronUp, CheckCircle2, Circle, ChevronRight,
  UserCheck, UserPlus, Briefcase, FileText, Users, Settings,
} from "lucide-react";
import { useOnboarding, type ChecklistKey } from "@/hooks/useOnboarding";

type Item = {
  key: ChecklistKey;
  icon: typeof UserCheck;
  title: string;
  description: string;
  to: string;
};

const ITEMS: Item[] = [
  { key: "account", icon: UserCheck, title: "Criar conta", description: "A tua conta FloorPRO está ativa.", to: "/admin/settings" },
  { key: "first_customer", icon: UserPlus, title: "Adicionar primeiro cliente", description: "Comeca a tua base de clientes.", to: "/admin/customers" },
  { key: "first_project", icon: Briefcase, title: "Criar primeiro projeto", description: "Organiza o teu primeiro trabalho.", to: "/admin/projects" },
  { key: "first_proposal", icon: FileText, title: "Enviar primeira proposta", description: "Converte um lead num cliente.", to: "/admin/leads" },
  { key: "first_team_member", icon: Users, title: "Adicionar colaborador", description: "Convida a tua equipa.", to: "/admin/team" },
  { key: "company_settings", icon: Settings, title: "Configurar empresa", description: "Logo, contactos e branding.", to: "/admin/settings" },
];

export function GetStartedChecklist() {
  const { checklist, completedCount, totalChecklist, checklistAllDone, setChecklistItem, loading } = useOnboarding();
  const [open, setOpen] = useState(true);

  if (loading || checklistAllDone) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#0066FF]/15 flex items-center justify-center">
            <Rocket className="h-4.5 w-4.5 text-[#0066FF]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Começar com o FloorPRO</h3>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF]">
                {completedCount}/{totalChecklist}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conclui estes passos para tirar o máximo partido.
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Progress */}
          <div className="px-4 pt-3">
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-[#0066FF] transition-all"
                style={{ width: `${(completedCount / totalChecklist) * 100}%` }}
              />
            </div>
          </div>
          <ul className="p-2">
            {ITEMS.map((item) => {
              const done = !!checklist[item.key];
              const Icon = item.icon;
              const isAccount = item.key === "account";
              return (
                <li key={item.key}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition group">
                    <button
                      type="button"
                      onClick={() => !isAccount && setChecklistItem(item.key, !done)}
                      disabled={isAccount}
                      aria-label={done ? "Marcar como por fazer" : "Marcar como feito"}
                      className="shrink-0"
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-[#0066FF]" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </div>
                    </div>
                    <Link
                      to={item.to}
                      className="text-muted-foreground hover:text-foreground transition"
                      aria-label="Abrir"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default GetStartedChecklist;
