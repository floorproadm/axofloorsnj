import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { SalesStepPanel } from "@/components/sales/SalesStepPanel";
import { salesSteps } from "@/components/sales/salesStepsData";

const Sales2026 = () => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-navy mb-4">
            AXO™ Smart Sales System
          </h1>
          <p className="text-lg text-muted-foreground">
            Interactive Flowchart – Click to Expand
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {salesSteps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => setSelectedStep(index)}
                className="w-full group"
              >
                <div className="bg-card border-2 border-border hover:border-gold rounded-xl p-6 transition-all hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="text-sm font-medium text-gold mb-1">
                        Step {index + 1}
                      </div>
                      <h3 className="text-xl font-heading font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.subtitle}
                      </p>
                    </div>
                    <div className="text-gold group-hover:scale-110 transition-transform">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>

              {index < salesSteps.length - 1 && (
                <div className="my-4">
                  <ArrowDown className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <SalesStepPanel
        step={selectedStep !== null ? salesSteps[selectedStep] : null}
        isOpen={selectedStep !== null}
        onClose={() => setSelectedStep(null)}
      />
    </div>
  );
};

export default Sales2026;
