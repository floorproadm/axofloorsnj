import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Hammer, Sparkles, Wrench, Home, Building2, Building, Calendar, Palette, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput, useFieldValidation } from "@/utils/validation";
import { AXO_ORG_ID } from "@/lib/constants";
import { AddressAutocomplete } from "@/components/admin/AddressAutocomplete";
import SEOHead from "@/components/shared/SEOHead";

type ServiceType = "refinishing" | "new-installation" | "repair" | "";
type WoodSpecies = "oak" | "maple" | "pine" | "other" | "";
type Condition = "good" | "worn" | "damaged" | "";
type ColorIntent = "same" | "lighter" | "darker" | "";
type MaterialType = "hardwood" | "engineered" | "laminate" | "vinyl" | "";
type SubfloorReady = "yes" | "no" | "not-sure" | "";
type BudgetRange = "3.5k-7k" | "7k-15k" | "15k+" | "";
type AffectedArea = "small" | "medium" | "large" | "";
type PropertyType = "house" | "condo" | "commercial" | "";
type Timeline = "asap" | "1-month" | "1-3-months" | "planning" | "";

interface FormState {
  // Step 1
  serviceType: ServiceType;
  // Step 2 — Refinishing
  floorAreaRefinish: string;
  woodSpecies: WoodSpecies;
  condition: Condition;
  colorIntent: ColorIntent;
  // Step 2 — New Installation
  floorAreaInstall: string;
  materialType: MaterialType;
  subfloorReady: SubfloorReady;
  budgetRange: BudgetRange;
  // Step 2 — Repair
  issueDescription: string;
  affectedArea: AffectedArea;
  // Step 3
  propertyType: PropertyType;
  address: string;
  city: string;
  zipCode: string;
  timeline: Timeline;
  // Step 4
  name: string;
  email: string;
  phone: string;
}

const initialState: FormState = {
  serviceType: "",
  floorAreaRefinish: "",
  woodSpecies: "",
  condition: "",
  colorIntent: "",
  floorAreaInstall: "",
  materialType: "",
  subfloorReady: "",
  budgetRange: "",
  issueDescription: "",
  affectedArea: "",
  propertyType: "",
  address: "",
  city: "",
  zipCode: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
};

const TOTAL_STEPS = 4;

// Reusable selectable card
const OptionCard = ({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: any;
  title: string;
  description?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
      selected
        ? "border-primary bg-primary/5 shadow-md"
        : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
    }`}
  >
    {Icon && (
      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="w-5 h-5" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-foreground">{title}</div>
      {description && <div className="text-sm text-muted-foreground mt-0.5">{description}</div>}
    </div>
    {selected && (
      <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        <Check className="w-4 h-4" />
      </div>
    )}
  </button>
);

const ProjectWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { validateField } = useFieldValidation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.serviceType) {
        toast({ title: "Select a service type", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      if (form.serviceType === "refinishing") {
        if (!form.floorAreaRefinish || !form.woodSpecies || !form.condition || !form.colorIntent) {
          toast({ title: "Please complete all fields", variant: "destructive" });
          return false;
        }
      }
      if (form.serviceType === "new-installation") {
        if (!form.floorAreaInstall || !form.materialType || !form.subfloorReady || !form.budgetRange) {
          toast({ title: "Please complete all fields", variant: "destructive" });
          return false;
        }
      }
      if (form.serviceType === "repair") {
        if (!form.issueDescription.trim() || !form.affectedArea) {
          toast({ title: "Please describe the issue and select affected area", variant: "destructive" });
          return false;
        }
      }
    }
    if (step === 3) {
      if (!form.propertyType || !form.address.trim() || !form.timeline) {
        toast({ title: "Please complete property type, address and timeline", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const nameError = validateField(form.name, ["required", "name"]);
    const emailError = validateField(form.email, ["required", "email"]);
    const phoneError = validateField(form.phone, ["required", "phone"]);

    if (nameError || emailError || phoneError) {
      toast({
        title: "Please review your contact info",
        description: nameError || emailError || phoneError || "",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Build structured details for notes (preserves all data without schema change)
      const details: Record<string, any> = {
        wizard_version: "v1",
        service_type: form.serviceType,
        property_type: form.propertyType,
        timeline: form.timeline,
      };

      let servicesArr: string[] = [];
      let estimatedBudget: number | null = null;

      if (form.serviceType === "refinishing") {
        details.refinish = {
          floor_area_sqft: form.floorAreaRefinish,
          wood_species: form.woodSpecies,
          current_condition: form.condition,
          color_intent: form.colorIntent,
        };
        servicesArr = ["sanding-refinish"];
      } else if (form.serviceType === "new-installation") {
        details.installation = {
          floor_area_sqft: form.floorAreaInstall,
          material_type: form.materialType,
          subfloor_ready: form.subfloorReady,
          budget_range: form.budgetRange,
        };
        servicesArr = [`new-installation-${form.materialType}`];
        estimatedBudget = form.budgetRange === "3.5k-7k" ? 5250
          : form.budgetRange === "7k-15k" ? 11000
          : form.budgetRange === "15k+" ? 20000 : null;
      } else if (form.serviceType === "repair") {
        details.repair = {
          issue_description: sanitizeInput(form.issueDescription),
          affected_area: form.affectedArea,
        };
        servicesArr = ["repair"];
      }

      const notesText = `[Project Wizard Submission]\n${JSON.stringify(details, null, 2)}`;

      const dbData: any = {
        name: sanitizeInput(form.name),
        email: sanitizeInput(form.email),
        phone: sanitizeInput(form.phone),
        address: sanitizeInput(form.address),
        city: form.city ? sanitizeInput(form.city) : null,
        zip_code: form.zipCode ? sanitizeInput(form.zipCode) : null,
        lead_source: "project_wizard",
        status: "cold_lead",
        priority: form.timeline === "asap" ? "high" : "medium",
        services: servicesArr,
        notes: notesText,
        organization_id: AXO_ORG_ID,
        budget: estimatedBudget,
      };

      const { data: savedLead, error: saveError } = await supabase
        .from("leads")
        .insert([dbData])
        .select()
        .single();

      if (saveError) throw new Error(saveError.message);

      // Fire-and-forget integrations
      try {
        await supabase.functions.invoke("send-follow-up", {
          body: {
            name: form.name,
            email: form.email,
            source: "project_wizard",
            leadType: "project_wizard",
          },
        });
      } catch (e) {
        console.warn("Follow-up email failed:", e);
      }

      try {
        await supabase.functions.invoke("send-to-notion", {
          body: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            source: "project_wizard",
            services: servicesArr,
            notes: notesText,
          },
        });
      } catch (e) {
        console.warn("Notion sync failed:", e);
      }

      toast({
        title: "Project submitted! 🎉",
        description: "We'll reach out within 24 hours to schedule your estimate.",
      });

      navigate("/thank-you");
    } catch (error: any) {
      console.error("Project Wizard submission error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <SEOHead
        title="Project Wizard | AXO Floors"
        description="Tell us about your flooring project in under 2 minutes. Get a personalized estimate from AXO Floors."
      />

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</div>
            <Progress value={progress} className="h-1.5 mt-1" />
          </div>
          <div className="text-xs font-mono text-muted-foreground tabular-nums">
            {Math.round(progress)}%
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* STEP 1 — Service Type */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">What type of project?</h1>
              <p className="text-muted-foreground mt-2">Pick the option that best describes your needs.</p>
            </div>
            <div className="space-y-3">
              <OptionCard
                selected={form.serviceType === "refinishing"}
                onClick={() => update("serviceType", "refinishing")}
                icon={Sparkles}
                title="Refinishing"
                description="Restore the look of your existing hardwood floors."
              />
              <OptionCard
                selected={form.serviceType === "new-installation"}
                onClick={() => update("serviceType", "new-installation")}
                icon={Hammer}
                title="New Installation"
                description="Install brand new hardwood, engineered, laminate or vinyl."
              />
              <OptionCard
                selected={form.serviceType === "repair"}
                onClick={() => update("serviceType", "repair")}
                icon={Wrench}
                title="Repair / Other"
                description="Fix damaged boards, water damage, scratches, or other issues."
              />
            </div>
          </div>
        )}

        {/* STEP 2 — Conditional sub-form */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {form.serviceType === "refinishing" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Refinishing details</h1>
                  <p className="text-muted-foreground mt-2">Tell us about your existing floor.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor-area">Approximate floor area (sqft)</Label>
                  <Input
                    id="floor-area"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 850"
                    value={form.floorAreaRefinish}
                    onChange={(e) => update("floorAreaRefinish", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Wood species</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["oak", "maple", "pine", "other"] as WoodSpecies[]).map((s) => (
                      <OptionCard
                        key={s}
                        selected={form.woodSpecies === s}
                        onClick={() => update("woodSpecies", s)}
                        title={s.charAt(0).toUpperCase() + s.slice(1)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current condition</Label>
                  <div className="space-y-2">
                    <OptionCard selected={form.condition === "good"} onClick={() => update("condition", "good")} title="Good" description="Light wear, mostly cosmetic." />
                    <OptionCard selected={form.condition === "worn"} onClick={() => update("condition", "worn")} title="Worn" description="Visible wear, dull finish, scratches." />
                    <OptionCard selected={form.condition === "damaged"} onClick={() => update("condition", "damaged")} title="Damaged" description="Deep scratches, stains, water rings." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color change intent</Label>
                  <div className="space-y-2">
                    <OptionCard selected={form.colorIntent === "same"} onClick={() => update("colorIntent", "same")} icon={Palette} title="Keep similar tone" />
                    <OptionCard selected={form.colorIntent === "lighter"} onClick={() => update("colorIntent", "lighter")} icon={Palette} title="Go lighter" />
                    <OptionCard selected={form.colorIntent === "darker"} onClick={() => update("colorIntent", "darker")} icon={Palette} title="Go darker" />
                  </div>
                  {form.colorIntent && (
                    <button
                      type="button"
                      onClick={() => window.open("/stain-gallery", "_blank")}
                      className="text-sm text-primary underline mt-1"
                    >
                      Browse our Stain Gallery →
                    </button>
                  )}
                </div>
              </>
            )}

            {form.serviceType === "new-installation" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Installation details</h1>
                  <p className="text-muted-foreground mt-2">Help us spec your new floor.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor-area-install">Approximate floor area (sqft)</Label>
                  <Input
                    id="floor-area-install"
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 1200"
                    value={form.floorAreaInstall}
                    onChange={(e) => update("floorAreaInstall", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Material type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["hardwood", "engineered", "laminate", "vinyl"] as MaterialType[]).map((m) => (
                      <OptionCard
                        key={m}
                        selected={form.materialType === m}
                        onClick={() => update("materialType", m)}
                        title={m.charAt(0).toUpperCase() + m.slice(1)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Is the subfloor ready?</Label>
                  <div className="space-y-2">
                    <OptionCard selected={form.subfloorReady === "yes"} onClick={() => update("subfloorReady", "yes")} title="Yes" description="Old flooring removed, subfloor clean." />
                    <OptionCard selected={form.subfloorReady === "no"} onClick={() => update("subfloorReady", "no")} title="No" description="Old flooring still in place." />
                    <OptionCard selected={form.subfloorReady === "not-sure"} onClick={() => update("subfloorReady", "not-sure")} title="Not sure" description="We'll evaluate during the estimate." />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Budget range</Label>
                  <div className="space-y-2">
                    <OptionCard selected={form.budgetRange === "3.5k-7k"} onClick={() => update("budgetRange", "3.5k-7k")} icon={DollarSign} title="$3,500 – $7,000" />
                    <OptionCard selected={form.budgetRange === "7k-15k"} onClick={() => update("budgetRange", "7k-15k")} icon={DollarSign} title="$7,000 – $15,000" />
                    <OptionCard selected={form.budgetRange === "15k+"} onClick={() => update("budgetRange", "15k+")} icon={DollarSign} title="$15,000+" />
                  </div>
                </div>
              </>
            )}

            {form.serviceType === "repair" && (
              <>
                <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Repair details</h1>
                  <p className="text-muted-foreground mt-2">Describe what needs fixing.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue">Issue description</Label>
                  <Textarea
                    id="issue"
                    placeholder="Describe the damage (water, scratches, board replacement, etc.)"
                    value={form.issueDescription}
                    onChange={(e) => update("issueDescription", e.target.value)}
                    rows={5}
                    maxLength={1000}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Affected area</Label>
                  <div className="space-y-2">
                    <OptionCard selected={form.affectedArea === "small"} onClick={() => update("affectedArea", "small")} title="Small" description="A few boards or one small spot." />
                    <OptionCard selected={form.affectedArea === "medium"} onClick={() => update("affectedArea", "medium")} title="Medium" description="One room or larger section." />
                    <OptionCard selected={form.affectedArea === "large"} onClick={() => update("affectedArea", "large")} title="Large" description="Multiple rooms or extensive damage." />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3 — Property & Timeline */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Property & timeline</h1>
              <p className="text-muted-foreground mt-2">Where and when?</p>
            </div>

            <div className="space-y-2">
              <Label>Property type</Label>
              <div className="space-y-2">
                <OptionCard selected={form.propertyType === "house"} onClick={() => update("propertyType", "house")} icon={Home} title="House" />
                <OptionCard selected={form.propertyType === "condo"} onClick={() => update("propertyType", "condo")} icon={Building2} title="Condo / Apartment" />
                <OptionCard selected={form.propertyType === "commercial"} onClick={() => update("propertyType", "commercial")} icon={Building} title="Commercial" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Project address</Label>
              <AddressAutocomplete
                value={form.address}
                onChange={(v) => update("address", v)}
                onSelect={(result) => {
                  update("address", result.full);
                  update("city", result.city);
                  update("zipCode", result.zip);
                }}
                placeholder="Start typing your address..."
              />
            </div>

            <div className="space-y-2">
              <Label>Timeline</Label>
              <div className="space-y-2">
                <OptionCard selected={form.timeline === "asap"} onClick={() => update("timeline", "asap")} icon={Calendar} title="ASAP" description="Within 2 weeks" />
                <OptionCard selected={form.timeline === "1-month"} onClick={() => update("timeline", "1-month")} icon={Calendar} title="Within 1 month" />
                <OptionCard selected={form.timeline === "1-3-months"} onClick={() => update("timeline", "1-3-months")} icon={Calendar} title="1 – 3 months" />
                <OptionCard selected={form.timeline === "planning"} onClick={() => update("timeline", "planning")} icon={Calendar} title="Just planning ahead" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Contact */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Almost done</h1>
              <p className="text-muted-foreground mt-2">How can we reach you with your estimate?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="(732) 555-0100"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                maxLength={20}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              By submitting, you agree to be contacted by AXO Floors about your project. We never share your info.
            </p>
          </div>
        )}
      </main>

      {/* Sticky footer CTA */}
      <footer className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext} size="lg" className="w-full h-12 text-base font-semibold">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="w-full h-12 text-base font-semibold">
              {isSubmitting ? "Submitting..." : "Submit Project"}
              {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ProjectWizard;
