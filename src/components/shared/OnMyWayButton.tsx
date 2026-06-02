import { Button, type ButtonProps } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { toast } from "sonner";

interface Props extends Omit<ButtonProps, "onClick"> {
  phone?: string | null;
  customerName?: string | null;
  label?: string;
}

/**
 * One-tap "On My Way" — opens the native SMS composer with a pre-filled
 * message to the customer. Pure client-side, no infra, zero cost.
 * Cross-platform: `sms:NUMBER?body=…` works on iOS 8+ and Android.
 */
export function OnMyWayButton({
  phone,
  customerName,
  label = "On My Way",
  variant = "outline",
  size = "sm",
  className,
  disabled,
  ...rest
}: Props) {
  const { companyName } = useCompanySettings();

  const handleClick = () => {
    if (!phone) {
      toast.error("No customer phone on file");
      return;
    }
    const name = (customerName?.split(" ")[0] || "there").trim();
    const body = `Hi ${name}, this is ${companyName} — our crew is on the way to your place now. We'll see you shortly. Reply or call with any questions.`;
    // iOS prefers &body, Android prefers ?body — `?&body=` is the safe combo.
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    const href = `sms:${cleanPhone}?&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={disabled || !phone}
      title={phone ? "Send 'On My Way' SMS to customer" : "No customer phone on file"}
      {...rest}
    >
      <Navigation className="w-3.5 h-3.5 mr-1.5" />
      {label}
    </Button>
  );
}
