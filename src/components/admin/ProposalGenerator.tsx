import { useState, useRef, useEffect } from 'react';
import { useProposalGeneration, DEFAULT_TIER_MARGINS } from '@/hooks/useProposalGeneration';
import { ProposalData, ProposalTier } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Printer, Check, AlertTriangle, Shield, Sparkles, Clock, Phone, Link2, Layers, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProposalGeneratorProps {
  projectId: string;
  onClose?: () => void;
}

/**
 * PROPOSAL GENERATOR
 * Generates 3-tier proposal (Good/Better/Best)
 * Professional print document with AXO branding
 */
export function ProposalGenerator({ projectId, onClose }: ProposalGeneratorProps) {
  const { fetchProjectData, isLoading, error } = useProposalGeneration();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [mode, setMode] = useState<'tiers' | 'direct' | null>(null);
  const [flatPriceInput, setFlatPriceInput] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!mode) {
      toast.error('Choose a proposal mode first.');
      return;
    }
    if (mode === 'direct') {
      const price = Number(flatPriceInput);
      if (!price || price <= 0) {
        toast.error('Enter a valid price for Direct mode.');
        return;
      }
      const data = await fetchProjectData(projectId, { mode: 'direct', flatPrice: price });
      if (data) setProposal(data);
      return;
    }
    const data = await fetchProjectData(projectId, { mode: 'tiers' });
    if (data) setProposal(data);
  };

  // When proposal is loaded, fetch the share_token from DB (most recent for project)
  useEffect(() => {
    if (!proposal?.proposal_id) {
      setShareToken(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('proposals')
        .select('share_token')
        .eq('id', proposal.proposal_id!)
        .maybeSingle();
      if (data?.share_token) setShareToken(data.share_token);
    })();
  }, [proposal?.proposal_id]);

  const handleCopyLink = async () => {
    if (!shareToken) {
      toast.error('Public link is being generated. Try again in a moment.');
      return;
    }
    const url = `${window.location.origin}/proposal/${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public proposal link copied to clipboard');
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>Proposal - ${proposal?.customer_name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Roboto:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Roboto', Arial, sans-serif; color: #1a1a2e; background: #fff; }
        h1, h2, h3, h4, h5 { font-family: 'Montserrat', sans-serif; }
        .print-page { max-width: 800px; margin: 0 auto; padding: 40px; }
        .hero-section { text-align: center; padding: 40px 20px; border-bottom: 3px solid #1e3a5f; margin-bottom: 30px; }
        .hero-section h1 { font-size: 32px; color: #1e3a5f; margin-bottom: 8px; }
        .hero-section .subtitle { color: #d97706; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; }
        .hero-section .proposal-num { color: #888; font-size: 12px; margin-top: 8px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; color: #1e3a5f; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #d97706; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { font-size: 14px; }
        .info-item .label { color: #888; font-size: 12px; }
        .info-item .value { font-weight: 500; }
        .method-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
        .method-step { text-align: center; padding: 15px 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .method-step .step-num { display: inline-block; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #1e3a5f; color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 8px; }
        .method-step h4 { font-size: 13px; color: #1e3a5f; margin-bottom: 4px; }
        .method-step p { font-size: 11px; color: #666; }
        .tiers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .tier-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; }
        .tier-card.recommended { border-color: #d97706; background: #fffbeb; }
        .tier-card .tier-badge { display: inline-block; background: #1e3a5f; color: #fff; font-size: 9px; padding: 3px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .tier-card.recommended .tier-badge { background: #d97706; }
        .tier-card .tier-name { font-size: 20px; font-weight: 700; color: #1e3a5f; }
        .tier-card .tier-price { font-size: 32px; font-weight: 700; color: #d97706; margin: 10px 0; }
        .tier-card .tier-sqft { font-size: 12px; color: #888; margin-bottom: 12px; }
        .tier-card .tier-desc { font-size: 12px; color: #666; margin-bottom: 12px; }
        .tier-card .feature-list { list-style: none; text-align: left; }
        .tier-card .feature-list li { font-size: 12px; padding: 4px 0; padding-left: 18px; position: relative; }
        .tier-card .feature-list li:before { content: "✓"; color: #22c55e; position: absolute; left: 0; font-weight: 700; }
        .guarantee-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .guarantee-card { text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .guarantee-card .guarantee-period { font-size: 28px; font-weight: 700; color: #d97706; }
        .guarantee-card .guarantee-type { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
        .guarantee-card p { font-size: 12px; color: #666; margin-top: 6px; }
        .valid-until { background: #fef3c7; padding: 12px; border-radius: 8px; text-align: center; font-size: 14px; margin-bottom: 20px; }
        .cta-section { background: #1e3a5f; color: #fff; padding: 25px; border-radius: 12px; text-align: center; }
        .cta-section h3 { color: #d97706; margin-bottom: 8px; }
        .cta-section p { font-size: 14px; opacity: 0.9; }
        .cta-section .phone { font-size: 20px; font-weight: 700; color: #d97706; margin-top: 10px; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; margin-top: 30px; color: #888; font-size: 11px; }
        @media print {
          body { padding: 0; }
          .print-page { padding: 20px; }
          .tiers-grid, .method-steps, .guarantee-grid { page-break-inside: avoid; }
        }
      </style>
    </head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  if (!proposal) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Proposal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Choose proposal mode</p>
            <p>Pick how you want to present pricing to this client.</p>
          </div>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('tiers')}
              className={`text-left rounded-lg border-2 p-4 transition-all ${
                mode === 'tiers'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Tiers (Good/Better/Best)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                3 options with progressive scope. Best for refinishing where upsell is possible.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('direct')}
              className={`text-left rounded-lg border-2 p-4 transition-all ${
                mode === 'direct'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Direct (single price)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                One price + line items breakdown. Best for install, stairs, repairs, baseboards.
              </p>
            </button>
          </div>

          {/* Direct mode price input */}
          {mode === 'direct' && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
              <Label htmlFor="flat-price" className="text-sm">Final price ($)</Label>
              <Input
                id="flat-price"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 4500"
                value={flatPriceInput}
                onChange={(e) => setFlatPriceInput(e.target.value)}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Margin is calculated automatically against job costs and validated against company minimum.
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="font-medium text-foreground mb-1">Requirements</p>
            <ul className="list-disc ml-5 space-y-0.5">
              <li>Job costs must be calculated</li>
              <li>Margin must meet company minimum</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !mode || (mode === 'direct' && !flatPriceInput)}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                'Generate Proposal'
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sqftPerDay = 350;
  const durationDays = Math.max(1, Math.ceil((proposal.square_footage || 500) / sqftPerDay));

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proposal Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setProposal(null)}>Back</Button>
          <Button variant="outline" onClick={handleCopyLink} disabled={!shareToken}>
            <Link2 className="h-4 w-4 mr-2" />
            Copy Public Link
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Margin Summary (internal only, not printed) */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {proposal.mode === 'direct' ? 'Margin:' : 'Tier Margins:'}
            </span>
            <div className="flex gap-4">
              {proposal.mode === 'direct' ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  {formatCurrency(proposal.flat_price ?? 0)} · {proposal.flat_margin_percent}%
                </span>
              ) : (
                proposal.tiers.map((tier) => (
                  <span key={tier.id} className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" />
                    {tier.name}: {tier.margin_percent}%
                  </span>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable Professional Document */}
      <div ref={printRef} className="bg-white rounded-lg border overflow-hidden">
        <div className="print-page" style={{ maxWidth: 800, margin: '0 auto', padding: 40 }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', paddingBottom: 25, borderBottom: '3px solid #1e3a5f', marginBottom: 30 }}>
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 32, color: '#1e3a5f', marginBottom: 8 }}>AXO Floors</h1>
            <p style={{ color: '#d97706', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' as const }}>Professional Flooring Services</p>
            {proposal.proposal_number && (
              <p style={{ color: '#888', fontSize: 12, marginTop: 8 }}>#{proposal.proposal_number}</p>
            )}
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: '#1e3a5f', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d97706' }}>Prepared For</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span style={{ color: '#888', fontSize: 12 }}>Client</span><br/><strong>{proposal.customer_name}</strong></div>
              <div><span style={{ color: '#888', fontSize: 12 }}>Address</span><br/>{proposal.address}</div>
              <div><span style={{ color: '#888', fontSize: 12 }}>Contact</span><br/>{proposal.customer_email} | {proposal.customer_phone}</div>
              <div><span style={{ color: '#888', fontSize: 12 }}>Project</span><br/>{proposal.project_type} — {proposal.square_footage} sqft</div>
            </div>
          </div>

          {/* Site Assessment */}
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: '#1e3a5f', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d97706' }}>Site Assessment</h2>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>
              {proposal.mode === 'direct'
                ? `Based on our evaluation of your ${proposal.square_footage} sqft ${proposal.project_type} project, we've prepared a fixed-scope quote with a transparent line-item breakdown. Each item uses professional-grade materials and our proven AXO Transformation Method to ensure lasting results.`
                : `Based on our evaluation of your ${proposal.square_footage} sqft ${proposal.project_type} project, we've prepared three tailored options. Each tier uses professional-grade materials and our proven AXO Transformation Method to ensure lasting results.`}
            </p>
          </div>

          {/* AXO Transformation Method */}
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: '#1e3a5f', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d97706' }}>The AXO Transformation Method</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { num: 1, title: 'Diagnostic', desc: 'Floor inspection & species identification' },
                { num: 2, title: 'Preparation', desc: 'Dustless sanding & surface prep' },
                { num: 3, title: 'Execution', desc: 'Staining & finish application' },
                { num: 4, title: 'Finishing', desc: 'Final inspection & cleanup' },
              ].map(step => (
                <div key={step.num} style={{ textAlign: 'center', padding: '15px 10px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <div style={{ display: 'inline-block', width: 28, height: 28, lineHeight: '28px', borderRadius: '50%', background: '#1e3a5f', color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{step.num}</div>
                  <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#1e3a5f', marginBottom: 4 }}>{step.title}</h4>
                  <p style={{ fontSize: 11, color: '#666' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Valid Until */}
          <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, textAlign: 'center', fontSize: 14, marginBottom: 20 }}>
            Valid until: <strong>{format(new Date(proposal.valid_until), 'MMMM d, yyyy')}</strong>
          </div>

          {/* Pricing — Tiers OR Direct (single card with line items) */}
          {proposal.mode === 'direct' ? (
            <div style={{ marginBottom: 30 }}>
              <PrintDirectCard
                price={proposal.flat_price ?? 0}
                lineItems={proposal.line_items ?? []}
                projectType={proposal.project_type}
                formatCurrency={formatCurrency}
              />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 30 }}>
              {proposal.tiers.map((tier, index) => (
                <PrintTierCard key={tier.id} tier={tier} isRecommended={index === 1} formatCurrency={formatCurrency} sqft={proposal.square_footage} />
              ))}
            </div>
          )}

          {/* Timeline */}
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: '#1e3a5f', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d97706' }}>Estimated Timeline</h2>
            <p style={{ fontSize: 14, color: '#444' }}>
              Based on {proposal.square_footage} sqft, we estimate <strong>{durationDays} working day{durationDays > 1 ? 's' : ''}</strong> to complete your project. 
              Our crew works 8AM–5PM with full area protection.
            </p>
          </div>

          {/* Woody's Guarantee */}
          <div style={{ marginBottom: 25 }}>
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, color: '#1e3a5f', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #d97706' }}>Woody's Guarantee</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { period: '30', unit: 'Days', type: 'Satisfaction', desc: 'Not happy? We come back and make it right.' },
                { period: '10', unit: 'Years', type: 'Structural', desc: 'Peeling, bubbling, or delamination covered.' },
                { period: '5', unit: 'Years', type: 'Finish', desc: 'Normal wear coating integrity guaranteed.' },
              ].map(g => (
                <div key={g.type} style={{ textAlign: 'center', padding: 15, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>{g.period}</div>
                  <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' as const, letterSpacing: 1 }}>{g.unit} — {g.type}</div>
                  <p style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: '#1e3a5f', color: '#fff', padding: 25, borderRadius: 12, textAlign: 'center', marginBottom: 25 }}>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', color: '#d97706', marginBottom: 8, fontSize: 18 }}>Ready to Transform Your Floors?</h3>
            <p style={{ fontSize: 14, opacity: 0.9 }}>Contact Eduardo to discuss your project and choose the best option for your home.</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#d97706', marginTop: 10 }}>(862) 216-4658</p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: 20, borderTop: '1px solid #e5e7eb', color: '#888', fontSize: 11 }}>
            <p>AXO Floors — Professional Flooring Services</p>
            <p>www.axofloors.com | info@axofloors.com</p>
            <p style={{ marginTop: 4 }}>Generated: {format(new Date(proposal.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintTierCard({ tier, isRecommended, formatCurrency, sqft }: {
  tier: ProposalTier;
  isRecommended: boolean;
  formatCurrency: (v: number) => string;
  sqft: number;
}) {
  const pricePerSqft = sqft > 0 ? (tier.price / sqft).toFixed(2) : '0';
  return (
    <div style={{
      border: `2px solid ${isRecommended ? '#d97706' : '#e5e7eb'}`,
      borderRadius: 12,
      padding: 20,
      textAlign: 'center',
      background: isRecommended ? '#fffbeb' : '#fff',
    }}>
      <div style={{
        display: 'inline-block',
        background: isRecommended ? '#d97706' : '#1e3a5f',
        color: '#fff',
        fontSize: 9,
        padding: '3px 8px',
        borderRadius: 10,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        marginBottom: 8,
      }}>
        {isRecommended ? 'Recommended' : tier.name}
      </div>
      <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 20, fontWeight: 700, color: '#1e3a5f' }}>{tier.name}</h3>
      <p style={{ fontSize: 32, fontWeight: 700, color: '#d97706', margin: '10px 0' }}>{formatCurrency(tier.price)}</p>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>${pricePerSqft}/sqft</p>
      <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>{tier.short_description}</p>
      <ul style={{ listStyle: 'none', textAlign: 'left', padding: 0 }}>
        {tier.features.map((f, i) => (
          <li key={i} style={{ fontSize: 12, padding: '4px 0', paddingLeft: 18, position: 'relative' as const }}>
            <span style={{ position: 'absolute' as const, left: 0, color: '#22c55e', fontWeight: 700 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
