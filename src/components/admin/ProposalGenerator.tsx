import { useState, useRef } from 'react';
import { useProposalGeneration, DEFAULT_TIER_MARGINS } from '@/hooks/useProposalGeneration';
import { ProposalData, ProposalTier } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Printer, Check, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ProposalGeneratorProps {
  projectId: string;
  onClose?: () => void;
}

/**
 * PROPOSAL GENERATOR
 * Generates 3-tier proposal (Good/Better/Best)
 * All tiers validated against minimum margin
 * Output: Preview + Print/PDF
 */
export function ProposalGenerator({ projectId, onClose }: ProposalGeneratorProps) {
  const { fetchProjectData, isLoading, error } = useProposalGeneration();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    const data = await fetchProjectData(projectId);
    if (data) {
      setProposal(data);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Proposal - ${proposal?.customer_name}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
              .proposal-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .proposal-header h1 { font-size: 28px; margin-bottom: 10px; }
              .proposal-header p { color: #666; }
              .customer-info { margin-bottom: 30px; }
              .customer-info h2 { font-size: 18px; margin-bottom: 10px; color: #333; }
              .customer-info p { margin: 5px 0; }
              .tiers-container { display: flex; gap: 20px; margin-bottom: 40px; }
              .tier-card { flex: 1; border: 2px solid #ddd; border-radius: 8px; padding: 20px; }
              .tier-card.recommended { border-color: #2563eb; background: #f0f7ff; }
              .tier-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
              .tier-price { font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
              .tier-desc { color: #666; margin-bottom: 15px; font-size: 14px; }
              .tier-features { list-style: none; }
              .tier-features li { padding: 5px 0; font-size: 14px; }
              .tier-features li:before { content: "✓"; color: #22c55e; margin-right: 8px; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
              .valid-until { background: #fef3c7; padding: 10px; border-radius: 4px; text-align: center; margin-bottom: 20px; }
              @media print {
                body { padding: 20px; }
                .tiers-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
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
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>This will generate a 3-tier proposal (Good / Better / Best).</p>
            <p className="mt-2 font-medium">Requirements:</p>
            <ul className="list-disc ml-5 mt-1">
              <li>Job costs must be calculated</li>
              <li>All tiers must meet minimum margin</li>
            </ul>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Proposal'
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Proposal Preview</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setProposal(null)}>
            Back
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Margin Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tier Margins:</span>
            <div className="flex gap-4">
              {proposal.tiers.map((tier) => (
                <span key={tier.id} className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  {tier.name}: {tier.margin_percent}%
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div ref={printRef} className="bg-white p-6 rounded-lg border">
        <div className="proposal-header text-center mb-8 pb-4 border-b-2">
          <h1 className="text-2xl font-bold mb-2">AXO Floors</h1>
          <p className="text-muted-foreground">Professional Flooring Services</p>
          {proposal.proposal_number && (
            <p className="text-xs text-muted-foreground mt-1">#{proposal.proposal_number}</p>
          )}
        </div>

        <div className="customer-info mb-6">
          <h2 className="text-lg font-semibold mb-2">Proposal For:</h2>
          <p><strong>{proposal.customer_name}</strong></p>
          <p>{proposal.address}</p>
          <p>{proposal.customer_email} | {proposal.customer_phone}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Project: {proposal.project_type} | {proposal.square_footage} sq ft
          </p>
        </div>

        <div className="valid-until bg-amber-50 p-3 rounded text-center mb-6">
          <p className="text-sm">
            Valid until: <strong>{format(new Date(proposal.valid_until), 'MMMM d, yyyy')}</strong>
          </p>
        </div>

        <div className="tiers-container grid grid-cols-3 gap-4 mb-8">
          {proposal.tiers.map((tier, index) => (
            <TierCard 
              key={tier.id} 
              tier={tier} 
              isRecommended={index === 1}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>

        <div className="footer text-center pt-4 border-t text-muted-foreground text-sm">
          <p>Thank you for considering AXO Floors</p>
          <p>Questions? Contact us at (555) 123-4567</p>
          <p className="mt-2 text-xs">
            Generated: {format(new Date(proposal.created_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
}

function TierCard({ 
  tier, 
  isRecommended,
  formatCurrency 
}: { 
  tier: ProposalTier; 
  isRecommended: boolean;
  formatCurrency: (value: number) => string;
}) {
  return (
    <div className={`tier-card border-2 rounded-lg p-4 ${isRecommended ? 'border-primary bg-primary/5' : 'border-border'}`}>
      {isRecommended && (
        <Badge className="mb-2" variant="default">Recommended</Badge>
      )}
      <h3 className="tier-name text-xl font-bold">{tier.name}</h3>
      <p className="tier-price text-3xl font-bold text-primary my-2">
        {formatCurrency(tier.price)}
      </p>
      <p className="tier-desc text-sm text-muted-foreground mb-4">
        {tier.short_description}
      </p>
      <ul className="tier-features space-y-2">
        {tier.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
