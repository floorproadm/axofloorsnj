import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, email, phone, address, city, state, zip_code, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCustomers((data as Customer[]) || []);
      } catch (err: any) {
        toast({
          title: "Erro ao carregar clientes",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [toast]);

  return (
    <AdminLayout title="Clientes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-[hsl(var(--gold-warm))]" />
              Clientes
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Base de clientes ativos e histórico
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : customers.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">Nenhum cliente encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Clientes aparecem aqui quando leads são convertidos ou criados manualmente.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {customers.map((customer) => (
              <Card
                key={customer.id}
                className="p-4 flex items-center justify-between hover:border-primary/30 transition-colors"
              >
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {customer.name || "Sem nome"}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    {customer.email && <span>{customer.email}</span>}
                    {customer.phone && <span>{customer.phone}</span>}
                    {customer.address && (
                      <span className="truncate">
                        {customer.address}
                        {customer.city && `, ${customer.city}`}
                        {customer.state && `, ${customer.state}`}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
