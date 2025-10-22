import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Mail, Send, AlertCircle } from 'lucide-react';
import { 
  validateForm, 
  sanitizeInput, 
  checkRateLimit, 
  getClientIdentifier,
  formatPhoneNumber,
  useFieldValidation 
} from '@/utils/validation';

const ContactForm = () => {
  const { toast } = useToast();
  const { validateField } = useFieldValidation();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    services: [] as string[],
    budget: '',
    room_size: '',
    city: '',
    zip_code: '',
    message: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceOptions = [
    'Hardwood Flooring Installation',
    'Sanding & Refinishing',
    'Vinyl Plank Flooring',
    'Staircase Refinishing',
    'Baseboards Installation',
    'Floor Repairs',
    'Custom Staining'
  ];

  const handleServiceChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      services: checked 
        ? [...prev.services, service]
        : prev.services.filter(s => s !== service)
    }));
  };

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

  // Helper function to get Facebook pixel data
  const getFacebookPixelData = () => {
    try {
      // Get Facebook Click ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const fbc = urlParams.get('fbclid') ? `fb.1.${Date.now()}.${urlParams.get('fbclid')}` : undefined;
      
      // Get Facebook Browser ID from cookie
      const cookies = document.cookie.split(';');
      const fbpCookie = cookies.find(cookie => cookie.trim().startsWith('_fbp='));
      const fbp = fbpCookie ? fbpCookie.split('=')[1] : undefined;
      
      return { fbc, fbp };
    } catch (error) {
      console.error('Error getting Facebook pixel data:', error);
      return { fbc: undefined, fbp: undefined };
    }
  };

  // Helper function to send Facebook conversion
  const sendFacebookConversion = async (leadData: any) => {
    try {
      const { fbc, fbp } = getFacebookPixelData();
      
      const eventData = {
        event_name: 'Lead',
        email: leadData.email,
        phone: leadData.phone,
        first_name: leadData.name.split(' ')[0],
        last_name: leadData.name.split(' ').slice(1).join(' '),
        source_url: window.location.href,
        value: leadData.budget ? parseInt(leadData.budget) : 0,
        service: leadData.services.join(', '),
        fbc,
        fbp,
        custom_data: {
          lead_source: 'contact_form',
          services: leadData.services,
          city: leadData.city,
          zip_code: leadData.zip_code
        }
      };

      const { error } = await supabase.functions.invoke('facebook-conversions', {
        body: { eventData }
      });

      if (error) {
        console.error('Facebook conversion error:', error);
      } else {
        console.log('Facebook conversion sent successfully');
      }
    } catch (error) {
      console.error('Error sending Facebook conversion:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert into leads table
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone,
          lead_source: 'contact_form',
          status: 'new',
          priority: formData.priority,
          services: formData.services,
          budget: formData.budget ? parseInt(formData.budget) : null,
          room_size: formData.room_size || null,
          city: formData.city || null,
          zip_code: formData.zip_code || null,
          message: formData.message || null
        }]);

      if (error) throw error;

      // Send to Notion
      try {
        await supabase.functions.invoke('send-to-notion', {
          body: {
            name: formData.name,
            email: formData.email || 'no-email@provided.com',
            phone: formData.phone,
            source: 'contact_form',
            services: formData.services,
            budget: formData.budget ? parseInt(formData.budget) : null,
            room_size: formData.room_size,
            city: formData.city,
            zip_code: formData.zip_code,
            priority: formData.priority || 'medium',
            status: 'new',
            message: formData.message,
            notes: `Contact form submission - Services: ${formData.services.join(', ')}`
          }
        });
        console.log('Contact form lead sent to Notion successfully');
      } catch (notionError) {
        console.error('Error sending contact form lead to Notion:', notionError);
        // Não falhar o processo todo por erro do Notion
      }

      // Send Facebook conversion event
      await sendFacebookConversion(formData);

      toast({
        title: "Message sent successfully!",
        description: "We'll contact you within 24 hours to discuss your flooring project."
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        services: [],
        budget: '',
        room_size: '',
        city: '',
        zip_code: '',
        message: '',
        priority: 'medium'
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error sending message",
        description: "Please try again or call us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Get Your Free Estimate
        </CardTitle>
        <p className="text-grey">Tell us about your flooring project and we'll provide a detailed quote.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your.email@example.com"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Your city"
              />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="07001"
              />
            </div>
          </div>

          {/* Services */}
          <div>
            <Label className="text-base font-medium">Services Needed</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {serviceOptions.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={service}
                    checked={formData.services.includes(service)}
                    onCheckedChange={(checked) => handleServiceChange(service, checked as boolean)}
                  />
                  <Label htmlFor={service} className="text-sm font-normal cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="room_size">Approximate Square Footage</Label>
              <Input
                id="room_size"
                value={formData.room_size}
                onChange={(e) => setFormData(prev => ({ ...prev, room_size: e.target.value }))}
                placeholder="e.g., 800 sq ft"
              />
            </div>
            <div>
              <Label htmlFor="budget">Budget Range</Label>
              <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="2500">Under $2,500</SelectItem>
                  <SelectItem value="5000">$2,500 - $5,000</SelectItem>
                  <SelectItem value="10000">$5,000 - $10,000</SelectItem>
                  <SelectItem value="15000">$10,000 - $15,000</SelectItem>
                  <SelectItem value="20000">$15,000 - $20,000</SelectItem>
                  <SelectItem value="25000">$20,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Project Urgency</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select urgency" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="low">Not urgent - planning ahead</SelectItem>
                <SelectItem value="medium">Moderate - within 2-3 months</SelectItem>
                <SelectItem value="high">Urgent - ASAP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Additional Details</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us more about your project, any specific requirements, timeline, or questions you have..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="gold-gradient text-black w-full sm:w-auto min-w-[200px]"
              size="lg"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Get Free Estimate
                </>
              )}
            </Button>
            
            <div className="text-center sm:text-left">
              <p className="text-sm text-grey">
                Or call us directly at{' '}
                <a href="tel:+1-973-727-3545" className="text-gold font-medium hover:underline">
                  <Phone className="w-3 h-3 inline mr-1" />
                  (973) 727-3545
                </a>
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;