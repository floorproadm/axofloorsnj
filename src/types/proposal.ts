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

export type ProposalMode = 'tiers' | 'direct';

export interface ProposalLineItem {
  description: string;
  category: string;
  amount: number;
}

export interface ProposalData {
  project_id: string;
  proposal_id?: string;
  proposal_number?: string;
  proposal_status?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  project_type: string;
  square_footage: number;
  mode: ProposalMode;
  tiers: ProposalTier[];
  flat_price?: number;
  flat_margin_percent?: number;
  line_items?: ProposalLineItem[];
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
