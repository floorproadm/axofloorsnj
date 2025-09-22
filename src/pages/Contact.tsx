import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MessageSquare, Star, Check, AlertTriangle, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  validateRequestSize
} from "@/utils/security-monitoring";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Contact = () => {
  const { toast } = useToast();
  const { validateField } = useFieldValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    service: "",
    timeline: ""
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive form validation
    const validationRules = {
      name: ['required', 'name'],
      email: ['required', 'email'],
      phone: ['required', 'phone'],
      city: ['required', 'city']
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
        formType: 'contact'
      });
      toast({
        title: "Form data too large",
        description: "Please reduce the amount of information and try again.",
        variant: "destructive"
      });
      return;
    }

    // Monitor form submission for suspicious activity
    const isSecure = monitorFormSubmission('contact', formData);
    if (!isSecure) {
      toast({
        title: "Suspicious activity detected",
        description: "Your submission has been flagged for review. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Supabase leads table
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          city: formData.city || null,
          lead_source: 'contact_page',
          status: 'new',
          priority: 'medium',
          services: formData.service ? [formData.service] : [],
          message: `Timeline: ${formData.timeline || 'Not specified'}`
        }]);

      if (error) {
        console.error('Error saving contact lead:', error);
        throw error;
      }

      // Also store in localStorage as backup
      const contactData = {
        ...formData,
        source: 'contact_page',
        type: 'contact_inquiry',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('contactLead', JSON.stringify(contactData));

      toast({
        title: "Thank you for contacting us!",
        description: "We'll get back to you within 24 hours with your free estimate."
      });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        city: "",
        service: "",
        timeline: ""
      });
      setFormErrors({});

    } catch (error) {
      console.error('Contact form submission error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or call us directly at (732) 351-8653",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    "Hardwood Floor Refinishing",
    "Hardwood Floor Installation", 
    "Vinyl Plank Flooring",
    "Staircase Renovation",
    "Floor Repair",
    "Other"
  ];

  const njCities = [
    "Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River",
    "Hamilton", "Trenton", "Clifton", "Camden", "Brick", "Cherry Hill", "Passaic", "Union City",
    "Bayonne", "East Orange", "Vineland", "New Brunswick", "Wayne", "Irvington", "Paramus", "Hoboken"
  ];

  const benefits = [
    "Free in-home consultation & same-day quotes",
    "Licensed, insured, bonded professionals", 
    "Average project: 3–5 days",
    "Save up to 40% vs. replacement",
    "10-year guarantee"
  ];

  const faqs = [
    {
      question: "How soon can you come?",
      answer: "Within 24h for estimates."
    },
    {
      question: "How long does refinishing take?",
      answer: "3–5 days on average."
    },
    {
      question: "Is there dust?",
      answer: "We use dust-free sanding systems."
    }
  ];

  const isFormValid = !Object.keys(formErrors).length && formData.name && formData.email && formData.phone && formData.city;

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 sm:py-20 navy-gradient text-white relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-4 sm:mb-6">
            Get Your Free Hardwood Floor Estimate in 24h – Guaranteed Response.
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-4xl mx-auto mb-8 sm:mb-12">
            Tired of waiting weeks for contractors? We'll get back to you in less than 24 hours so you can start your project fast.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold w-full sm:w-auto">
              <a href="#quote-form" className="flex items-center justify-center gap-2">
                Get My Free Estimate Now
              </a>
            </Button>
            <Button asChild variant="outline" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-navy text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold w-full sm:w-auto">
              <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                Call (732) 351-8653
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-gold text-gold" />
              ))}
            </div>
            <span className="text-navy font-medium text-lg">35+ Google Reviews</span>
          </div>
          <blockquote className="text-grey max-w-4xl mx-auto text-base sm:text-lg italic">
            "Eduardo gave me a quote the same day, finished my project in 4 days, and saved me $3,200 vs. replacement. Amazing team!"
          </blockquote>
          <cite className="text-gold font-medium mt-2 block">— Laura M., NJ</cite>
        </div>
      </section>

      {/* Scarcity & Urgency */}
      <section className="py-8 bg-gold/10 border-l-4 border-gold">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <AlertTriangle className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <p className="text-navy font-bold text-lg">September Schedule is 85% full.</p>
                <p className="text-grey">Only 5 project slots left this month.</p>
              </div>
            </div>
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce font-bold">
              <a href="#quote-form">Reserve My Spot Now</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="quote-form" className="py-16 sm:py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Form - Enhanced */}
            <div className="lg:col-span-2">
              <Card className="shadow-elegant">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-navy">
                    Get My Free Estimate in 24h
                  </CardTitle>
                  <p className="text-grey">Essential fields only - takes 60 seconds</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input 
                        id="name" 
                        placeholder="Full Name" 
                        required 
                        className={`h-12 ${formErrors.name ? 'border-red-500' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value, ['required', 'name'])}
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm">{formErrors.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="(732) 555-0123" 
                        required 
                        className={`h-12 ${formErrors.phone ? 'border-red-500' : ''}`}
                        value={formData.phone}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          handleFieldChange('phone', formatted, ['required', 'phone']);
                        }}
                      />
                      {formErrors.phone && (
                        <p className="text-red-500 text-sm">{formErrors.phone}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com" 
                        required 
                        className={`h-12 ${formErrors.email ? 'border-red-500' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value, ['required', 'email'])}
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        placeholder="Enter your city" 
                        required 
                        className={`h-12 ${formErrors.city ? 'border-red-500' : ''}`}
                        value={formData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value, ['required', 'city'])}
                      />
                      {formErrors.city && (
                        <p className="text-red-500 text-sm">{formErrors.city}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="service">Service Needed</Label>
                      <Select value={formData.service} onValueChange={(value) => setFormData(prev => ({ ...prev, service: value }))}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="What service do you need?" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-input">
                          {services.map((service) => (
                            <SelectItem key={service} value={service.toLowerCase().replace(/\s+/g, '-')}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Project Timeline</Label>
                      <Select value={formData.timeline} onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="When do you want to start?" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-input">
                          <SelectItem value="asap">ASAP</SelectItem>
                          <SelectItem value="this-month">This month</SelectItem>
                          <SelectItem value="next-3-months">Next 3 months</SelectItem>
                        </SelectContent>
                      </Select>
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
                    
                    <Button 
                      type="submit"
                      className="w-full gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg py-4 sm:py-5 h-auto min-h-[48px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      disabled={isSubmitting || !isFormValid}
                    >
                      {isSubmitting ? "Submitting..." : "Get My Free Estimate in 24h"}
                    </Button>
                    
                    <p className="text-xs text-grey text-center">
                      100% free estimate • No obligation • We respect your privacy
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Benefits Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-heading font-bold text-navy">
                    Why Choose Axo Floors?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-grey text-sm">{benefit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Alternative Contact Methods */}
              <Card className="bg-navy text-white">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-lg font-heading font-semibold text-gold">
                    Alternative Contact Methods
                  </h4>
                  
                  <div className="space-y-3">
                    <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-navy w-full justify-start">
                      <a href="tel:(732) 351-8653" className="flex items-center gap-3">
                        <Phone className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium">(732) 351-8653</div>
                          <div className="text-xs opacity-80">Click to call</div>
                        </div>
                      </a>
                    </Button>
                    
                    <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-navy w-full justify-start">
                      <a href="mailto:axofloorsnj@gmail.com" className="flex items-center gap-3">
                        <Mail className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium text-xs">axofloorsnj@gmail.com</div>
                          <div className="text-xs opacity-80">Click to email</div>
                        </div>
                      </a>
                    </Button>
                    
                    <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-navy w-full justify-start">
                      <a href="https://wa.me/17323518653" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium">WhatsApp</div>
                          <div className="text-xs opacity-80">Instant response</div>
                        </div>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-navy mb-4">
              Have questions before booking?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="text-center hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-navy mb-3 text-sm">
                    {faq.question}
                  </h3>
                  <p className="text-grey text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;