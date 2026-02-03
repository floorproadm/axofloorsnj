import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProposalTier, ProposalData, ProposalValidation, TierValidation } from '@/types/proposal';

/**
 * TIER DEFINITIONS
 * Good / Better / Best with margin multipliers
 * Margins are calculated from base cost, all must exceed minimum
 */
export const TIER_TEMPLATES: Omit<ProposalTier, 'price' | 'margin_percent'>[] = [
  {
    id: 'good',
    name: 'Good',
    short_description: 'Essential refinishing with standard finish',
    features: [
      'Sanding & preparation',
      'Standard polyurethane finish',
      '1 coat stain (if selected)',
      '2 coats finish',
      'Basic cleanup',
    ],
  },
  {
    id: 'better',
    name: 'Better',
    short_description: 'Enhanced refinishing with premium finish',
    features: [
      'Everything in Good',
      'Premium polyurethane finish',
      '2 coats stain (deeper color)',
      '3 coats finish',
      'Edge detail work',
      'Thorough cleanup',
    ],
  },
  {
    id: 'best',
    name: 'Best',
    short_description: 'Complete refinishing with top-tier materials',
    features: [
      'Everything in Better',
      'Commercial-grade finish',
      'Custom stain matching',
      '4 coats finish',
      'Baseboard touch-up',
      'Furniture moving assistance',
      'Premium cleanup',
    ],
  },
];

/**
 * Default margin targets per tier
 * These are TARGETS - actual margins must be >= company minimum
 */
export const DEFAULT_TIER_MARGINS = {
  good: 30,   // Minimum acceptable
  better: 38, // Standard profit
  best: 45,   // Premium profit
};

interface UseProposalGenerationReturn {
  generateTiers: (baseCost: number, minMargin: number) => ProposalTier[];
  validateAllTiers: (tiers: ProposalTier[], minMargin: number) => ProposalValidation;
  fetchProjectData: (projectId: string) => Promise<ProposalData | null>;
  isLoading: boolean;
  error: string | null;
}

export function useProposalGeneration(): UseProposalGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate tier prices from base cost
   * Formula: price = baseCost / (1 - margin/100)
   * All margins are clamped to minimum
   */
  const generateTiers = useCallback((baseCost: number, minMargin: number): ProposalTier[] => {
    return TIER_TEMPLATES.map((template) => {
      // Get target margin, ensure it's at least minimum
      const targetMargin = Math.max(DEFAULT_TIER_MARGINS[template.id], minMargin);
      
      // Calculate price from cost and margin
      // price = cost / (1 - margin%)
      const price = baseCost / (1 - targetMargin / 100);
      
      return {
        ...template,
        price: Math.ceil(price), // Round up to nearest dollar
        margin_percent: targetMargin,
      };
    });
  }, []);

  /**
   * Validate all tiers against minimum margin
   * BLOCKING: Any tier below minimum = proposal blocked
   */
  const validateAllTiers = useCallback((tiers: ProposalTier[], minMargin: number): ProposalValidation => {
    const tierValidations: TierValidation[] = tiers.map((tier) => {
      const isValid = tier.margin_percent >= minMargin;
      return {
        tier_id: tier.id,
        is_valid: isValid,
        margin_percent: tier.margin_percent,
        error_message: isValid 
          ? null 
          : `BLOCKED: ${tier.name} tier margin ${tier.margin_percent}% < minimum ${minMargin}%`,
      };
    });

    const blockedTiers = tierValidations
      .filter((v) => !v.is_valid)
      .map((v) => v.tier_id);

    return {
      all_valid: blockedTiers.length === 0,
      min_margin: minMargin,
      tier_validations: tierValidations,
      blocked_tiers: blockedTiers,
    };
  }, []);

  /**
   * Fetch all data needed for proposal generation
   */
  const fetchProjectData = useCallback(async (projectId: string): Promise<ProposalData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw new Error('Project not found: ' + projectError.message);

      // Fetch job costs
      const { data: jobCost, error: costError } = await supabase
        .from('job_costs')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (costError) throw new Error('Job costs not found. Calculate costs first.');

      // Fetch company settings for minimum margin
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('default_margin_min_percent')
        .limit(1)
        .single();

      const minMargin = settings?.default_margin_min_percent ?? 30;
      const baseCost = jobCost.total_cost ?? 0;

      // Generate tiers
      const tiers = generateTiers(baseCost, minMargin);

      // Validate all tiers
      const validation = validateAllTiers(tiers, minMargin);
      
      if (!validation.all_valid) {
        throw new Error('BLOCKED: Some tiers below minimum margin. Adjust costs.');
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      return {
        project_id: projectId,
        customer_name: project.customer_name,
        customer_email: project.customer_email,
        customer_phone: project.customer_phone,
        address: [project.address, project.city, project.zip_code].filter(Boolean).join(', '),
        project_type: project.project_type,
        square_footage: project.square_footage ?? 0,
        tiers,
        created_at: new Date().toISOString(),
        valid_until: validUntil.toISOString(),
        base_cost: baseCost,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [generateTiers, validateAllTiers]);

  return {
    generateTiers,
    validateAllTiers,
    fetchProjectData,
    isLoading,
    error,
  };
}
