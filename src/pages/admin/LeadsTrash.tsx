import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, RotateCcw, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type DeletedLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  deleted_at: string;
  created_at: string;
};

export default function LeadsTrash() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [leads, setLeads] = useState<DeletedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) { setIsAdmin(false); return; }
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }).then(({ data: ok }) => {
        setIsAdmin(!!ok);
      });
    });
  }, []);

  const fetchTrash = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, name, email, phone, status, deleted_at, created_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setLeads((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchTrash();
  }, [isAdmin]);

  const restore = async (lead: DeletedLead) => {
    setBusyId(lead.id);
    const { error } = await supabase
      .from("leads")
      .update({ deleted_at: null } as any)
      .eq("id", lead.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Lead "${lead.name}" restaurado`);
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  };

  const purge = async (lead: DeletedLead) => {
    setBusyId(lead.id);
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    setBusyId(null);
    setConfirmName("");
    if (error) return toast.error(error.message);
    toast.success(`Lead "${lead.name}" removido permanentemente`);
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  };

  if (isAdmin === null) {
    return (
      <AdminLayout title="Lixeira de Leads" breadcrumbs={[{ label: "Leads & Vendas", href: "/admin/leads" }, { label: "Lixeira" }]}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Lixeira de Leads" breadcrumbs={[{ label: "Leads & Vendas", href: "/admin/leads" }, { label: "Lixeira" }]}>
        <div className="max-w-md mx-auto mt-16 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 mx-auto text-destructive" />
          <h2 className="text-lg font-semibold">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">Somente administradores podem visualizar a lixeira de leads.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/leads"><ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Lixeira de Leads"
      breadcrumbs={[{ label: "Leads & Vendas", href: "/admin/leads" }, { label: "Lixeira" }]}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Leads excluídos são mantidos por <strong>30 dias</strong> antes da remoção definitiva automática.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/leads"><ArrowLeft className="w-4 h-4 mr-1.5" /> Pipeline</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm border rounded-lg">
            Nenhum lead na lixeira.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Excluído</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => {
                  const daysLeft = 30 - differenceInDays(new Date(), new Date(lead.deleted_at));
                  const urgent = daysLeft <= 7;
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>{lead.phone}</div>
                        {lead.email && <div className="text-xs">{lead.email}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.deleted_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={urgent ? "destructive" : "secondary"} className="text-xs">
                          {Math.max(daysLeft, 0)} {daysLeft === 1 ? "dia" : "dias"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === lead.id}
                          onClick={() => restore(lead)}
                        >
                          {busyId === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
                          Restaurar
                        </Button>
                        <AlertDialog onOpenChange={(o) => { if (!o) setConfirmName(""); }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Apagar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Apagar lead permanentemente?</AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="space-y-2">
                                  <p>Esta ação é <strong>definitiva</strong> e não poderá ser desfeita.</p>
                                  <p className="text-sm">Digite o nome <strong>{lead.name}</strong> para confirmar:</p>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input
                              value={confirmName}
                              onChange={(e) => setConfirmName(e.target.value)}
                              placeholder={lead.name}
                              autoComplete="off"
                            />
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => purge(lead)}
                                disabled={confirmName.trim() !== lead.name.trim() || busyId === lead.id}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Apagar permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
