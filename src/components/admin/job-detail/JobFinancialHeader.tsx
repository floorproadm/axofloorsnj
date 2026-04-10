import { cn, formatCurrency } from '@/lib/utils';
import { useJobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, Clock, FileX, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

type PaymentStatus = 'no_invoice' | 'awaiting' | 'overdue' | 'paid';

function usePaymentStatus(projectId: string) {
  return useQuery({
    queryKey: ['payment-status', projectId],
    queryFn: async (): Promise<{ status: PaymentStatus; balance: number }> => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, amount, total_amount, due_date, paid_at')
        .eq('project_id', projectId);

      if (!invoices || invoices.length === 0) {
        return { status: 'no_invoice', balance: 0 };
      }

      const allPaid = invoices.every(i => i.status === 'paid');
      if (allPaid) return { status: 'paid', balance: 0 };

      const totalDue = invoices.reduce((s, i) => s + (i.total_amount ?? i.amount ?? 0), 0);
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('project_id', projectId)
        .eq('category', 'received')
        .eq('status', 'completed');
      
      const totalPaid = (payments || []).reduce((s, p) => s + p.amount, 0);
      const balance = totalDue - totalPaid;

      const hasOverdue = invoices.some(i => 
        i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date()
      );

      return { 
        status: hasOverdue ? 'overdue' : 'awaiting', 
        balance: Math.max(0, balance) 
      };
    },
  });
}

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  no_invoice: { label: 'No Invoice', icon: <FileX className="w-4 h-4" />, color: 'text-muted-foreground', bg: 'bg-muted/40' },
  awaiting: { label: 'Awaiting Payment', icon: <Clock className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  overdue: { label: 'Overdue', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  paid: { label: 'Paid in Full', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
};

export function JobFinancialHeader({ projectId }: { projectId: string }) {
  const { data: jobCost } = useJobCost(projectId);
  const { marginMinPercent } = useCompanySettings();
  const { data: paymentData } = usePaymentStatus(projectId);

  const revenue = jobCost?.estimated_revenue ?? 0;
  const totalCost = jobCost?.total_cost ?? 0;
  const margin = jobCost?.margin_percent ?? 0;
  const profit = revenue - totalCost;
  const marginOk = !!(jobCost && margin >= marginMinPercent && revenue > 0);
  const paymentStatus = paymentData?.status ?? 'no_invoice';
  const paymentCfg = PAYMENT_CONFIG[paymentStatus];

  return (
    <div className="space-y-3">
      {/* Financial Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Revenue */}
        <div className="rounded-xl bg-card border border-border/50 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2">Revenue</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(revenue)}</p>
        </div>

        {/* Cost */}
        <div className="rounded-xl bg-card border border-border/50 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2">Total Cost</p>
          <p className="text-xl font-bold tabular-nums text-foreground">{formatCurrency(totalCost)}</p>
        </div>

        {/* Margin */}
        <div className="rounded-xl bg-card border border-border/50 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              marginOk ? "bg-emerald-100 dark:bg-emerald-950/30" : "bg-amber-100 dark:bg-amber-950/30"
            )}>
              {revenue > 0 ? (
                marginOk 
                  ? <TrendingUp className="w-4 h-4 text-emerald-600" /> 
                  : <TrendingDown className="w-4 h-4 text-amber-600" />
              ) : (
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2">Margin</p>
          <p className={cn(
            "text-xl font-bold tabular-nums",
            marginOk ? 'text-emerald-600' : margin > 0 ? 'text-amber-600' : 'text-muted-foreground'
          )}>
            {margin.toFixed(1)}%
          </p>
          {revenue > 0 && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(profit)} profit
            </p>
          )}
        </div>

        {/* Payment Status */}
        <div className={cn("rounded-xl border border-border/50 p-4 space-y-1", paymentCfg.bg)}>
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg bg-card/80 flex items-center justify-center", paymentCfg.color)}>
              {paymentCfg.icon}
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2">Payment</p>
          <p className={cn("text-base font-bold", paymentCfg.color)}>{paymentCfg.label}</p>
          {paymentData && paymentData.balance > 0 && paymentStatus !== 'paid' && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(paymentData.balance)} remaining
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
