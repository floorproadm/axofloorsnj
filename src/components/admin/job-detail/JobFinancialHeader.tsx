import { cn, formatCurrency } from '@/lib/utils';
import { useJobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle2, Clock, FileX, TrendingUp, TrendingDown } from 'lucide-react';

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

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; icon: React.ReactNode; dotColor: string }> = {
  no_invoice: { label: 'No Invoice', icon: <FileX className="w-3.5 h-3.5" />, dotColor: 'bg-muted-foreground' },
  awaiting: { label: 'Awaiting', icon: <Clock className="w-3.5 h-3.5" />, dotColor: 'bg-amber-500' },
  overdue: { label: 'Overdue', icon: <AlertTriangle className="w-3.5 h-3.5" />, dotColor: 'bg-destructive' },
  paid: { label: 'Paid', icon: <CheckCircle2 className="w-3.5 h-3.5" />, dotColor: 'bg-emerald-500' },
};

export function JobFinancialHeader({ projectId }: { projectId: string }) {
  const { data: jobCost } = useJobCost(projectId);
  const { marginMinPercent } = useCompanySettings();
  const { data: paymentData } = usePaymentStatus(projectId);

  const revenue = jobCost?.estimated_revenue ?? 0;
  const totalCost = jobCost?.total_cost ?? 0;
  const margin = jobCost?.margin_percent ?? 0;
  const marginOk = !!(jobCost && margin >= marginMinPercent && revenue > 0);
  const paymentStatus = paymentData?.status ?? 'no_invoice';
  const paymentCfg = PAYMENT_CONFIG[paymentStatus];

  return (
    <div className="grid grid-cols-4 gap-px rounded-lg overflow-hidden border border-border/60 bg-border/60">
      {/* Revenue */}
      <div className="bg-card p-3 flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Revenue</span>
        <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(revenue)}</span>
      </div>

      {/* Cost */}
      <div className="bg-card p-3 flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cost</span>
        <span className="text-base font-bold tabular-nums text-foreground">{formatCurrency(totalCost)}</span>
      </div>

      {/* Margin */}
      <div className="bg-card p-3 flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Margin</span>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-base font-bold tabular-nums",
            marginOk ? 'text-emerald-500' : margin > 0 ? 'text-amber-500' : 'text-muted-foreground'
          )}>
            {margin.toFixed(1)}%
          </span>
          {revenue > 0 && (
            marginOk 
              ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> 
              : <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="bg-card p-3 flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Payment</span>
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", paymentCfg.dotColor)} />
          <span className="text-xs font-semibold text-foreground">{paymentCfg.label}</span>
        </div>
        {paymentData && paymentData.balance > 0 && paymentStatus !== 'paid' && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            Due: {formatCurrency(paymentData.balance)}
          </span>
        )}
      </div>
    </div>
  );
}
