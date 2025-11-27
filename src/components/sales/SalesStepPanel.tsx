import { X, CheckCircle2, Lightbulb, Target } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SalesStep } from "./salesStepsData";

interface SalesStepPanelProps {
  step: SalesStep | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalesStepPanel = ({ step, isOpen, onClose }: SalesStepPanelProps) => {
  if (!step) return null;

  const getIcon = (heading: string) => {
    if (heading.toLowerCase().includes("objetivo")) return <Target className="h-5 w-5" />;
    if (heading.toLowerCase().includes("checklist")) return <CheckCircle2 className="h-5 w-5" />;
    if (heading.toLowerCase().includes("frase")) return <Lightbulb className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b border-border pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gold mb-2">
                Step {step.id}
              </div>
              <SheetTitle className="text-2xl font-heading text-navy">
                {step.title}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {step.subtitle}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8">
          {step.sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-gold">{getIcon(section.heading)}</div>
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  {section.heading}
                </h3>
              </div>

              {section.text && (
                <p className="text-muted-foreground leading-relaxed pl-7">
                  {section.text}
                </p>
              )}

              {section.items && (
                <ul className="space-y-2 pl-7">
                  {section.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start gap-2 text-muted-foreground"
                    >
                      <span className="text-gold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {section.highlight && (
                <div className="bg-gold/10 border-l-4 border-gold rounded-r-lg p-4 pl-7 ml-0">
                  <p className="text-foreground font-medium italic">
                    {section.highlight}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
