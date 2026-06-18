import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Plus, Send } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSuggestedInvoice } from '@/hooks/useSuggestedInvoice';
import { useCreateInvoice, generateInvoiceNumber } from '@/hooks/useInvoices';
import { supabase } from '@/integrations/supabase/client';
import { sendGmailEmail } from '@/hooks/useEmailLogs';
import { toast } from 'sonner';

interface Props {
  projectId: string;
  onCreated?: () => void;
  onCustom: () => void;
}

export function SmartInvoiceCTA({ projectId, onCreated, onCustom }: Props) {
  const qc = useQueryClient();
  const { data: suggestion, isLoading } = useSuggestedInvoice(projectId);
  const createInvoice = useCreateInvoice();
  const [sending, setSending] = useState(false);

  const handleSendInvoice = async (invoiceId: string, invoiceNumber: string, amount: number, dueDate: string, shareToken?: string | null) => {
    const { data: proj } = await supabase
      .from('projects').select('customer_email, customer_name').eq('id', projectId).maybeSingle();
    if (!proj?.customer_email) {
      toast.error('No customer email on this project');
      return;
    }
    const invoiceLink = `${window.location.origin}/invoice/${shareToken || invoiceId}`;
    await sendGmailEmail('invoice_sent', {
      recipient_email: proj.customer_email,
      customer_name: proj.customer_name || 'Valued Customer',
      invoice_number: invoiceNumber,
      amount,
      due_date: new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      invoice_link: invoiceLink,
      related_id: invoiceId,
      related_type: 'invoice',
    });
    await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId);
    qc.invalidateQueries({ queryKey: ['project-invoices', projectId] });
    qc.invalidateQueries({ queryKey: ['invoices'] });
  };

  const handleGenerate = async () => {
    if (!suggestion) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + suggestion.dueInDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const phaseTitle = suggestion.phase.charAt(0).toUpperCase() + suggestion.phase.slice(1);
    const description = `${phaseTitle} (${suggestion.percentage}%)${suggestion.projectType ? ` — ${suggestion.projectType}` : ''}${suggestion.projectAddress ? ` at ${suggestion.projectAddress}` : ''}`;

    createInvoice.mutate(
      {
        project_id: projectId,
        customer_id: suggestion.customerId,
        invoice_number: generateInvoiceNumber(),
        due_date: dueDateStr,
        items: [{ description, quantity: 1, unit_price: suggestion.amount }],
      },
      {
        onSuccess: async (invoice: any) => {
          // Tag the phase
          await supabase.from('invoices').update({ phase: suggestion.phase }).eq('id', invoice.id);
          qc.invalidateQueries({ queryKey: ['project-invoices', projectId] });
          qc.invalidateQueries({ queryKey: ['suggested-invoice', projectId] });
          onCreated?.();
          toast.success(`${suggestion.label} created`, {
            description: `${formatCurrency(suggestion.amount)} · due in ${suggestion.dueInDays} days`,
            action: {
              label: 'Send now',
              onClick: async () => {
                setSending(true);
                try {
                  await handleSendInvoice(invoice.id, invoice.invoice_number, suggestion.amount, dueDateStr, invoice.share_token);
                  toast.success('Invoice email sent');
                } catch (e: any) {
                  toast.error('Failed to send: ' + e.message);
                } finally {
                  setSending(false);
                }
              },
            },
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" className="w-full text-xs" disabled>
        <Loader2 className="w-3 h-3 animate-spin" />
      </Button>
    );
  }

  if (!suggestion) {
    return (
      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={onCustom}>
        <Plus className="w-3 h-3" /> New Invoice
      </Button>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        size="sm"
        className="w-full text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90"
        onClick={handleGenerate}
        disabled={createInvoice.isPending || sending}
      >
        {createInvoice.isPending || sending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        <span className="font-medium">Generate {suggestion.label}</span>
        <span className="opacity-80">·</span>
        <span className="tabular-nums">{formatCurrency(suggestion.amount)}</span>
        <span className="opacity-70">({suggestion.percentage}%)</span>
      </Button>
      <button
        type="button"
        onClick={onCustom}
        className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        or create a custom invoice
      </button>
    </div>
  );
}
