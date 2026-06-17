/**
 * Returns a user-safe display name for a project/customer.
 * Filters internal placeholders like "TBD (via parceiro)" out of
 * portal-facing UIs (collaborator/partner). Falls back to the
 * project address, then a generic label.
 */
export function projectDisplayName(
  customerName?: string | null,
  address?: string | null,
  fallback: string = "Cliente pendente",
): string {
  const name = (customerName ?? "").trim();
  const isInternalPlaceholder = !name || /^TBD\b/i.test(name) || /parceiro/i.test(name);
  if (!isInternalPlaceholder) return name;
  const addr = (address ?? "").trim();
  if (addr) return addr;
  return fallback;
}
