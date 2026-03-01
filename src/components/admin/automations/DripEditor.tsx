import { useState } from "react";
import { AutomationDrip } from "@/hooks/useAutomationFlows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Trash2, MessageSquare, Mail, Phone } from "lucide-react";

const CHANNEL_CONFIG: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  sms: { label: "SMS", icon: Phone, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  email: { label: "Email", icon: Mail, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "bg-green-500/10 text-green-600 border-green-500/20" },
};

interface DripEditorProps {
  drip: AutomationDrip;
  onUpdate: (updates: Partial<AutomationDrip> & { id: string }) => void;
  onDelete: (id: string) => void;
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

  if (editing) {
    return (
      <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={delayDays}
              onChange={(e) => setDelayDays(Number(e.target.value))}
              className="w-16 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">days</span>
            <Input
              type="number"
              min={0}
              max={23}
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value))}
              className="w-16 h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">hrs</span>
          </div>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {channel === "email" && (
          <Input
            placeholder="Subject line..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm"
          />
        )}
        <Textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="text-sm"
          placeholder="Message template... use {{name}}, {{service}}"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/50 rounded-lg p-3 hover:border-border transition-colors group bg-card/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${channelInfo.color}`}>
              <ChannelIcon className="w-3 h-3 mr-1" />
              {channelInfo.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {drip.delay_days > 0 ? `${drip.delay_days}d` : ""}{drip.delay_hours > 0 ? ` ${drip.delay_hours}h` : ""}{drip.delay_days === 0 && drip.delay_hours === 0 ? "Immediate" : ""}
            </span>
          </div>
          {drip.subject && (
            <p className="text-xs font-medium text-foreground mb-0.5">{drip.subject}</p>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2">{drip.message_template || "Empty template"}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Switch
            checked={drip.is_active}
            onCheckedChange={(checked) => onUpdate({ id: drip.id, is_active: checked })}
            className="scale-75"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
            <MessageSquare className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(drip.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
