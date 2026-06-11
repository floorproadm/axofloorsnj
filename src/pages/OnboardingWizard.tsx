import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import floorproLogo from '@/assets/floorpro-logo.png.asset.json';

const STATES = ['NJ', 'NY', 'PA', 'CT', 'MA', 'FL', 'TX', 'CA', 'Other'];
const SERVICES = [
  'Hardwood Installation',
  'Hardwood Refinishing / Sanding',
  'Vinyl Plank / LVP',
  'Staircase',
  'Baseboards & Trim',
  'Tile',
  'Other',
];
const TEAM_SIZES = ['Just me', '2-5', '6-15', '16+'];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('NJ');
  const [city, setCity] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState('Just me');

  // Guard: must be logged in; if already in an org → /admin
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/admin/auth', { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data?.organization_id) {
        navigate('/admin', { replace: true });
      } else {
        if (user.email) setEmail(user.email);
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, navigate]);

  const toggleService = (s: string) => {
    setServices((prev) => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const step2Valid = name.trim() && phone.trim() && email.trim();

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_organization_with_owner' as any, {
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_email: email.trim(),
        p_state: state,
        p_city: city.trim() || null,
        p_services_offered: services.length ? services : null,
        p_team_size: teamSize,
      });
      if (error) throw error;
      toast({ title: 'Welcome aboard', description: 'Your FloorPRO workspace is ready.' });
      navigate('/admin', { replace: true });
    } catch (e: any) {
      toast({
        title: 'Could not finish setup',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-10 bg-[#0066FF]' :
                i < step ? 'w-6 bg-[#0066FF]' :
                'w-6 bg-[#E6F0FF]'
              }`}
            />
          ))}
        </div>

        <div className="bg-white border border-[#E6F0FF] rounded-2xl shadow-sm p-8">
          {step === 1 && (
            <div className="text-center space-y-6">
              <img src={floorproLogo.url} alt="FloorPRO" className="h-14 mx-auto" />
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-[#1A1A1A]">
                  Let's set up your company
                </h1>
                <p className="text-sm text-muted-foreground">
                  Takes 2 minutes. You can change everything later in Settings.
                </p>
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Company basics</h2>
                <p className="text-sm text-muted-foreground mt-1">Tell us who you are.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Company name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger id="state"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1A1A1A]">Your trade</h2>
                <p className="text-sm text-muted-foreground mt-1">Helps us tune your workspace.</p>
              </div>
              <div className="space-y-3">
                <Label>What services do you offer?</Label>
                <div className="space-y-2">
                  {SERVICES.map((s) => (
                    <label key={s} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E6F0FF] hover:bg-[#E6F0FF]/30 cursor-pointer">
                      <Checkbox
                        checked={services.includes(s)}
                        onCheckedChange={() => toggleService(s)}
                      />
                      <span className="text-sm text-[#1A1A1A]">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>How many people on your team?</Label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEAM_SIZES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-[#E6F0FF] flex items-center justify-center animate-in zoom-in duration-500">
                  <CheckCircle2 className="h-10 w-10 text-[#0066FF]" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-[#1A1A1A]">Your FloorPRO is ready</h2>
                <p className="text-sm text-muted-foreground">
                  {name || 'Friend'}, welcome aboard.
                </p>
              </div>
              <ul className="text-left text-sm space-y-2 max-w-[280px] mx-auto">
                {['Lead pipeline','Project management','Client portal','Partner portal','Labor & payroll'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[#1A1A1A]">
                    <CheckCircle2 className="h-4 w-4 text-[#0066FF] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleFinish}
                disabled={submitting}
                className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Open my dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
