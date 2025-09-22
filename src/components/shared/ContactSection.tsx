import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
const ContactSection = () => {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const handleServiceChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      service: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      // Save contact form data to database
      const contactData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        lead_source: 'contact_section',
        status: 'new',
        priority: 'medium',
        city: null,
        room_size: 'contact_form',
        services: formData.service ? [formData.service] : ['general_inquiry'],
        budget: 0,
        message: 'Contact form submission from website'
      };
      const {
        data: savedContact,
        error: saveError
      } = await supabase.from('leads').insert([contactData]).select().single();
      if (saveError) {
        throw new Error(`Failed to save contact: ${saveError.message}`);
      }

      // Send follow-up email to customer
      try {
        await supabase.functions.invoke('send-follow-up', {
          body: {
            name: formData.name,
            email: formData.email,
            source: 'contact_form',
            leadType: 'contact'
          }
        });
      } catch (emailError) {
        console.error('Follow-up email error:', emailError);
      }

      // Send admin notification
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            leadData: {
              ...contactData,
              message: formData.message
            },
            adminEmail: 'axofloorsnj@gmail.com',
            adminPhone: '+17323518653'
          }
        });
      } catch (notificationError) {
        console.error('Admin notification error:', notificationError);
      }
      toast({
        title: "Quote Request Sent!",
        description: "We'll contact you within 24 hours to discuss your project."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        message: ""
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: "There was a problem submitting your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <section className="spacing-mobile-md bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        

        <div className="max-w-4xl mx-auto">
          {/* Contact Form - Full width */}
          <Card className="shadow-elegant border-0 bg-card/90 backdrop-blur-sm">
            <CardHeader className="p-6 sm:p-8 pb-6 bg-gradient-to-r from-accent/5 to-primary/5 border-b border-accent/10">
              <CardTitle className="text-mobile-xl sm:text-2xl font-heading text-center bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Ready to Transform Your Floors?</CardTitle>
              <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md mx-auto">Fill out the form below and we'll get back to you within 24 hours</p>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 pt-2">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {/* Mobile: Stack all inputs, Desktop: Grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="min-h-[48px] text-base border-2 focus:border-accent transition-colors duration-300" placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required className="min-h-[48px] text-base border-2 focus:border-accent transition-colors duration-300" placeholder="your@email.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="min-h-[48px] text-base border-2 focus:border-accent transition-colors duration-300" placeholder="(732) 555-0123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-sm font-medium">Service Interested In</Label>
                    <Select value={formData.service} onValueChange={handleServiceChange}>
                      <SelectTrigger className="min-h-[48px] text-base border-2 focus:border-accent transition-colors duration-300">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-accent/20">
                        <SelectItem value="hardwood_flooring">Hardwood Flooring</SelectItem>
                        <SelectItem value="sanding_refinishing">Sanding & Refinishing</SelectItem>
                        <SelectItem value="vinyl_plank">Vinyl Plank Flooring</SelectItem>
                        <SelectItem value="staircase">Staircase Services</SelectItem>
                        <SelectItem value="baseboards">Baseboards</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Project Details</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleInputChange} placeholder="Tell us about your project: room size, current flooring, timeline, etc..." className="min-h-[120px] sm:min-h-[140px] text-base border-2 focus:border-accent transition-colors duration-300 resize-none" />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all duration-300 text-base font-semibold min-h-[52px] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send className="w-5 h-5 mr-2" />
                  {isLoading ? "Sending..." : "Send Quote Request"}
                </Button>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  By submitting this form, you agree to be contacted by AXO Floors about your project. We respect your privacy.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>;
};
export default ContactSection;