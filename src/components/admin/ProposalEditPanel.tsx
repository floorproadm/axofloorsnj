import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContentOverrides {
  customer_name?: string;
  address?: string;
  customer_email?: string;
  customer_phone?: string;
  project_type?: string;
  square_footage?: number;
  site_assessment?: string;
  timeline?: string;
  cta_heading?: string;
  cta_text?: string;
}

export const SECTION_KEYS = ['method', 'timeline', 'guarantee', 'cta'] as const;
export type SectionKey = typeof SECTION_KEYS[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  method: 'AXO Transformation Method',
  timeline: 'Estimated Timeline',
  guarantee: "Woody's Guarantee",
  cta: 'Call To Action',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  initialOverrides: ContentOverrides;
  initialHidden: SectionKey[];
  initialValidUntil: string; // ISO date
  onSaved: (patch: {
    overrides: ContentOverrides;
    hidden: SectionKey[];
    validUntil: string;
  }) => void;
}

export function ProposalEditPanel({
  open,
  onOpenChange,
  proposalId,
  initialOverrides,
  initialHidden,
  initialValidUntil,
  onSaved,
}: Props) {
  const [ov, setOv] = useState<ContentOverrides>(initialOverrides);
  const [hidden, setHidden] = useState<SectionKey[]>(initialHidden);
  const [validUntil, setValidUntil] = useState<Date>(() => new Date(initialValidUntil));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setOv(initialOverrides);
      setHidden(initialHidden);
      setValidUntil(new Date(initialValidUntil));
    }
  }, [open, initialOverrides, initialHidden, initialValidUntil]);

  const set = <K extends keyof ContentOverrides>(k: K, v: ContentOverrides[K]) =>
    setOv((p) => ({ ...p, [k]: v }));

  const toggleSection = (k: SectionKey, visible: boolean) => {
    setHidden((prev) => (visible ? prev.filter((x) => x !== k) : Array.from(new Set([...prev, k]))));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Strip empty strings so they don't override real data with blanks
      const cleaned: ContentOverrides = Object.fromEntries(
        Object.entries(ov).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ) as ContentOverrides;

      const { error } = await supabase
        .from('proposals')
        .update({
          content_overrides: cleaned as any,
          hidden_sections: hidden,
          valid_until: format(validUntil, 'yyyy-MM-dd'),
        })
        .eq('id', proposalId);
      if (error) throw error;

      onSaved({
        overrides: cleaned,
        hidden,
        validUntil: format(validUntil, 'yyyy-MM-dd'),
      });
      toast.success('Proposal content updated');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit content</SheetTitle>
          <SheetDescription>
            Overrides apply only to this proposal. Original project data stays untouched.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-5">
          {/* Validity */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Validity</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !validUntil && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validUntil ? format(validUntil, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={validUntil}
                  onSelect={(d) => d && setValidUntil(d)}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </section>

          <Separator />

          {/* Client & Project */}
          <section className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Client & Project</Label>
            <div className="space-y-2">
              <Label className="text-xs">Client name</Label>
              <Input value={ov.customer_name ?? ''} onChange={(e) => set('customer_name', e.target.value)} placeholder="Original from project" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Address</Label>
              <Input value={ov.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="Original from project" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input value={ov.customer_email ?? ''} onChange={(e) => set('customer_email', e.target.value)} placeholder="Original" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input value={ov.customer_phone ?? ''} onChange={(e) => set('customer_phone', e.target.value)} placeholder="Original" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Project type</Label>
                <Input value={ov.project_type ?? ''} onChange={(e) => set('project_type', e.target.value)} placeholder="Original" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Square footage</Label>
                <Input
                  type="number"
                  value={ov.square_footage ?? ''}
                  onChange={(e) => set('square_footage', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="Original"
                />
              </div>
            </div>
          </section>

          <Separator />

          {/* Texts */}
          <section className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Document texts</Label>
            <div className="space-y-2">
              <Label className="text-xs">Site Assessment paragraph</Label>
              <Textarea
                rows={4}
                value={ov.site_assessment ?? ''}
                onChange={(e) => set('site_assessment', e.target.value)}
                placeholder="Leave empty to use the default generated text"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Timeline paragraph</Label>
              <Textarea
                rows={3}
                value={ov.timeline ?? ''}
                onChange={(e) => set('timeline', e.target.value)}
                placeholder="Leave empty to use the default"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CTA heading</Label>
              <Input
                value={ov.cta_heading ?? ''}
                onChange={(e) => set('cta_heading', e.target.value)}
                placeholder="Ready to move forward?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CTA text</Label>
              <Textarea
                rows={2}
                value={ov.cta_text ?? ''}
                onChange={(e) => set('cta_text', e.target.value)}
                placeholder="Contact us to discuss your project..."
              />
            </div>
          </section>

          <Separator />

          {/* Sections on/off */}
          <section className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sections</Label>
            {SECTION_KEYS.map((k) => {
              const visible = !hidden.includes(k);
              return (
                <div key={k} className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">{SECTION_LABELS[k]}</span>
                  <Switch checked={visible} onCheckedChange={(v) => toggleSection(k, v)} />
                </div>
              );
            })}
          </section>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
