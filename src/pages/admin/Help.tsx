import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Help() {
  const { language } = useLanguage();

  return (
    <AdminLayout title={language === "pt" ? "Ajuda" : "Help"}>
      <Card className="border-l-4 border-l-primary shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {language === "pt" ? "Central de Ajuda" : "Help Center"}
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          {language === "pt"
            ? "Documentação, tutoriais e suporte. Em breve."
            : "Documentation, tutorials and support. Coming soon."}
        </p>
      </Card>
    </AdminLayout>
  );
}
