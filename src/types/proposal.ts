/**
 * Proposal Tier System
 * Good / Better / Best pricing structure
 * All tiers MUST respect company minimum margin
 */

export interface ProposalTier {
  id: 'good' | 'better' | 'best';
  name: string;
  price: number;
  margin_percent: number;
  short_description: string;
  features: string[];
}

export interface ProposalData {
  project_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  project_type: string;
  square_footage: number;
  tiers: ProposalTier[];
  created_at: string;
  valid_until: string;
  base_cost: number; // Total cost (labor + material + additional)
}

export interface TierValidation {
  tier_id: string;
  is_valid: boolean;
  margin_percent: number;
  error_message: string | null;
}

export interface ProposalValidation {
  all_valid: boolean;
  min_margin: number;
  tier_validations: TierValidation[];
  blocked_tiers: string[];
}
