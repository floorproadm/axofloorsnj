import { Fuel, Package, Hammer, Wrench, UtensilsCrossed, Plane, Megaphone, MoreHorizontal } from "lucide-react";

export interface ExpenseCategory {
  key: string;
  icon: typeof Fuel;
  bgClass: string;
  textClass: string;
  badgeClass: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { key: "Fuel",       icon: Fuel,             bgClass: "bg-yellow-100 dark:bg-yellow-900/20", textClass: "text-yellow-700 dark:text-yellow-400", badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800" },
  { key: "Supplies",   icon: Package,          bgClass: "bg-blue-100 dark:bg-blue-900/20",     textClass: "text-blue-700 dark:text-blue-400",     badgeClass: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  { key: "Materials",  icon: Hammer,           bgClass: "bg-green-100 dark:bg-green-900/20",   textClass: "text-green-700 dark:text-green-400",   badgeClass: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  { key: "Equipment",  icon: Wrench,           bgClass: "bg-purple-100 dark:bg-purple-900/20", textClass: "text-purple-700 dark:text-purple-400", badgeClass: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" },
  { key: "Meals",      icon: UtensilsCrossed,  bgClass: "bg-orange-100 dark:bg-orange-900/20", textClass: "text-orange-700 dark:text-orange-400", badgeClass: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" },
  { key: "Travel",     icon: Plane,            bgClass: "bg-cyan-100 dark:bg-cyan-900/20",     textClass: "text-cyan-700 dark:text-cyan-400",     badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800" },
  { key: "Marketing",  icon: Megaphone,        bgClass: "bg-pink-100 dark:bg-pink-900/20",     textClass: "text-pink-700 dark:text-pink-400",     badgeClass: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800" },
  { key: "Other",      icon: MoreHorizontal,   bgClass: "bg-muted",                             textClass: "text-muted-foreground",                 badgeClass: "bg-muted text-muted-foreground border-border" },
];

export const PILL_CATEGORIES = ["All", "Fuel", "Supplies", "Materials", "Equipment", "Meals", "Other"];

export function expenseCategoryBadgeClass(key: string): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.key.toLowerCase() === key.toLowerCase());
  return found?.badgeClass || "bg-muted text-muted-foreground border-border";
}

/** Map an expense subcategory to the payments.category enum stored in DB. */
export function paymentCategoryFor(key: string): "material" | "labor" | "other" {
  const k = key.toLowerCase();
  if (k === "materials" || k === "supplies") return "material";
  return "other";
}

/** Extract the subcategory ([Fuel], [Materials], etc.) from a payment description. */
export function extractExpenseCategory(desc: string | null): string | null {
  if (!desc) return null;
  const m = desc.match(/^\[(Fuel|Supplies|Materials|Equipment|Meals|Travel|Marketing|Other)\]/i);
  return m ? m[1] : null;
}

/** Extract vendor from description pattern "[Cat] @ Vendor [REIMBURSABLE]" */
export function extractVendor(desc: string | null): string | null {
  if (!desc) return null;
  const m = desc.match(/@\s*([^\[]+?)(?:\s*\[|$)/);
  return m ? m[1].trim() : null;
}

export function isReimbursable(desc: string | null): boolean {
  return !!desc?.includes("[REIMBURSABLE]");
}
