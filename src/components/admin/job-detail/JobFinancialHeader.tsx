import { cn, formatCurrency } from '@/lib/utils';
import { useJobCost } from '@/hooks/useJobCosts';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, AlertTriangle, CheckCircle2, Clock, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; icon: React.ReactNode; className: string }> = {
  no_invoice: { label: 'No Invoice', icon: <FileX className="w-3 h-3" />, className: 'text-muted-foreground bg-muted' },
  awaiting: { label: 'Awaiting', icon: <Clock className="w-3 h-3" />, className: 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
  overdue: { label: 'Overdue', icon: <AlertTriangle className="w-3 h-3" />, className: 'text-destructive bg-red-100 dark:bg-red-900/30' },
  paid: { label: 'Paid', icon: <CheckCircle2 className="w-3 h-3" />, className: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border">
      <MetricBox label="Revenue" value={formatCurrency(revenue)} icon={<DollarSign className="w-3.5 h-3.5" />} />
      <MetricBox label="Total Cost" value={formatCurrency(totalCost)} icon={<DollarSign className="w-3.5 h-3.5" />} />
      <MetricBox 
        label="Margin" 
        value={`${margin.toFixed(1)}%`} 
        className={cn(marginOk ? 'text-emerald-600' : margin > 0 ? 'text-amber-500' : 'text-destructive')}
      />
      <div className="flex flex-col items-start gap-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payment</span>
        <Badge variant="outline" className={cn("gap-1 text-xs font-semibold border-0", paymentCfg.className)}>
          {paymentCfg.icon}
          {paymentCfg.label}
        </Badge>
        {paymentData && paymentData.balance > 0 && paymentStatus !== 'paid' && (
          <span className="text-[10px] text-muted-foreground">
            Due: {formatCurrency(paymentData.balance)}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricBox({ label, value, icon, className }: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        {icon} {label}
      </span>
      <span className={cn("text-lg font-bold tabular-nums", className)}>{value}</span>
    </div>
  );
}
