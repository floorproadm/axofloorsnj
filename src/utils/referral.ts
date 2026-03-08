/**
 * Extracts referral code from URL search params (?ref=CODE)
 * Used by lead capture forms to auto-link referrals
 */
export function getReferralCodeFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || null;
}

/**
 * Appends referral info to lead notes
 */
export function buildReferralNotes(existingNotes: string | null, refCode: string): string {
  const refNote = `[Referral: ${refCode}]`;
  return existingNotes ? `${refNote} ${existingNotes}` : refNote;
}
