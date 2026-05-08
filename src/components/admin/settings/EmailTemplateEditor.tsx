import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, FileEdit, RotateCcw } from "lucide-react";

interface EmailTemplate {
  id: string;
  template_key: string;
  subject_template: string;
  body_template: string;
  description: string | null;
  variables: string[];
}

const TEMPLATE_LABELS: Record<string, string> = {
  lead_followup: "Lead Follow-up",
  proposal_sent: "Proposal Sent",
  appointment_confirmed: "Appointment Confirmed",
  project_started: "Project Started",
  project_completed: "Project Completed",
  invoice_sent: "Invoice Sent",
};

export default function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("template_key");
    if (error) {
      toast.error("Failed to load templates");
      console.error(error);
    } else {
      setTemplates(data || []);
      if (data?.length && !activeKey) {
        selectTemplate(data[0]);
      }
    }
    setLoading(false);
  };

  const selectTemplate = (t: EmailTemplate) => {
    setActiveKey(t.template_key);
    setEditSubject(t.subject_template);
    setEditBody(t.body_template);
    setShowPreview(false);
  };

  const active = templates.find((t) => t.template_key === activeKey);

  const handleSave = async () => {
    if (!active) return;
    setSaving(active.template_key);
    const { error } = await supabase
      .from("email_templates")
      .update({ subject_template: editSubject, body_template: editBody })
      .eq("id", active.id);
    if (error) {
      toast.error("Failed to save template");
    } else {
      toast.success("Template saved");
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, subject_template: editSubject, body_template: editBody } : t
        )
      );
    }
    setSaving(null);
  };

  const handleReset = () => {
    if (active) {
      setEditSubject(active.subject_template);
      setEditBody(active.body_template);
    }
  };

  const isDirty = active && (editSubject !== active.subject_template || editBody !== active.body_template);

  const renderPreview = () => {
    if (!active) return "";
    let html = editBody;
    for (const v of active.variables) {
      html = html.replaceAll(`{{${v}}}`, `<span style="background:#fef3c7;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px">{{${v}}}</span>`);
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;line-height:1.6;margin:0;padding:0}
.container{max-width:600px;margin:0 auto;padding:32px 24px}
.header{text-align:center;padding:24px 0;border-bottom:2px solid #8B6914}
.header h1{color:#8B6914;font-size:24px;margin:0}
.content{padding:24px 0}
.btn{display:inline-block;background:#8B6914;color:#fff!important;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;margin:16px 0}
.footer{border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:12px;color:#999}
</style></head><body><div class="container">
<div class="header"><h1>AXO Floors</h1></div>
<div class="content">${html}</div>
<div class="footer">AXO Floors · New Jersey · (732) 351-8653<br>axofloorsnj@gmail.com</div>
</div></body></html>`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary shadow-sm p-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <FileEdit className="w-5 h-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Email Templates</h3>
        <span className="text-xs text-muted-foreground ml-auto">Edit copy & CTA links — no redeploy needed</span>
      </div>

      <div className="flex flex-col md:flex-row min-h-[500px]">
        {/* Template list */}
        <div className="md:w-52 border-b md:border-b-0 md:border-r border-border p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {templates.map((t) => (
            <button
              key={t.template_key}
              onClick={() => selectTemplate(t)}
              className={`text-left px-3 py-2 rounded-md text-sm whitespace-nowrap md:whitespace-normal transition-colors ${
                activeKey === t.template_key
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {TEMPLATE_LABELS[t.template_key] || t.template_key}
            </button>
          ))}
        </div>

        {/* Editor */}
        {active && (
          <div className="flex-1 p-4 space-y-4 overflow-auto">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="font-medium text-foreground">
                  {TEMPLATE_LABELS[active.template_key]}
                </h4>
                {active.description && (
                  <p className="text-xs text-muted-foreground">{active.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-1.5"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? "Edit" : "Preview"}
                </Button>
                {isDirty && (
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || saving === active.template_key}
                  className="gap-1.5"
                >
                  {saving === active.template_key ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            {/* Variables */}
            <div className="flex flex-wrap gap-1.5">
              {active.variables.map((v) => (
                <Badge key={v} variant="secondary" className="text-xs font-mono">
                  {"{{" + v + "}}"}
                </Badge>
              ))}
            </div>

            {showPreview ? (
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
                  Subject: {editSubject}
                </div>
                <iframe
                  srcDoc={renderPreview()}
                  className="w-full h-[400px] border-0"
                  title="Email Preview"
                  sandbox=""
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Subject Line</Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Body (HTML)</Label>
                  <Textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="font-mono text-xs min-h-[300px] leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
