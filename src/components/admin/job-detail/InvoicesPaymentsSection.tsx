import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function InvoicesPaymentsSection({ projectId }: { projectId: string }) {
  const navigate = useNavigate();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['project-invoices', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, amount, total_amount, due_date, paid_at, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['project-payments-summary', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, payment_date, payment_method, status, category, description')
        .eq('project_id', projectId)
        .eq('category', 'received')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;
  }

  const totalInvoiced = invoices.reduce((s, i) => s + (i.total_amount ?? i.amount ?? 0), 0);
  const totalReceived = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      {(invoices.length > 0 || payments.length > 0) && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm">
          <span className="text-muted-foreground">Invoiced: <strong className="text-foreground">{formatCurrency(totalInvoiced)}</strong></span>
          <span className="text-muted-foreground">Received: <strong className="text-emerald-600">{formatCurrency(totalReceived)}</strong></span>
        </div>
      )}

      {/* Invoices */}
      {invoices.length > 0 ? (
        <div className="space-y-1.5">
          {invoices.map(inv => {
            const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date();
            const displayStatus = isOverdue ? 'overdue' : inv.status;
            return (
              <div key={inv.id} className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate('/admin/payments')}>
                <div className="min-w-0 flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">#{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold">{formatCurrency(inv.total_amount ?? inv.amount)}</span>
                  <Badge variant="outline" className={cn("text-[10px] border-0", STATUS_COLORS[displayStatus] || STATUS_COLORS.draft)}>
                    {displayStatus}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3 italic">No invoices yet.</p>
      )}

      {/* Received payments */}
      {payments.length > 0 && (
        <div className="pt-2 border-t border-dashed space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payments Received</p>
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between px-2 py-1.5 text-sm">
              <span className="text-muted-foreground">
                {new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {p.payment_method && ` · ${p.payment_method}`}
              </span>
              <span className={cn("font-medium", p.status === 'completed' ? 'text-emerald-600' : 'text-muted-foreground')}>
                {formatCurrency(p.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => navigate('/admin/payments')}>
        <ExternalLink className="w-3 h-3" /> Go to Payments
      </Button>
    </div>
  );
}
