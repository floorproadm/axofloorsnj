import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader2, Save, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useProjectNotes, useUpsertProjectNotes, type ProjectNotes } from "@/hooks/useProjectNotes";
import { useProjectPhotos } from "@/hooks/useProjectPhotos";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from "jspdf";

const WOOD_SUGGESTIONS = ["Red Oak", "White Oak", "Maple", "Pine", "Bamboo", "Vinyl"];
const FINISH_TYPES = ["Oil-Based Polyurethane", "Water-Based Polyurethane", "Hardwax Oil", "None"];

interface Props {
  projectId: string;
  project: any;
}

export function ProjectTechSheet({ projectId, project }: Props) {
  const { data: notes } = useProjectNotes(projectId);
  const { data: photos = [] } = useProjectPhotos(projectId);
  const upsert = useUpsertProjectNotes();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const [form, setForm] = useState<Partial<ProjectNotes>>({});

  useEffect(() => {
    if (notes) setForm(notes);
  }, [notes]);

  const set = (k: keyof ProjectNotes, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    await upsert.mutateAsync({
      projectId,
      patch: {
        wood_type: form.wood_type || null,
        stain: form.stain || null,
        finish_type: form.finish_type || null,
        coats: form.coats ?? null,
        client_notes: form.client_notes || null,
        tech_notes: form.tech_notes || null,
        actual_start_date: form.actual_start_date || null,
        actual_end_date: form.actual_end_date || null,
      },
    });
    toast({ title: "Ficha salva" });
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 15;

      // Header
      doc.setFillColor(15, 27, 61); // navy
      doc.rect(0, 0, W, 22, "F");
      doc.setTextColor(201, 168, 76); // gold
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AXO FLOORS", 14, 14);
      doc.setFontSize(9);
      doc.setTextColor(230, 230, 230);
      doc.text("Ficha Técnica do Projeto", 14, 19);
      y = 30;

      // Project info
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(project.customer_name || "Projeto", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const address = [project.address, project.city, project.zip_code].filter(Boolean).join(", ");
      if (address) { doc.text(address, 14, y); y += 5; }
      if (project.customer_phone) { doc.text(`Tel: ${project.customer_phone}`, 14, y); y += 5; }
      y += 4;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y, W - 14, y);
      y += 8;

      // Tech fields
      const fields: [string, string][] = [
        ["Tipo de Madeira", form.wood_type || "—"],
        ["Stain", form.stain || "—"],
        ["Finish", form.finish_type || "—"],
        ["Demãos", form.coats ? String(form.coats) : "—"],
        ["Início Real", form.actual_start_date ? format(new Date(form.actual_start_date), "dd/MM/yyyy") : "—"],
        ["Conclusão Real", form.actual_end_date ? format(new Date(form.actual_end_date), "dd/MM/yyyy") : "—"],
      ];

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Especificações", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      fields.forEach(([k, v]) => {
        doc.setTextColor(110, 110, 110);
        doc.text(k + ":", 14, y);
        doc.setTextColor(20, 20, 20);
        doc.text(v, 60, y);
        y += 6;
      });
      y += 4;

      if (form.client_notes) {
        doc.setFont("helvetica", "bold"); doc.text("Observações do Cliente", 14, y); y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(form.client_notes, W - 28);
        doc.text(lines, 14, y); y += lines.length * 5 + 4;
      }
      if (form.tech_notes) {
        doc.setFont("helvetica", "bold"); doc.text("Notas Técnicas", 14, y); y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(form.tech_notes, W - 28);
        doc.text(lines, 14, y); y += lines.length * 5 + 4;
      }

      // Photos (first 4 thumbnails)
      const samplePhotos = photos.slice(0, 4);
      if (samplePhotos.length > 0) {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold"); doc.text("Fotos do Projeto", 14, y); y += 6;
        const thumbW = 40, thumbH = 30, gap = 4;
        for (let i = 0; i < samplePhotos.length; i++) {
          const p = samplePhotos[i];
          try {
            const dataUrl = await urlToDataURL(p.annotated_url || p.photo_url);
            const col = i % 4;
            doc.addImage(dataUrl, "JPEG", 14 + col * (thumbW + gap), y, thumbW, thumbH);
          } catch {}
        }
        y += thumbH + 6;
      }

      // Footer
      const PH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} · AXO Floors`, 14, PH - 8);

      doc.save(`ficha-${(project.customer_name || "projeto").replace(/\s+/g, "-")}.pdf`);
    } catch (e: any) {
      toast({ title: "Erro ao gerar PDF", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0" />
            Ficha Técnica
          </CardTitle>
          {project?.customer_id && (
            <Link to={`/admin/customers/${project.customer_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Ver perfil do cliente <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button size="sm" variant="outline" onClick={save} disabled={upsert.isPending} className="flex-1 sm:flex-none">
            {upsert.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Salvar
          </Button>
          <Button size="sm" onClick={exportPDF} disabled={exporting} className="flex-1 sm:flex-none">
            {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
            Exportar PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Madeira</Label>
            <Input
              list="wood-suggest"
              value={form.wood_type || ""}
              onChange={(e) => set("wood_type", e.target.value)}
              placeholder="Red Oak, White Oak, ..."
            />
            <datalist id="wood-suggest">
              {WOOD_SUGGESTIONS.map((w) => <option key={w} value={w} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Stain (cor + marca)</Label>
            <Input
              value={form.stain || ""}
              onChange={(e) => set("stain", e.target.value)}
              placeholder="Early American — Minwax"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Finish</Label>
            <Select value={form.finish_type || ""} onValueChange={(v) => set("finish_type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {FINISH_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Número de Demãos</Label>
            <Input
              type="number" min={1} max={5}
              value={form.coats ?? ""}
              onChange={(e) => set("coats", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data de Início Real</Label>
            <Input
              type="date"
              value={form.actual_start_date || ""}
              onChange={(e) => set("actual_start_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data de Conclusão Real</Label>
            <Input
              type="date"
              value={form.actual_end_date || ""}
              onChange={(e) => set("actual_end_date", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Observações do Cliente</Label>
            <Textarea rows={3} value={form.client_notes || ""} onChange={(e) => set("client_notes", e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs">Notas Técnicas da Equipe</Label>
            <Textarea rows={3} value={form.tech_notes || ""} onChange={(e) => set("tech_notes", e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function urlToDataURL(url: string): Promise<string> {
  const res = await fetch(url, { mode: "cors" });
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
