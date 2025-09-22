import { useState } from "react";
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

  // Debug logging - COMPONENT MOUNT
  console.log('🚀 [Quiz] COMPONENTE CARREGADO - Quiz component mounted');
  console.log('🚀 [Quiz] Estado inicial:', { currentStep, isLoading });
  console.log('🚀 [Quiz] Supabase client disponível:', !!supabase);
  console.log('🚀 [Quiz] Toast disponível:', !!toast);
  console.log('🚀 [Quiz] Navigate disponível:', !!navigate);
  
  const [formData, setFormData] = useState({
    serviceType: "", // "new-installation" or "floor-refinish"
    floorType: "", // for new installation
    currentCondition: "", // for refinish
    woodType: "", // for refinish
    location: "", // residential, apartment, commercial
    squareFootage: "",
    timeline: "",
    budget: "",
    colorChange: "", // for refinish
    name: "",
    email: "",
    phone: "",
    city: "",
    zipCode: "" // Novo campo ZIP code
  });

  // Auto-preencher cidade baseado no ZIP code de NJ
  const handleZipCodeChange = (zipCode: string) => {
    console.log('🏙️ [Quiz] ZIP code alterado:', zipCode);
    
    // Lista de cidades principais de NJ por região de ZIP code
    const njCitiesByZip: Record<string, string> = {
      '070': 'Newark',
      '071': 'Lyndhurst', 
      '072': 'Elizabeth',
      '073': 'East Orange',
      '074': 'Teaneck',
      '075': 'Passaic',
      '076': 'Hackensack',
      '077': 'Ridgewood',
      '080': 'South Orange',
      '081': 'Union',
      '082': 'Roselle',
      '083': 'Jersey City',
      '084': 'Bayonne',
      '086': 'Weehawken',
      '087': 'West New York',
      '088': 'Brick',
      '089': 'Lakewood',
      '090': 'Freehold',
      '091': 'Monmouth Beach',
      '085': 'Princeton'
    };

    handleFieldChange('zipCode', zipCode);
    
    // Auto-preencher cidade se ZIP code for reconhecido
    if (zipCode.length >= 3) {
      const zipPrefix = zipCode.substring(0, 3);
      const suggestedCity = njCitiesByZip[zipPrefix];
      
      if (suggestedCity && !formData.city) {
        console.log('🏙️ [Quiz] Auto-preenchendo cidade:', suggestedCity);
        setFormData(prev => ({ ...prev, city: suggestedCity }));
      }
    }
  };

  // Real-time field validation
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
    { value: "floor-refinish", label: "Floor Refinish", description: "Refinishing existing floors" }
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

  const getTotalSteps = () => {
    if (formData.serviceType === "new-installation") return 6;
    if (formData.serviceType === "floor-refinish") return 7;
    return 7; // default
  };

  const getRecommendedService = () => {
    if (formData.serviceType === "new-installation") {
      if (formData.floorType === "hardwood") return "/hardwood-flooring";
      if (formData.floorType === "vinyl") return "/vinyl-plank-flooring";
      return "/hardwood-flooring"; // Default for new installation
    }
    return "/sanding-and-refinish"; // Default for refinish
  };

  const handleSubmit = async () => {
    console.log('🎯 [Quiz] SUBMIT INICIADO - handleSubmit called with formData:', formData);
    console.log('🎯 [Quiz] Current step:', currentStep, 'Total steps:', getTotalSteps());
    console.log('🎯 [Quiz] Validation check - name:', !!formData.name, 'email:', !!formData.email, 'phone:', !!formData.phone);
    console.log('🎯 [Quiz] User authentication status:', { 
      hasSupabase: !!supabase,
      timestamp: new Date().toISOString()
    });
    
    // Comprehensive form validation - REMOVENDO OBRIGATORIEDADE DE CITY
    const validationRules = {
      name: ['required', 'name'],
      email: ['required', 'email'],
      phone: ['required', 'phone']
      // city removido - não é mais obrigatório
    };

    const validation = validateForm(formData, validationRules);
    
    if (!validation.isValid) {
      console.log('[Quiz] Validation failed:', validation.errors);
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

    console.log('✅ [Quiz] All validations passed, proceeding with submission');
    setIsLoading(true);

    try {
      // Store quiz results in Supabase with sanitized data
      const quizData = {
        name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        city: sanitizeInput(formData.city) || null,
        zip_code: sanitizeInput(formData.zipCode) || null, // Adicionando ZIP code
        room_size: sanitizeInput(formData.squareFootage) || '0',
        services: [sanitizeInput(formData.serviceType) || 'unknown'], // Convert to array for compatibility
        budget: formData.budget === "10k-plus" ? 15000 : 
               formData.budget === "5k-10k" ? 7500 :
               formData.budget === "2k-5k" ? 3500 : 2000,
        source: 'quiz'
      };

      console.log('📤 [Quiz] Dados preparados para Supabase:', quizData);
      console.log('📤 [Quiz] Tentando inserir no banco de dados...');
      console.log('📤 [Quiz] Supabase client:', { isConnected: !!supabase });

      // Save to Supabase database
      console.log('💾 [Quiz] Tentando salvar no banco...');
      const { data: savedQuiz, error: saveError } = await supabase
        .from('quiz_responses')
        .insert([quizData])
        .select()
        .single();

      console.log('💾 [Quiz] Resposta do Supabase - Data:', savedQuiz, 'Error:', saveError);

      if (saveError) {
        console.error('❌ [Quiz] ERRO NO SUPABASE:', {
          code: saveError.code,
          message: saveError.message,
          details: saveError.details,
          hint: saveError.hint
        });
        throw new Error(`Failed to save quiz response: ${saveError.message}`);
      }

      console.log('✅ [Quiz] Salvo com sucesso no banco:', savedQuiz);

      // Send follow-up email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-follow-up', {
          body: {
            name: formData.name,
            email: formData.email,
            source: 'quiz',
            leadType: 'quiz'
          }
        });

        if (emailError) {
          console.error('[Quiz] Email error:', emailError);
          // Don't fail the whole process for email errors
        } else {
          console.log('[Quiz] Follow-up email sent successfully');
        }
      } catch (emailError) {
        console.error('[Quiz] Email sending failed:', emailError);
        // Don't fail the whole process for email errors
      }

      // Send admin notification
      try {
        console.log('📱 [Quiz] Enviando notificação para +17323518653...');
        const notificationData = {
          leadData: quizData,
          adminEmail: 'axofloorsnj@gmail.com', // Email do admin
          adminPhone: '+17323518653' // SEU NÚMERO DE TELEFONE
        };

        console.log('📱 [Quiz] Dados da notificação:', { 
          adminPhone: notificationData.adminPhone,
          leadName: notificationData.leadData.name,
          leadSource: notificationData.leadData.source
        });

        const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-notifications', {
          body: notificationData
        });

        console.log('📱 [Quiz] Resposta da notificação:', { result: notificationResult, error: notificationError });

        if (notificationError) {
          console.error('❌ [Quiz] ERRO na notificação:', notificationError);
        } else {
          console.log('✅ [Quiz] NOTIFICAÇÃO ENVIADA COM SUCESSO para +17323518653!');
        }
      } catch (notificationError) {
        console.error('❌ [Quiz] FALHA no envio da notificação:', notificationError);
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
      console.error('💥 [Quiz] ERRO CRÍTICO no envio:', {
        error: error,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      toast({
        title: "Algo deu errado no envio",
        description: "Por favor tente novamente ou ligue diretamente para (732) 351-8653",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 [Quiz] Processo finalizado (loading=false)');
    }
  };

  const nextStep = () => {
    console.log('➡️ [Quiz] PRÓXIMO PASSO - nextStep called, currentStep:', currentStep, 'formData:', formData);
    
    // Validation logic based on current step and service type
    if (currentStep === 1 && !formData.serviceType) {
      toast({
        title: "Please select a service type",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 2) {
      if (formData.serviceType === "new-installation" && !formData.floorType) {
        toast({
          title: "Please select a flooring type",
          variant: "destructive"
        });
        return;
      }
      if (formData.serviceType === "floor-refinish" && !formData.currentCondition) {
        toast({
          title: "Please select the current condition",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentStep === 3) {
      if (formData.serviceType === "floor-refinish" && !formData.woodType) {
        toast({
          title: "Please select your wood type",
          variant: "destructive"
        });
        return;
      }
      if (formData.serviceType === "new-installation" && !formData.location) {
        toast({
          title: "Please select the location type",
          variant: "destructive"
        });
        return;
      }
    }
    
    const newStep = Math.min(currentStep + 1, getTotalSteps());
    console.log('[Quiz] Moving to step:', newStep);
    setCurrentStep(newStep);
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    console.log('[Quiz] Going back to step:', newStep);
    setCurrentStep(newStep);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">
                Does Your Floor Add or Subtract Value From Your Home?
              </h1>
              <p className="text-lg sm:text-xl text-grey mb-6">
                Discover in 30 seconds how to transform your floors into a high-impact differentiator for your home.
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

                {/* Step 4: Square Footage */}
                {((currentStep === 4 && formData.serviceType === "new-installation") || 
                  (currentStep === 4 && formData.serviceType === "floor-refinish")) && (
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

                {/* Step 5: Color Change (Refinish only) or Timeline (New Install) */}
                {currentStep === 5 && formData.serviceType === "floor-refinish" && (
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

                {currentStep === 5 && formData.serviceType === "new-installation" && (
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

                {/* Step 6: Timeline (Refinish) or Budget (New Install) */}
                {currentStep === 6 && formData.serviceType === "floor-refinish" && (
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

                {currentStep === 6 && formData.serviceType === "new-installation" && (
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

                {/* Step 7: Budget (Refinish only) */}
                {currentStep === 7 && formData.serviceType === "floor-refinish" && (
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
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => {
                            const zipValue = e.target.value.replace(/\D/g, ''); // Apenas números
                            if (zipValue.length <= 5) {
                              handleZipCodeChange(zipValue);
                            }
                          }}
                          placeholder="07001"
                          maxLength={5}
                          className={`mt-1 ${formErrors.zipCode ? 'border-red-500' : ''}`}
                        />
                        {formErrors.zipCode && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.zipCode}</p>
                        )}
                        <p className="text-xs text-grey mt-1">Servimos toda região de New Jersey</p>
                      </div>
                      <div>
                        <Label htmlFor="city">City (optional)</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          placeholder="Será preenchido automaticamente"
                          className={`mt-1 ${formErrors.city ? 'border-red-500' : ''}`}
                        />
                        {formErrors.city && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                        )}
                        <p className="text-xs text-grey mt-1">Preenchimento automático baseado no ZIP code</p>
                      </div>
                    </div>

                    {/* Display form-level errors */}
                    {Object.keys(formErrors).length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please fix the errors above before submitting.
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
                        onClick={() => {
                          console.log('🔘 [Quiz] BOTÃO SUBMIT CLICADO!');
                          console.log('🔘 [Quiz] Form data atual:', formData);
                          console.log('🔘 [Quiz] Loading state:', isLoading);
                          console.log('🔘 [Quiz] Form errors:', formErrors);
                          console.log('🔘 [Quiz] Botão desabilitado?', isLoading || Object.keys(formErrors).length > 0 || !formData.name || !formData.email || !formData.phone);
                          handleSubmit();
                        }}
                        disabled={isLoading || Object.keys(formErrors).length > 0 || !formData.name || !formData.email || !formData.phone}
                        className="gold-gradient text-black font-semibold px-8 py-3 text-base min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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

// Adicionar event listeners para capturar erros globais
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    console.error('🚨 [Quiz] ERRO GLOBAL capturado:', e.error);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 [Quiz] PROMISE REJEITADA capturada:', e.reason);
  });
  
  console.log('🎯 [Quiz] Event listeners adicionados para capturar erros');
}

export default Quiz;