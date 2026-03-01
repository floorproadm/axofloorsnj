import { useState } from "react";
import { AutomationDrip } from "@/hooks/useAutomationFlows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Trash2, Mail, Phone, MessageSquare, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CHANNEL_CONFIG: Record<string, { label: string; icon: typeof Mail; badgeClass: string }> = {
  sms: { label: "SMS", icon: Phone, badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  email: { label: "Email", icon: Mail, badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, badgeClass: "bg-green-500/10 text-green-500 border-green-500/20" },
};

interface DripEditorProps {
  drip: AutomationDrip;
  onUpdate: (updates: Partial<AutomationDrip> & { id: string }) => void;
  onDelete: (id: string) => void;
}

function formatDelay(days: number, hours: number): string {
  if (days === 0 && hours === 0) return "Immediate";
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  return parts.join(" ");
}

export function DripEditor({ drip, onUpdate, onDelete }: DripEditorProps) {
  const [editing, setEditing] = useState(false);
  const [template, setTemplate] = useState(drip.message_template);
  const [subject, setSubject] = useState(drip.subject || "");
  const [delayDays, setDelayDays] = useState(drip.delay_days);
  const [delayHours, setDelayHours] = useState(drip.delay_hours);
  const [channel, setChannel] = useState(drip.channel);

  const channelInfo = CHANNEL_CONFIG[drip.channel] || CHANNEL_CONFIG.sms;
  const ChannelIcon = channelInfo.icon;

  const handleSave = () => {
    onUpdate({
      id: drip.id,
      message_template: template,
      subject: subject || null,
      delay_days: delayDays,
      delay_hours: delayHours,
      channel,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setTemplate(drip.message_template);
    setSubject(drip.subject || "");
    setDelayDays(drip.delay_days);
    setDelayHours(drip.delay_hours);
    setChannel(drip.channel);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-lg p-3.5 space-y-3 bg-card shadow-sm shadow-primary/5">
        {/* Timing + Channel Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value))}
              className="w-14 h-7 text-xs bg-card"
            />
            <span className="text-[10px] text-muted-foreground">days</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value))}
              className="w-14 h-7 text-xs bg-card"
            />
            <span className="text-[10px] text-muted-foreground">hrs</span>
          </div>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">📱 SMS</SelectItem>
              <SelectItem value="email">📧 Email</SelectItem>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {channel === "email" && (
          <Input
            placeholder="Subject line..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-xs h-8"
          />
        )}

        <Textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={4}
          className="text-xs leading-relaxed font-mono resize-none"
          placeholder="Message template... use {{first_name}}, {{company_name}}, etc."
        />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleCancel}>
            <X className="w-3 h-3" />
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
            <Check className="w-3 h-3" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg p-2.5 group transition-all duration-150 cursor-pointer",
      drip.is_active
        ? "bg-card/80 hover:bg-card border border-border/30 hover:border-border/60"
        : "bg-muted/20 border border-border/20 opacity-50"
    )}
      onClick={() => setEditing(true)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Top row: channel + timing */}
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5 gap-1", channelInfo.badgeClass)}>
              <ChannelIcon className="w-3 h-3" />
              {channelInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDelay(drip.delay_days, drip.delay_hours)}
            </span>
          </div>

          {/* Subject */}
          {drip.subject && (
            <p className="text-sm font-medium text-foreground mb-0.5 truncate">{drip.subject}</p>
          )}

          {/* Message preview */}
          <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
            {drip.message_template || "Empty template — click to edit"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={drip.is_active}
            onCheckedChange={(checked) => onUpdate({ id: drip.id, is_active: checked })}
            className="scale-[0.6]"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(drip.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
