import { Building2 } from "lucide-react";
import { useCustomerProperties } from "@/hooks/useCustomerProperties";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  customerId: string | null | undefined;
  value: string | null | undefined;
  onChange: (propertyId: string | null) => void;
  /** Hide entirely when customer has fewer than 2 properties. Default: true. */
  hideWhenSingle?: boolean;
  /** Show label above the select. */
  label?: string;
  className?: string;
}

/**
 * Property selector — only renders when the customer has 2+ properties.
 * For single-property customers it stays hidden (or shows label-only) and
 * the parent should leave property_id null (server inherits / falls back).
 */
export function PropertyPicker({
  customerId,
  value,
  onChange,
  hideWhenSingle = true,
  label = "Propriedade",
  className,
}: Props) {
  const { data: properties = [], isLoading } = useCustomerProperties(customerId);

  if (!customerId) return null;
  if (isLoading) return null;
  if (hideWhenSingle && properties.length < 2) return null;

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
          <Building2 className="w-3 h-3" /> {label}
        </label>
      )}
      <Select
        value={value ?? "__none"}
        onValueChange={(v) => onChange(v === "__none" ? null : v)}
      >
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="Selecionar propriedade…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">— Sem propriedade específica —</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.unit_identifier}
              {p.is_primary ? " (Principal)" : ""}
              {p.resident_name ? ` — ${p.resident_name}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
