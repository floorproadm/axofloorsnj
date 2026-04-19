import { useState, useEffect } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  ClipboardCheck, 
  FileText, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Home,
  MapPin,
  Calendar,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  validateForm, 
  sanitizeInput, 
  checkRateLimit, 
  getClientIdentifier,
  useFieldValidation
} from "@/utils/validation";
import SEOHead from "@/components/shared/SEOHead";

type ApplicationStatus = 'form' | 'approved' | 'rejected';
type RejectionReason = 'price-focused' | 'no-timeline' | 'outside-area' | 'rental' | null;

const FloorDiagnostic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { validateField } = useFieldValidation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('form');
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Step 1: Property
    serviceInterest: "",
    propertyType: "",
    location: "",
    floorArea: "",
    // Step 2: Situation
    floorCondition: "",
    previousWork: "",
    primaryConcern: "",
    // Step 3: Timeline
    completionTimeline: "",
    homeReady: "",
    // Step 4: Decision
    decisionStyle: "",
    decisionMaker: "",
    previousContractors: "",
    // Step 5: Contact
    name: "",
    phone: "",
    email: "",
    address: "",
    additionalNotes: ""
  });

  const totalSteps = 5;

  // Pre-fill contact info from localStorage on step 5
  useEffect(() => {
    if (currentStep === 5) {
      const savedName = localStorage.getItem('user_name');
      const savedEmail = localStorage.getItem('user_email');
      const savedPhone = localStorage.getItem('user_phone');
      const savedAddress = localStorage.getItem('user_address');
      
      setFormData(prev => ({
        ...prev,
        name: prev.name || savedName || '',
        email: prev.email || savedEmail || '',
        phone: prev.phone || savedPhone || '',
        address: prev.address || savedAddress || ''
      }));
    }
  }, [currentStep]);

  // Save contact info to localStorage when submitted
  const saveContactToLocalStorage = () => {
    if (formData.name) localStorage.setItem('user_name', formData.name);
    if (formData.email) localStorage.setItem('user_email', formData.email);
    if (formData.phone) localStorage.setItem('user_phone', formData.phone);
    if (formData.address) localStorage.setItem('user_address', formData.address);
  };

  const handleFieldChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Check for disqualifying answers
  const checkQualification = (): { qualified: boolean; reason: RejectionReason } => {
    if (formData.propertyType === "rental") {
      return { qualified: false, reason: 'rental' };
    }
    if (formData.location === "other") {
      return { qualified: false, reason: 'outside-area' };
    }
    if (formData.completionTimeline === "no-timeline") {
      return { qualified: false, reason: 'no-timeline' };
    }
    if (formData.decisionStyle === "price-comparison") {
      return { qualified: false, reason: 'price-focused' };
    }
    return { qualified: true, reason: null };
  };

  const handleSubmit = async () => {
    const validationRules = {
      name: ['required', 'name'],
      email: ['required', 'email'],
      phone: ['required', 'phone'],
      address: ['required']
    };

    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      toast({
        title: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    const clientId = getClientIdentifier();
    const rateLimitCheck = checkRateLimit(clientId);
    
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Too many submissions",
        description: `Please wait ${rateLimitCheck.remainingTime} seconds.`,
        variant: "destructive"
      });
      return;
    }

    // Save contact info for future pre-fill
    saveContactToLocalStorage();
    
    setIsLoading(true);

    try {
      const qualification = checkQualification();
      
      const leadData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        address: sanitizeInput(formData.address),
        lead_source: 'floor-diagnostic',
        status: 'cold_lead',
        priority: qualification.qualified ? 'high' : 'low',
        organization_id: AXO_ORG_ID,
        notes: `
          DIAGNOSTIC APPLICATION
          ----------------------
          Property: ${formData.propertyType}
          Location: ${formData.location}
          Floor Area: ${formData.floorArea} sq ft
          
          Condition: ${formData.floorCondition}
          Previous Work: ${formData.previousWork}
          Primary Concern: ${formData.primaryConcern}
          
          Timeline: ${formData.completionTimeline}
          Home Ready: ${formData.homeReady}
          
          Decision Style: ${formData.decisionStyle}
          Decision Maker: ${formData.decisionMaker}
          Previous Contractors: ${formData.previousContractors}
          
          Additional Notes: ${formData.additionalNotes}
          
          Qualification: ${qualification.qualified ? 'APPROVED' : `REJECTED - ${qualification.reason}`}
        `.trim()
      };

      const { error: saveError } = await supabase
        .from('leads')
        .insert([leadData]);

      if (saveError) throw saveError;

      // Send to Notion
      try {
        await supabase.functions.invoke('send-to-notion', {
          body: {
            ...leadData,
            source: 'floor-diagnostic',
            services: ['diagnostic']
          }
        });
      } catch (e) {
        console.error('Notion sync error:', e);
      }

      if (qualification.qualified) {
        setApplicationStatus('approved');
      } else {
        setRejectionReason(qualification.reason);
        setApplicationStatus('rejected');
      }

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please call us directly at (732) 351-8653",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    // Step validations
    if (currentStep === 1) {
      if (!formData.propertyType || !formData.location || !formData.floorArea) {
        toast({ title: "Please complete all fields", variant: "destructive" });
        return;
      }
      // Immediate disqualification checks
      if (formData.propertyType === "rental") {
        setRejectionReason('rental');
        setApplicationStatus('rejected');
        return;
      }
      if (formData.location === "other") {
        setRejectionReason('outside-area');
        setApplicationStatus('rejected');
        return;
      }
    }
    if (currentStep === 2 && (!formData.floorCondition || !formData.primaryConcern)) {
      toast({ title: "Please complete all fields", variant: "destructive" });
      return;
    }
    if (currentStep === 3) {
      if (!formData.completionTimeline || !formData.homeReady) {
        toast({ title: "Please complete all fields", variant: "destructive" });
        return;
      }
      if (formData.completionTimeline === "no-timeline") {
        setRejectionReason('no-timeline');
        setApplicationStatus('rejected');
        return;
      }
    }
    if (currentStep === 4) {
      if (!formData.decisionStyle || !formData.decisionMaker) {
        toast({ title: "Please complete all fields", variant: "destructive" });
        return;
      }
      if (formData.decisionStyle === "price-comparison") {
        setRejectionReason('price-focused');
        setApplicationStatus('rejected');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Render rejection screen
  if (applicationStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Application Status | AXO Floor Diagnostic™"
          description="AXO Floor Diagnostic™ application status"
        />
        <Header />
        
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-muted flex items-center justify-center">
                <XCircle className="w-10 h-10 text-muted-foreground" />
              </div>
              
              {rejectionReason === 'price-focused' && (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
                    We may not be the right fit.
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    We understand you're comparing options — that's smart.
                  </p>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    However, AXO specializes in precision work for homeowners who prioritize 
                    quality and permanence over price. If that changes, we're here.
                  </p>
                  <p className="text-muted-foreground">
                    For now, we recommend continuing your search with contractors who compete on cost.
                  </p>
                </>
              )}
              
              {rejectionReason === 'no-timeline' && (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
                    Timing matters.
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    It sounds like you're still in the early stages of deciding.
                  </p>
                  <p className="text-muted-foreground">
                    The AXO Floor Diagnostic™ is designed for homeowners ready to move forward. 
                    When you're closer to a decision, come back — we'll be here.
                  </p>
                </>
              )}
              
              {(rejectionReason === 'outside-area' || rejectionReason === 'rental') && (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
                    We can't help with this one.
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                    {rejectionReason === 'rental' 
                      ? "We only work with property owners — not rental properties."
                      : "We only serve homeowners in New Jersey, New York, and Pennsylvania."
                    }
                  </p>
                  <p className="text-muted-foreground">
                    We wish you well on your project.
                  </p>
                </>
              )}

              <Button 
                variant="outline" 
                className="mt-12"
                onClick={() => navigate('/')}
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    );
  }

  // Render approval screen
  if (applicationStatus === 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Application Approved | AXO Floor Diagnostic™"
          description="Your AXO Floor Diagnostic™ application has been approved"
        />
        <Header />
        
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gold/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-gold" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-6">
                You're a fit.
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Based on your responses, your project aligns with the type of work we specialize in.
              </p>
              
              <div className="bg-muted/50 rounded-xl p-8 mb-8 text-left">
                <h3 className="font-semibold text-foreground mb-4">What happens next:</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>We'll review your submission within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>You'll receive a call to confirm your Diagnostic appointment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                    <span>The Diagnostic Report will be delivered within 48 hours of the visit</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                — AXO Floors
              </p>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="AXO Floor Diagnostic™ | Premium Decision Service"
        description="Know exactly what your floors need — and what they don't — before a single board is touched. A structured decision session, not an estimate."
      />
      <Header />

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gold font-medium tracking-wide uppercase text-sm mb-4">
              Premium Decision Service
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 leading-tight">
              Before We Touch Your Floors,<br />We Study Them.
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Know exactly what your floors need — and what they don't — before a single board is touched.
            </p>
            <div className="inline-flex items-center gap-2 text-white/60 text-sm border border-white/20 rounded-full px-4 py-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Limited appointments available. Not all projects accepted.</span>
            </div>
          </div>
        </div>
      </section>

      {/* What This Is / What This Is Not */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-gold/20 bg-background">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-xl font-semibold font-heading">What it is</h3>
                  </div>
                  <ul className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-gold mt-1">•</span>
                      <span>A structured decision session with a senior technician</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gold mt-1">•</span>
                      <span>Professional assessment of your floor's condition</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gold mt-1">•</span>
                      <span>Clear recommendation tailored to your home and goals</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gold mt-1">•</span>
                      <span>A Diagnostic Report delivered within 48 hours</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-muted bg-background">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold font-heading">What it is not</h3>
                  </div>
                  <ul className="space-y-4 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Not a free estimate</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Not a sales pitch</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Not a rushed walkthrough to close a job</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-muted-foreground mt-1">•</span>
                      <span>Not something every flooring company offers</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold font-heading text-center mb-12">
              The Diagnostic Process
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <ClipboardCheck className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-semibold mb-2">1. On-Site Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Visual inspection, moisture readings, and wear analysis of your floors.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-semibold mb-2">2. Lifestyle Interview</h3>
                <p className="text-sm text-muted-foreground">
                  Understanding how you use your space and your long-term goals.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-semibold mb-2">3. Diagnostic Report</h3>
                <p className="text-sm text-muted-foreground">
                  Clear recommendation with investment range, delivered within 48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-muted/30" id="apply">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-heading mb-4">
                Apply for the AXO Floor Diagnostic™
              </h2>
              <p className="text-muted-foreground">
                This service is for homeowners ready to invest in a permanent solution.
              </p>
              <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground mt-6">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <span 
                    key={i} 
                    className={`w-10 h-1 rounded transition-colors ${
                      currentStep >= i + 1 ? 'bg-gold' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Card className="border-2 border-gold/20">
              <CardContent className="p-6 md:p-8">
                
                {/* Step 1: Property */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Home className="w-5 h-5 text-gold" />
                      <h3 className="text-lg font-semibold">Property Information</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Property Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "single-family", label: "Single-Family Home" },
                            { value: "townhouse", label: "Townhouse" },
                            { value: "condo", label: "Condo" },
                            { value: "rental", label: "Rental Property" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('propertyType', option.value)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.propertyType === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Location</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { value: "nj", label: "New Jersey" },
                            { value: "ny", label: "New York" },
                            { value: "pa", label: "Pennsylvania" },
                            { value: "other", label: "Other" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('location', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.location === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Approximate Floor Area (sq ft)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { value: "under-500", label: "Under 500" },
                            { value: "500-1000", label: "500–1,000" },
                            { value: "1000-2000", label: "1,000–2,000" },
                            { value: "over-2000", label: "2,000+" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('floorArea', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.floorArea === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Situation */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <ClipboardCheck className="w-5 h-5 text-gold" />
                      <h3 className="text-lg font-semibold">Current Situation</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Current Floor Condition</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { value: "worn", label: "Worn / Dull", desc: "Surface wear, needs refreshing" },
                            { value: "damaged", label: "Damaged", desc: "Scratches, dents, or water damage" },
                            { value: "outdated", label: "Outdated", desc: "Dated appearance or color" },
                            { value: "unknown", label: "Not Sure", desc: "Need professional assessment" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('floorCondition', option.value)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.floorCondition === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm block">{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Has this floor been refinished before?</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                            { value: "unsure", label: "Not Sure" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('previousWork', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.previousWork === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Primary Concern</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "appearance", label: "Appearance" },
                            { value: "durability", label: "Durability" },
                            { value: "resale", label: "Resale Value" },
                            { value: "damage-repair", label: "Damage Repair" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('primaryConcern', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.primaryConcern === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Timeline */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Calendar className="w-5 h-5 text-gold" />
                      <h3 className="text-lg font-semibold">Timeline</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-3 block">When do you want this completed?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { value: "within-30", label: "Within 30 days" },
                            { value: "1-3-months", label: "1–3 months" },
                            { value: "3-6-months", label: "3–6 months" },
                            { value: "no-timeline", label: "No timeline yet" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('completionTimeline', option.value)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.completionTimeline === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Is your home ready for work?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {[
                            { value: "vacant", label: "Vacant / Empty" },
                            { value: "can-clear", label: "Can Clear Rooms" },
                            { value: "occupied", label: "Fully Occupied" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('homeReady', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.homeReady === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Decision */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Shield className="w-5 h-5 text-gold" />
                      <h3 className="text-lg font-semibold">Decision Process</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-3 block">How will you decide on a contractor?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { value: "quality-reputation", label: "Quality & Reputation", desc: "Prioritize craftsmanship and reviews" },
                            { value: "referral", label: "Referral", desc: "Someone recommended AXO" },
                            { value: "price-comparison", label: "Price Comparison", desc: "Comparing multiple quotes" },
                            { value: "undecided", label: "Still Deciding", desc: "Open to guidance" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('decisionStyle', option.value)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                formData.decisionStyle === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm block">{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Who makes the final decision?</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: "me", label: "Me" },
                            { value: "me-partner", label: "Me + Partner" },
                            { value: "other", label: "Other" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('decisionMaker', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.decisionMaker === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-3 block">Have you worked with flooring contractors before?</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" }
                          ].map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleFieldChange('previousContractors', option.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                formData.previousContractors === option.value
                                  ? 'border-gold bg-gold/10'
                                  : 'border-muted hover:border-gold/50'
                              }`}
                            >
                              <span className="font-medium text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Contact */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <MapPin className="w-5 h-5 text-gold" />
                      <h3 className="text-lg font-semibold">Contact Information</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      If accepted, how should we reach you?
                    </p>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            placeholder="John Smith"
                            className={formErrors.name ? 'border-destructive' : ''}
                          />
                          {formErrors.name && (
                            <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            placeholder="(555) 123-4567"
                            className={formErrors.phone ? 'border-destructive' : ''}
                          />
                          {formErrors.phone && (
                            <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          placeholder="john@example.com"
                          className={formErrors.email ? 'border-destructive' : ''}
                        />
                        {formErrors.email && (
                          <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="address">Property Address *</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          placeholder="123 Main St, City, State"
                          className={formErrors.address ? 'border-destructive' : ''}
                        />
                        {formErrors.address && (
                          <p className="text-xs text-destructive mt-1">{formErrors.address}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Anything else we should know? (optional)</Label>
                        <Textarea
                          id="notes"
                          value={formData.additionalNotes}
                          onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
                          placeholder="Brief description of your floor situation..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-muted">
                  {currentStep > 1 ? (
                    <Button 
                      variant="ghost" 
                      onClick={prevStep}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {currentStep < totalSteps ? (
                    <Button 
                      onClick={nextStep}
                      className="gold-gradient text-black font-semibold flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="gold-gradient text-black font-semibold flex items-center gap-2"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Application'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              We'll confirm within 24 hours if we can help.
            </p>
          </div>
        </div>
      </section>

      {/* Filtering Statement */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground italic">
              "This service is for homeowners ready to invest in a permanent solution. 
              If you're comparing prices from multiple contractors, this may not be the right fit."
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FloorDiagnostic;
