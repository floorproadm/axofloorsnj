import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, Receipt, Plus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateInvoice, generateInvoiceNumber } from '@/hooks/useInvoices';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export function InvoicesPaymentsSection({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

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

      {/* Invoices list */}
      {invoices.length > 0 ? (
        <div className="space-y-1">
          {invoices.map(inv => {
            const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date();
            const displayStatus = isOverdue ? 'overdue' : inv.status;
            return (
              <div key={inv.id} className="group flex items-center justify-between py-2 px-1 rounded hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/payments?invoice=${inv.id}`)}>
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
      ) : !showForm && (
        <p className="text-xs text-muted-foreground text-center py-2 italic">No invoices yet</p>
      )}

      {/* Inline invoice creation */}
      {showForm ? (
        <InlineInvoiceForm
          projectId={projectId}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['project-invoices', projectId] });
            queryClient.invalidateQueries({ queryKey: ['payment-snapshot', projectId] });
          }}
        />
      ) : (
        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={() => setShowForm(true)}>
          <Plus className="w-3 h-3" /> New Invoice
        </Button>
      )}

      {/* Received payments */}
      {payments.length > 0 && (
        <div className="pt-2 border-t border-dashed space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payments Received</p>
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between px-1 py-1.5 text-sm">
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

      <Button variant="ghost" size="sm" className="w-full text-xs gap-1.5 text-muted-foreground" onClick={() => navigate('/admin/payments')}>
        <ExternalLink className="w-3 h-3" /> View All Payments
      </Button>
    </div>
  );
}

/* ─── Inline Invoice Form ─── */

function InlineInvoiceForm({ projectId, onClose, onCreated }: {
  projectId: string; onClose: () => void; onCreated: () => void;
}) {
  const createInvoice = useCreateInvoice();

  // Fetch project to get customer_id
  const { data: project } = useQuery({
    queryKey: ['project-for-invoice', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('customer_id, customer_name').eq('id', projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleSubmit = () => {
    const validItems = items.filter(i => i.description.trim() && i.unit_price > 0);
    if (validItems.length === 0 || !dueDate) {
      toast.error('Add at least one line item with a price');
      return;
    }

    createInvoice.mutate(
      {
        project_id: projectId,
        customer_id: project?.customer_id || null,
        invoice_number: generateInvoiceNumber(),
        due_date: dueDate,
        items: validItems,
      },
      {
        onSuccess: () => {
          toast.success('Invoice created');
          onCreated();
        },
      }
    );
  };

  return (
    <div className="border border-border/50 rounded-lg bg-muted/10 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">New Invoice</p>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Connected project indicator */}
      {project && (
        <p className="text-xs text-muted-foreground">
          For: <span className="font-medium text-foreground">{project.customer_name}</span>
        </p>
      )}

      {/* Due date */}
      <div>
        <Label className="text-xs text-muted-foreground">Due Date</Label>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm mt-1" />
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Line Items</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-muted-foreground" onClick={addItem}>
            <Plus className="w-3 h-3" /> Add
          </Button>
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(idx, 'description', e.target.value)}
              className="text-sm flex-1"
              autoFocus={idx === 0}
            />
            <Input
              type="number"
              min={1}
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
              className="text-sm w-16"
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Price"
              value={item.unit_price || ''}
              onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
              className="text-sm w-24"
            />
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
              onClick={() => removeItem(idx)} disabled={items.length === 1}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      {subtotal > 0 && (
        <div className="flex justify-between text-sm pt-1 border-t border-border/30">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold">{formatCurrency(subtotal)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="text-xs" onClick={handleSubmit} disabled={createInvoice.isPending}>
          {createInvoice.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Invoice'}
        </Button>
      </div>
    </div>
  );
}
