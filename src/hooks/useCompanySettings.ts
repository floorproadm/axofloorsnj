import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LaborPricingModel = 'sqft' | 'daily';

export interface CompanySettings {
  id: string;
  company_name: string;
  default_margin_min_percent: number;
  labor_pricing_model: LaborPricingModel;
  default_labor_rate: number;
  created_at: string;
  updated_at: string;
}

// Default values (fallback if DB read fails)
const DEFAULT_SETTINGS: Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'> = {
  company_name: 'AXO Floors',
  default_margin_min_percent: 30,
  labor_pricing_model: 'sqft',
  default_labor_rate: 3.50,
};

/**
 * Hook to fetch and manage company settings
 * Single-tenant: always returns one row
 */
export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data as unknown as CompanySettings);
      } else {
        // No settings found - use defaults
        setSettings(null);
      }
    } catch (err) {
      console.error('Failed to fetch company settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refetch: fetchSettings,
    // Convenience getters with fallback to defaults
    companyName: settings?.company_name ?? DEFAULT_SETTINGS.company_name,
    marginMinPercent: settings?.default_margin_min_percent ?? DEFAULT_SETTINGS.default_margin_min_percent,
    laborPricingModel: settings?.labor_pricing_model ?? DEFAULT_SETTINGS.labor_pricing_model,
    laborRate: settings?.default_labor_rate ?? DEFAULT_SETTINGS.default_labor_rate,
  };
}

/**
 * Utility function for one-time fetch (non-reactive)
 * Use in edge functions or non-React contexts
 */
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch company settings:', error);
    return null;
  }

  return data as unknown as CompanySettings;
}

/**
 * Get settings with fallback defaults (never returns null)
 */
export async function getCompanySettingsWithDefaults(): Promise<Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>> {
  const settings = await getCompanySettings();
  
  if (!settings) {
    return DEFAULT_SETTINGS;
  }

  return {
    company_name: settings.company_name,
    default_margin_min_percent: settings.default_margin_min_percent,
    labor_pricing_model: settings.labor_pricing_model,
    default_labor_rate: settings.default_labor_rate,
  };
}
