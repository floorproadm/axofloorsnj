import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, addDays, isWeekend } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AXO_ORG_ID } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/shared/SEOHead";
import { toast } from "sonner";

const TIME_SLOTS = [
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 2:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
];

const SERVICE_TYPES = [
  "Refinishing",
  "Installation",
  "Staircase",
  "Repair",
  "Other",
];

const PHONE = "+17323518653";

export default function ScheduleEstimate() {
  const [params] = useSearchParams();
  const leadIdParam = params.get("lead");

  const [leadId, setLeadId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Prefill from lead if present
  useEffect(() => {
    if (!leadIdParam) return;
    (async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, email, phone, address")
        .eq("id", leadIdParam)
        .maybeSingle();
      if (data) {
        setLeadId(data.id);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
    })();
  }, [leadIdParam]);

  const canSubmit = useMemo(
    () =>
      name.trim().length > 1 &&
      phone.trim().length >= 7 &&
      !!date &&
      !!time,
    [name, phone, date, time]
  );

  const handleSubmit = async () => {
    if (!canSubmit || !date) {
      toast.error("Please fill name, phone, date and time.");
      return;
    }
    setLoading(true);
    try {
      let activeLeadId = leadId;

      // Create a lead if none provided (organic visit)
      if (!activeLeadId) {
        const { data: newLead, error: leadErr } = await supabase
          .from("leads")
          .insert({
            organization_id: AXO_ORG_ID,
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim(),
            address: address.trim() || null,
            notes: [serviceType && `Service: ${serviceType}`, notes.trim()]
              .filter(Boolean)
              .join("\n") || null,
            lead_source: "schedule_estimate",
          })
          .select("id")
          .single();
        if (leadErr) throw leadErr;
        activeLeadId = newLead.id;
      }

      const { error } = await supabase.from("appointment_requests").insert({
        lead_id: activeLeadId,
        organization_id: AXO_ORG_ID,
        preferred_date: format(date, "yyyy-MM-dd"),
        preferred_time: time,
        service_type: serviceType || null,
        address: address.trim() || null,
        notes: [
          notes.trim(),
          `Contact: ${name} · ${phone}${email ? ` · ${email}` : ""}`,
        ]
          .filter(Boolean)
          .join("\n") || null,
      });

      if (error) throw error;
      setDone(true);
    } catch (err: any) {
      console.error("schedule-estimate error", err);
      toast.error(err?.message || "Could not send request. Please call us.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <>
        <SEOHead
          title="Estimate Request Received | AXO Floors"
          description="Your appointment request was received. We'll confirm your visit within 24 hours."
          canonical="https://axofloorsnj.com/schedule-estimate"
        />
        <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Request received
            </h1>
            <p className="text-slate-600 mt-3">
              Eduardo will confirm your estimate within 24 hours by call or
              text. If urgent, reach us at{" "}
              <a href={`tel:${PHONE}`} className="font-semibold text-[#0f1b3d]">
                (732) 351-8653
              </a>
              .
            </p>
            <Link to="/">
              <Button className="mt-6 bg-[#0f1b3d] hover:bg-[#0f1b3d]/90 w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Schedule Your Estimate | AXO Floors NJ"
        description="Pick a date and time for your hardwood floor estimate. We confirm within 24 hours."
        canonical="https://axofloorsnj.com/schedule-estimate"
      />
      <main className="min-h-screen bg-[#f7f7f5] py-8 px-4">
        <div className="max-w-lg mx-auto">
          <header className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Schedule your estimate
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              Pick the window that works. We confirm within 24 hours.
            </p>
            <a
              href={`tel:${PHONE}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0f1b3d] underline"
            >
              <Phone className="w-4 h-4" /> Or call (732) 351-8653
            </a>
          </header>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Full name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  placeholder="(732) 555-0123"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                placeholder="you@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Project address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, NJ"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preferred date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) =>
                        d < addDays(new Date(), 1) || isWeekend(d)
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred time *</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time window" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Service type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="What do you need?" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Access instructions, square footage, concerns…"
                maxLength={500}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !canSubmit}
              className="w-full bg-[#0f1b3d] hover:bg-[#0f1b3d]/90 h-11"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Request my estimate
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Time windows are preferences — we'll confirm the exact slot.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
