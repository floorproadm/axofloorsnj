import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCrewMembers, useQuickAddCrewMember, type CrewMember } from '@/hooks/useCrewMembers';
import { formatCurrency } from '@/lib/finance';
import { toast } from 'sonner';

interface CrewMemberPickerProps {
  value: string | null;
  workerName: string;
  onSelect: (opts: { id: string | null; name: string; rate: number; role?: string | null }) => void;
  className?: string;
}

export function CrewMemberPicker({ value, workerName, onSelect, className }: CrewMemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('');
  const { data: crew = [], isLoading } = useCrewMembers(true);
  const { mutateAsync: quickAdd, isPending } = useQuickAddCrewMember();

  const selected = crew.find((c) => c.id === value);
  const label = selected?.full_name || workerName || 'Select worker';

  const handleQuickAdd = async () => {
    if (!newName.trim() || !newRate) return;
    try {
      const member = await quickAdd({ full_name: newName.trim(), daily_rate: parseFloat(newRate) });
      onSelect({ id: member.id, name: member.full_name, rate: member.daily_rate || 0, role: member.role });
      setCreating(false);
      setNewName(''); setNewRate('');
      setOpen(false);
      toast.success(`${member.full_name} added to crew`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add crew member');
    }
  };

  const pickMember = (m: CrewMember) => {
    onSelect({ id: m.id, name: m.full_name, rate: m.daily_rate || 0, role: m.role });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between text-sm font-normal h-9', !value && !workerName && 'text-muted-foreground', className)}
        >
          <span className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {creating ? (
          <div className="p-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Add new worker</p>
            <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-sm" autoFocus />
            <Input placeholder="$/day" type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} className="h-8 text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(); }} />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCreating(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleQuickAdd} disabled={isPending || !newName.trim() || !newRate}>
                Save & select
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Search crew..." className="h-9" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading...' : 'No crew member found.'}
              </CommandEmpty>
              <CommandGroup>
                {crew.map((m) => (
                  <CommandItem key={m.id} value={m.full_name} onSelect={() => pickMember(m)} className="text-sm">
                    <Check className={cn('mr-2 h-3.5 w-3.5', value === m.id ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex-1 truncate">{m.full_name}</span>
                    {m.role && <span className="text-[10px] text-muted-foreground mr-2">{m.role}</span>}
                    {m.daily_rate ? <span className="text-xs tabular-nums text-muted-foreground">{formatCurrency(m.daily_rate)}/d</span> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => setCreating(true)} className="text-sm text-primary">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Add new worker
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
