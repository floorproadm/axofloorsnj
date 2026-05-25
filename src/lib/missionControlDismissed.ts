// Shared helpers for the Mission Control "dismissed alerts" state.
// Kept in localStorage so the Dashboard counter and the Mission Control page
// stay in sync without a backend round-trip.

export const MC_DISMISSED_KEY = "mc:dismissed-alerts";
export const MC_DISMISSED_EVENT = "mc:dismissed-changed";

export const mcAlertKey = (a: { type: string; label: string; entityId?: string | null }) =>
  `${a.type}::${a.entityId ?? a.label}`;

export const readMcDismissed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(MC_DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
};

export const writeMcDismissed = (keys: string[]) => {
  localStorage.setItem(MC_DISMISSED_KEY, JSON.stringify(keys));
  window.dispatchEvent(new Event(MC_DISMISSED_EVENT));
};
