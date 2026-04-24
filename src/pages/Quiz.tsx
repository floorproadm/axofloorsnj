import { useState } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
import { useNavigate } from "react-router-dom";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Home, DollarSign, Wrench, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  validateForm, 
  sanitizeInput, 
  checkRateLimit, 
  getClientIdentifier,
  formatPhoneNumber,
  useFieldValidation
} from "@/utils/validation";
import { 
  sanitizeForLogging,
  logSecurityEvent,
  monitorFormSubmission,
  monitorRateLimit,
  validateRequestSize,
  getSecurityHeaders
} from "@/utils/security-monitoring";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { validateField } = useFieldValidation();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    serviceType: "", // "new-installation" | "floor-refinish" | "install-plus-refinish" | "not-sure"
    finishScope: "", // for install-plus-refinish: new-floor | existing | both | not-sure
    floorType: "", // for new installation
    currentCondition: "", // for refinish
    woodType: "", // for refinish
    location: "", // residential, apartment, commercial
    subfloor: "", // concrete | wood | not-sure (new install)
    belowGrade: "", // yes | no | not-sure (new install)
    livingDuringRefinish: "", // yes | no | not-sure (refinish)
    stairsIncluded: "", // yes | no
    squareFootage: "",
    timeline: "",
    budget: "",
    colorChange: "", // for refinish
    name: "",
    email: "",
    phone: "",
    city: ""
  });

  const handleFieldChange = (field: string, value: string, rules: string[] = []) => {
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear previous error
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Validate field if it has rules
    if (rules.length > 0) {
      const error = validateField(sanitizedValue, rules);
      if (error) {
        setFormErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  const serviceTypes = [
    { value: "new-installation", label: "New Installation", description: "Installing new flooring" },
    { value: "floor-refinish", label: "Refinishing (Sand & Finish)", description: "Refinishing existing floors" },
    { value: "install-plus-refinish", label: "Installation + Refinishing", description: "Both — install new and refinish" },
    { value: "not-sure", label: "Not sure / Need guidance", description: "Talk to an expert first" },
  ];

  const finishScopeOptions = [
    { value: "new-floor", label: "For the new floor being installed", description: "Finish only the floor we'll install" },
    { value: "existing", label: "For existing floors", description: "Refinish floors already in place" },
    { value: "both", label: "Both", description: "New install + refinish existing areas" },
    { value: "not-sure", label: "Not sure", description: "We'll inspect and recommend" },
  ];

  const floorTypes = [
    { value: "hardwood", label: "Hardwood", description: "Classic and durable solid wood flooring" },
    { value: "laminate", label: "Laminate", description: "Affordable and resilient synthetic flooring" },
    { value: "vinyl", label: "Vinyl", description: "Water-resistant and low maintenance" },
    { value: "custom", label: "Custom", description: "Unique patterns and materials" }
  ];

  const currentConditions = [
    { value: "light-wear", label: "Light Wear", description: "Minor scratches and dullness" },
    { value: "moderate-wear", label: "Moderate Wear", description: "Visible scratches and some damage" },
    { value: "heavy-wear", label: "Heavy Wear", description: "Deep scratches and significant damage" },
    { value: "damaged", label: "Damaged", description: "Requires board replacement" }
  ];

  const woodTypes = [
    { value: "oak", label: "Oak" },
    { value: "maple", label: "Maple" },
    { value: "pine", label: "Pine" },
    { value: "not-sure", label: "Not Sure" }
  ];

  const locations = [
    { value: "residential", label: "Residential Home" },
    { value: "apartment", label: "Apartment" },
    { value: "commercial", label: "Commercial Space" }
  ];

  const timelines = [
    { value: "asap", label: "As soon as possible" },
    { value: "1-month", label: "Within 1 month" },
    { value: "3-months", label: "Within 3 months" },
    { value: "planning", label: "Just planning" }
  ];

  const budgetRanges = [
    { value: "under-2k", label: "Up to $2,000" },
    { value: "2k-5k", label: "$2,000 - $5,000" },
    { value: "5k-10k", label: "$5,000 - $10,000" },
    { value: "10k-plus", label: "$10,000+" }
  ];

  const colorOptions = [
    { value: "keep-same", label: "Keep Same Color", description: "Maintain current appearance" },
    { value: "go-lighter", label: "Go Lighter", description: "Brighten the space" },
    { value: "go-darker", label: "Go Darker", description: "Add richness and depth" },
    { value: "need-consultation", label: "Need Consultation", description: "Professional recommendation" }
  ];

  // Build the ordered list of step keys for the active path.
  // Keys: service, finishScope, floorType, condition, wood, location,
  //       subfloorGrade, livingDuringRefinish, area, colorChange, timeline, budget, contact
  const getStepKeys = (): string[] => {
    const keys: string[] = ['service'];

    // Top-level "not sure" → short consult path
    if (formData.serviceType === 'not-sure') {
      return [...keys, 'area', 'timeline', 'budget', 'contact'];
    }

    // Pure new installation
    if (formData.serviceType === 'new-installation') {
      return [...keys, 'floorType', 'location', 'subfloorGrade', 'area', 'timeline', 'budget', 'contact'];
    }

    // Pure refinish
    if (formData.serviceType === 'floor-refinish') {
      return [...keys, 'condition', 'wood', 'livingDuringRefinish', 'area', 'colorChange', 'timeline', 'budget', 'contact'];
    }

    // Install + Refinish: pivot on finishScope
    if (formData.serviceType === 'install-plus-refinish') {
      keys.push('finishScope');

      if (formData.finishScope === 'new-floor') {
        return [...keys, 'floorType', 'location', 'subfloorGrade', 'area', 'timeline', 'budget', 'contact'];
      }
      if (formData.finishScope === 'existing') {
        return [...keys, 'condition', 'wood', 'livingDuringRefinish', 'area', 'colorChange', 'timeline', 'budget', 'contact'];
      }
      if (formData.finishScope === 'both') {
        // Hybrid: install track + condition of existing floors
        return [...keys, 'floorType', 'location', 'subfloorGrade', 'condition', 'area', 'timeline', 'budget', 'contact'];
      }
      if (formData.finishScope === 'not-sure') {
        // Short consult path inside the combo route
        return [...keys, 'area', 'timeline', 'budget', 'contact'];
      }
      // finishScope not yet chosen — only show service + scope
      return keys;
    }

    // No service chosen yet
    return keys;
  };

  const getTotalSteps = () => getStepKeys().length;
  const getCurrentStepKey = () => getStepKeys()[currentStep - 1] ?? 'service';

  // True when this lead must be flagged for human consultation
  const needsConsultation = () =>
    formData.serviceType === 'not-sure' ||
    (formData.serviceType === 'install-plus-refinish' && formData.finishScope === 'not-sure');

  const getRecommendedService = () => {
    if (formData.serviceType === "new-installation") {
      if (formData.floorType === "hardwood") return "/hardwood-flooring";
      if (formData.floorType === "vinyl") return "/vinyl-plank-flooring";
      return "/hardwood-flooring"; // Default for new installation
    }
    return "/sanding-and-refinish"; // Default for refinish
  };

  const handleSubmit = async () => {
    
    // Comprehensive form validation
    const validationRules = {
      name: ['required', 'name'],
      email: ['required', 'email'],
      phone: ['required', 'phone'],
      city: ['required'] // cidade é obrigatória
    };

    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      toast({
        title: "Please fix the errors below",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting check
    const clientId = getClientIdentifier();
    const rateLimitCheck = checkRateLimit(clientId);
    
    if (!rateLimitCheck.allowed) {
      monitorRateLimit(clientId, rateLimitCheck.remainingTime!);
      toast({
        title: "Too many submissions",
        description: `Please wait ${rateLimitCheck.remainingTime} seconds before submitting again.`,
        variant: "destructive"
      });
      return;
    }

    // Validate request size
    if (!validateRequestSize(formData)) {
      logSecurityEvent('suspicious_activity', {
        reason: 'oversized_form_data',
        formType: 'quiz'
      });
      toast({
        title: "Form data too large",
        description: "Please reduce the amount of information and try again.",
        variant: "destructive"
      });
      return;
    }

    // Monitor form submission for suspicious activity
    const isSecure = monitorFormSubmission('quiz', formData);
    if (!isSecure) {
      toast({
        title: "Suspicious activity detected",
        description: "Your submission has been flagged for review. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting quiz submission with data:', formData);
      
      // Store quiz results in Supabase leads table with sanitized data
      const quizData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        city: sanitizeInput(formData.city),
        lead_source: 'quiz',
        status: 'cold_lead',
        priority: 'high',
        room_size: sanitizeInput(formData.squareFootage) || '0',
        services: [sanitizeInput(formData.serviceType) || 'unknown'],
        budget: formData.budget === "10k-plus" ? 15000 : 
                formData.budget === "5k-10k" ? 7500 :
                formData.budget === "2k-5k" ? 3500 : 2000,
        organization_id: AXO_ORG_ID,
      };

      console.log('Prepared quiz data for submission:', quizData);

      // Save to Supabase leads table
      const { data: savedLead, error: saveError } = await supabase
        .from('leads')
        .insert([quizData])
        .select()
        .single();

      if (saveError) {
        console.error('Database save error:', saveError);
        throw new Error(`Failed to save quiz response: ${saveError.message}`);
      }

      console.log('Successfully saved quiz lead:', savedLead);

      // Send to Notion
      try {
        await supabase.functions.invoke('send-to-notion', {
          body: {
            name: quizData.name,
            email: quizData.email,
            phone: quizData.phone,
            source: 'quiz',
            services: quizData.services,
            budget: quizData.budget,
            room_size: quizData.room_size,
            city: quizData.city,
            priority: quizData.priority,
            status: 'cold_lead',
            notes: `Quiz submission - Service: ${formData.serviceType}, Square Footage: ${formData.squareFootage || 'Not specified'}, Timeline: ${formData.timeline || 'Not specified'}, Wood Type: ${formData.woodType || 'Not specified'}, Condition: ${formData.currentCondition || 'Not specified'}, Color Change: ${formData.colorChange || 'Not specified'}, Subfloor: ${formData.subfloor || 'N/A'}, Below Grade: ${formData.belowGrade || 'N/A'}, Living During Refinish: ${formData.livingDuringRefinish || 'N/A'}, Stairs Included: ${formData.stairsIncluded || 'N/A'}`
          }
        });
        console.log('Quiz lead sent to Notion successfully');
      } catch (notionError) {
        console.error('Error sending quiz lead to Notion:', notionError);
        // Não falhar o processo todo por erro do Notion
      }

      // Send follow-up email
      try {
        await supabase.functions.invoke('send-follow-up', {
          body: {
            name: formData.name,
            email: formData.email,
            source: 'quiz',
            leadType: 'quiz'
          }
        });
      } catch (emailError) {
        // Don't fail the whole process for email errors
      }

      // Send admin notification
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            leadData: quizData,
            adminEmail: 'axofloorsnj@gmail.com',
            adminPhone: '+17323518653'
          }
        });
      } catch (notificationError) {
        // Don't fail the whole process for notification errors
      }

      toast({
        title: "Thank you!",
        description: "We'll contact you within 24 hours with your personalized recommendations."
      });

      // Redirect to thank you page with quiz data
      navigate('/thank-you', { 
        state: { 
          quizData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            serviceType: formData.serviceType,
            squareFootage: formData.squareFootage,
            budget: formData.budget
          }
        }
      });

    } catch (error) {
      console.error('Quiz submission error:', error);
      
      // More detailed error information for debugging
      let errorMessage = "Please try again or call us directly at (732) 351-8653";
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          formData: formData
        });
        
        // Provide more specific error messages
        if (error.message.includes('email')) {
          errorMessage = "Please check your email address and try again";
        } else if (error.message.includes('phone')) {
          errorMessage = "Please check your phone number and try again";
        } else if (error.message.includes('name')) {
          errorMessage = "Please check your name and try again";
        }
      }
      
      toast({
        title: "Something went wrong",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    const key = getCurrentStepKey();

    const fail = (title: string, description?: string) => {
      toast({ title, description, variant: 'destructive' });
    };

    switch (key) {
      case 'service':
        if (!formData.serviceType) return fail('Please select a service type');
        break;
      case 'finishScope':
        if (!formData.finishScope) return fail('Please tell us what the finish is for');
        break;
      case 'floorType':
        if (!formData.floorType) return fail('Please select a flooring type');
        break;
      case 'condition':
        if (!formData.currentCondition) return fail('Please select the current condition');
        break;
      case 'wood':
        if (!formData.woodType) return fail('Please select your wood type');
        break;
      case 'location':
        if (!formData.location) return fail('Please select the location type');
        break;
      case 'subfloorGrade':
        if (!formData.subfloor || !formData.belowGrade) {
          return fail(
            'Please answer both questions',
            'Subfloor type and basement (below grade) help us scope the job correctly.',
          );
        }
        break;
      case 'livingDuringRefinish':
        if (!formData.livingDuringRefinish) {
          return fail(
            'Please answer the question',
            "Whether you'll be living in the home affects scheduling and prep.",
          );
        }
        break;
      case 'area':
        if (!formData.squareFootage || formData.squareFootage === '0') {
          return fail('Please specify the area size', 'Enter the square footage or select a preset size');
        }
        break;
      case 'colorChange':
        if (!formData.colorChange) return fail('Please specify color preference');
        break;
      case 'timeline':
        if (!formData.timeline) return fail('Please select a timeline');
        break;
      case 'budget':
        if (!formData.budget) return fail('Please select a budget range');
        break;
      default:
        break;
    }

    const newStep = Math.min(currentStep + 1, getTotalSteps());
    setCurrentStep(newStep);
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
  };

  const stepKey = getCurrentStepKey();
  const totalSteps = getTotalSteps();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">
                Get a Fast Flooring Estimate in 60 Seconds
              </h1>
              <p className="text-lg sm:text-xl text-grey mb-6">
                Answer a few quick questions about your project — we'll send tailored options and a price range.
              </p>
              <div className="flex justify-center items-center gap-2 text-sm text-grey">
                {Array.from({ length: getTotalSteps() }, (_, i) => (
                  <span key={i} className={`w-8 h-1 rounded ${currentStep >= i + 1 ? 'bg-gold' : 'bg-grey/30'}`}></span>
                ))}
              </div>
            </div>

            <Card className="bg-white border-2 border-gold/20 shadow-elegant">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-heading text-navy">
                  Step {currentStep} of {getTotalSteps()}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                {/* Step 1: Service Type Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What type of service do you need?
                      </h3>
                      <p className="text-grey">Choose the option that best describes your project</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {serviceTypes.map((service) => (
                        <Card 
                          key={service.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.serviceType === service.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, serviceType: service.value }))}
                        >
                          <CardContent className="p-6 text-center">
                            <h4 className="font-semibold text-navy mb-2">{service.label}</h4>
                            <p className="text-sm text-grey">{service.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Floor Type (New Installation) or Current Condition (Refinish) */}
                {currentStep === 2 && formData.serviceType === "new-installation" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What type of flooring are you interested in?
                      </h3>
                      <p className="text-grey">Select the flooring type that best fits your needs</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {floorTypes.map((floor) => (
                        <Card 
                          key={floor.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.floorType === floor.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, floorType: floor.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy mb-1">{floor.label}</h4>
                            <p className="text-sm text-grey">{floor.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 2 && formData.serviceType === "floor-refinish" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What's the current condition of your floors?
                      </h3>
                      <p className="text-grey">This helps us determine the best refinishing approach</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentConditions.map((condition) => (
                        <Card 
                          key={condition.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.currentCondition === condition.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, currentCondition: condition.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy mb-1">{condition.label}</h4>
                            <p className="text-sm text-grey">{condition.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Location (New Install) or Wood Type (Refinish) */}
                {currentStep === 3 && formData.serviceType === "new-installation" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Where will this flooring be installed?
                      </h3>
                      <p className="text-grey">Different locations may require different approaches</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {locations.map((location) => (
                        <Card 
                          key={location.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.location === location.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, location: location.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy">{location.label}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && formData.serviceType === "floor-refinish" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What type of wood flooring do you currently have?
                      </h3>
                      <p className="text-grey">This helps us choose the right refinishing approach</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {woodTypes.map((wood) => (
                        <Card 
                          key={wood.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.woodType === wood.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, woodType: wood.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy">{wood.label}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Operational — Subfloor + Below Grade (New Install) */}
                {currentStep === 4 && formData.serviceType === "new-installation" && (
                  <div className="space-y-8">
                    <div className="text-center mb-2">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Quick technical check
                      </h3>
                      <p className="text-grey">Two short questions that decide method, prep and warranty</p>
                    </div>

                    {/* Subfloor */}
                    <div>
                      <Label className="text-navy font-semibold block mb-3 text-center">
                        What's under this floor?
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { value: "concrete", label: "Concrete slab" },
                          { value: "wood", label: "Plywood / wood" },
                          { value: "not-sure", label: "Not sure" },
                        ].map((opt) => (
                          <Card
                            key={opt.value}
                            className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                              formData.subfloor === opt.value
                                ? "border-gold bg-gold/10"
                                : "border-grey/20 hover:border-gold/50"
                            }`}
                            onClick={() => setFormData((prev) => ({ ...prev, subfloor: opt.value }))}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="font-medium text-navy text-sm">{opt.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Below grade */}
                    <div>
                      <Label className="text-navy font-semibold block mb-3 text-center">
                        Is this space below grade (basement)?
                      </Label>
                      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                        {[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                          { value: "not-sure", label: "Not sure" },
                        ].map((opt) => (
                          <Card
                            key={opt.value}
                            className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                              formData.belowGrade === opt.value
                                ? "border-gold bg-gold/10"
                                : "border-grey/20 hover:border-gold/50"
                            }`}
                            onClick={() => setFormData((prev) => ({ ...prev, belowGrade: opt.value }))}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="font-medium text-navy text-sm">{opt.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Living during refinish (Refinish path) */}
                {currentStep === 4 && formData.serviceType === "floor-refinish" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Will you be living in the home during the refinishing?
                      </h3>
                      <p className="text-grey">Affects scheduling, dust control, and finish curing time</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      {[
                        { value: "yes", label: "Yes", description: "We'll plan low-VOC finishes & ventilation" },
                        { value: "no", label: "No", description: "Faster cure & full prep window" },
                        { value: "not-sure", label: "Not sure", description: "We'll discuss options" },
                      ].map((opt) => (
                        <Card
                          key={opt.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.livingDuringRefinish === opt.value
                              ? "border-gold bg-gold/10"
                              : "border-grey/20 hover:border-gold/50"
                          }`}
                          onClick={() => setFormData((prev) => ({ ...prev, livingDuringRefinish: opt.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy mb-1">{opt.label}</h4>
                            <p className="text-xs text-grey">{opt.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Square Footage (both paths) + Stairs toggle */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What's the approximate area to be {formData.serviceType === "new-installation" ? "covered" : "refinished"}?
                      </h3>
                      <p className="text-grey">Choose from common sizes or enter a custom amount</p>
                    </div>

                    {/* Quick Size Options */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { label: "Small Room", value: "200", subtitle: "~200 sq ft" },
                        { label: "Medium Room", value: "400", subtitle: "~400 sq ft" },
                        { label: "Large Room", value: "600", subtitle: "~600 sq ft" },
                        { label: "Whole Floor", value: "1200", subtitle: "1200+ sq ft" }
                      ].map((size) => (
                        <Card 
                          key={size.value}
                          className={`cursor-pointer transition-all hover:shadow-md border-2 p-3 text-center ${
                            formData.squareFootage === size.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, squareFootage: size.value }))}
                        >
                          <div className="text-sm font-medium text-navy">{size.label}</div>
                          <div className="text-xs text-grey mt-1">{size.subtitle}</div>
                        </Card>
                      ))}
                    </div>

                    {/* Custom Input */}
                    <div className="max-w-md mx-auto">
                      <Label htmlFor="squareFootage" className="text-navy font-medium">
                        Or enter custom square footage
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="squareFootage"
                          type="number"
                          value={formData.squareFootage}
                          onChange={(e) => setFormData(prev => ({ ...prev, squareFootage: e.target.value }))}
                          placeholder="Enter custom sq ft"
                          className="text-center text-lg pr-16"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-grey text-sm">
                          sq ft
                        </span>
                      </div>
                    </div>

                    {/* Stairs scope toggle */}
                    <div className="max-w-md mx-auto pt-2">
                      <Label className="text-navy font-medium block mb-2 text-center">
                        Any stairs included in this project?
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "yes", label: "Yes" },
                          { value: "no", label: "No" },
                        ].map((opt) => (
                          <Card
                            key={opt.value}
                            className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                              formData.stairsIncluded === opt.value
                                ? "border-gold bg-gold/10"
                                : "border-grey/20 hover:border-gold/50"
                            }`}
                            onClick={() => setFormData((prev) => ({ ...prev, stairsIncluded: opt.value }))}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="font-medium text-navy text-sm">{opt.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Area Calculator Helper */}
                    <div className="text-center">
                      <details className="inline-block text-left">
                        <summary className="cursor-pointer text-sm text-gold hover:text-gold/80 font-medium">
                          💡 Need help calculating your area?
                        </summary>
                        <div className="mt-2 p-3 bg-grey/5 rounded-lg text-sm text-grey max-w-sm">
                          <p className="mb-2"><strong>Quick calculation:</strong></p>
                          <p>Length × Width = Square Footage</p>
                          <p className="mt-2 text-xs">Example: 20ft × 15ft = 300 sq ft</p>
                          <p className="text-xs">For multiple rooms, add them together</p>
                        </div>
                      </details>
                    </div>
                  </div>
                )}

                {/* Step 6: Timeline (New Install) | Color Change (Refinish) */}
                {currentStep === 6 && formData.serviceType === "new-installation" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        When would you like to start the project?
                      </h3>
                      <p className="text-grey">This helps us schedule and prepare</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {timelines.map((timeline) => (
                        <Card 
                          key={timeline.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.timeline === timeline.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, timeline: timeline.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy">{timeline.label}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 6 && formData.serviceType === "floor-refinish" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Are you planning to change the color of your floors?
                      </h3>
                      <p className="text-grey">This affects the refinishing process and cost</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {colorOptions.map((color) => (
                        <Card 
                          key={color.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.colorChange === color.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, colorChange: color.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy mb-1">{color.label}</h4>
                            <p className="text-sm text-grey">{color.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 7: Budget (New Install) | Timeline (Refinish) */}
                {currentStep === 7 && formData.serviceType === "new-installation" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What's your budget range for this project?
                      </h3>
                      <p className="text-grey">This helps us provide accurate recommendations</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {budgetRanges.map((budget) => (
                        <Card 
                          key={budget.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.budget === budget.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, budget: budget.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy">{budget.label}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 7 && formData.serviceType === "floor-refinish" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        When would you like to start the project?
                      </h3>
                      <p className="text-grey">This helps us schedule and prepare</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {timelines.map((timeline) => (
                        <Card 
                          key={timeline.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.timeline === timeline.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, timeline: timeline.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy">{timeline.label}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 8: Budget (Refinish only) */}
                {currentStep === 8 && formData.serviceType === "floor-refinish" && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        What's your budget range for this project?
                      </h3>
                      <p className="text-grey">This helps us provide accurate recommendations</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {budgetRanges.map((budget) => (
                        <Card 
                          key={budget.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.budget === budget.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, budget: budget.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy">{budget.label}</h4>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Step: Contact Info */}
                {currentStep === getTotalSteps() && (
                  <div className="space-y-6">
                    {/* Visual separator */}
                    <div className="py-8">
                      <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"></div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Get Your Personalized Recommendations
                      </h3>
                      <p className="text-grey">We'll send ideas and samples that match your project</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value, ['required', 'name'])}
                          placeholder="Your name"
                          className={`mt-1 ${formErrors.name ? 'border-red-500' : ''}`}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            handleFieldChange('phone', formatted, ['required', 'phone']);
                          }}
                          placeholder="(732) 555-0123"
                          className={`mt-1 ${formErrors.phone ? 'border-red-500' : ''}`}
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange('email', e.target.value, ['required', 'email'])}
                          placeholder="your@email.com"
                          className={`mt-1 ${formErrors.email ? 'border-red-500' : ''}`}
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleFieldChange('city', e.target.value, ['required'])}
                          placeholder="Enter your city"
                          className={`mt-1 ${formErrors.city ? 'border-red-500' : ''}`}
                        />
                        {formErrors.city && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                        )}
                        <p className="text-xs text-grey mt-1">We serve all of New Jersey</p>
                      </div>
                    </div>

                    {/* Display form-level errors */}
                    {Object.values(formErrors).some(error => error !== '') && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please fix the errors above before submitting.
                          <div className="mt-2 text-xs space-y-1">
                            {Object.entries(formErrors)
                              .filter(([_, error]) => error !== '')
                              .map(([field, error]) => (
                                <div key={field} className="text-red-600">
                                  <strong>{field}:</strong> {error}
                                </div>
                              ))
                            }
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="bg-gold/10 p-4 rounded-lg border border-gold/20">
                      <p className="text-sm text-navy text-center">
                        <strong>No pressure, no sales calls.</strong> We'll send personalized recommendations 
                        and you can reach out when you're ready.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className={`flex mt-8 pt-6 border-t border-grey/20 ${
                  currentStep === getTotalSteps() ? 'justify-center' : 'justify-between'
                }`}>
                  {currentStep > 1 && currentStep < getTotalSteps() && (
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      className="border-grey/30 text-grey hover:border-gold hover:text-gold"
                    >
                      Back
                    </Button>
                  )}
                  
                  <div className={currentStep === getTotalSteps() ? '' : 'ml-auto'}>
                    {currentStep < getTotalSteps() ? (
                      <Button 
                        onClick={nextStep}
                        className="gold-gradient text-black font-semibold"
                      >
                        Next Step
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleSubmit}
                        disabled={
                          isLoading || 
                          Object.values(formErrors).some(error => error !== '') || 
                          !formData.name || 
                          !formData.email || 
                          !formData.phone || 
                          !formData.city
                        }
                        className="gold-gradient text-black font-semibold px-8 py-3 text-base min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isLoading ? "Submitting..." : "Get My Recommendations"}
                          <ArrowRight className="w-4 h-4 flex-shrink-0" />
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};


export default Quiz;