import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Check, X, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  company_name: string | null;
  contact_name: string | null;
}

interface Props {
  projectId: string;
  currentPartnerId: string | null | undefined;
  currentPartnerName: string | null | undefined;
  onChanged?: () => void;
}

export function PartnerPickerInline({ projectId, currentPartnerId, currentPartnerName, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners-picker'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name, contact_name')
        .order('company_name', { ascending: true });
      if (error) throw error;
      return (data || []) as Partner[];
    },
    enabled: open,
  });

  const setPartner = async (partnerId: string | null) => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ referred_by_partner_id: partnerId })
      .eq('id', projectId);
    setSaving(false);
    if (error) {
      toast.error('Failed to update partner');
      return;
    }
    toast.success(partnerId ? 'Partner linked' : 'Partner removed');
    setOpen(false);
    setSearch('');
    qc.invalidateQueries({ queryKey: ['job-detail', projectId] });
    qc.invalidateQueries({ queryKey: ['hub-projects'] });
    onChanged?.();
  };

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.company_name || '').toLowerCase().includes(q) ||
      (p.contact_name || '').toLowerCase().includes(q)
    );
  });

  const label = (p: Partner) => p.contact_name || p.company_name || 'Unnamed';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'text-xs gap-1.5 font-normal cursor-pointer hover:bg-accent transition-colors',
            currentPartnerId && 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400'
          )}
        >
          <Users className="w-3 h-3 text-primary" />
          {currentPartnerName ? `Partner: ${currentPartnerName}` : 'Add partner'}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {isLoading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No partners found</div>
          )}
          {filtered.map((p) => {
            const isCurrent = p.id === currentPartnerId;
            return (
              <button
                key={p.id}
                disabled={saving}
                onClick={() => setPartner(p.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{label(p)}</span>
                  {p.company_name && p.contact_name && (
                    <span className="text-[11px] text-muted-foreground truncate">{p.company_name}</span>
                  )}
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        {currentPartnerId && (
          <div className="border-t border-border p-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => setPartner(null)}
              className="w-full justify-start text-xs text-destructive hover:text-destructive h-7 gap-1.5"
            >
              <X className="w-3 h-3" /> Remove partner
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
