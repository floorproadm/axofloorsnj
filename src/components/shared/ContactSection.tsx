import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ContactSection = () => {
  const { toast } = useToast();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Quote Request Sent!",
      description: "We'll contact you within 24 hours to discuss your project.",
    });
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      service: "",
      message: ""
    });
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-grey-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
            Get Your <span className="text-gradient-gold">Free Quote!</span>
          </h2>
          <p className="text-base sm:text-lg text-grey max-w-2xl mx-auto px-2">
            Get a quote on us and we can explain everything about our services.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Contact Info - Stack on mobile */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-1">
            <Card className="hover:shadow-elegant transition-smooth">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full">
                    <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-navy mb-1 text-sm sm:text-base">Phone</h3>
                    <a href="tel:(732) 351-8653" className="text-grey hover:text-gold transition-smooth text-sm sm:text-base">
                      (732) 351-8653
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elegant transition-smooth">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-navy mb-1 text-sm sm:text-base">Email</h3>
                    <a href="mailto:contact@axofloorsnj.com" className="text-grey hover:text-gold transition-smooth text-xs sm:text-sm break-all">
                      contact@axofloorsnj.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form - Full width on mobile */}
          <div className="lg:col-span-2">
            <Card className="shadow-elegant">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-heading text-navy">Request Your Free Quote</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-1 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm">Project Details</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your project..."
                      className="mt-1 min-h-[100px] sm:min-h-[120px]"
                    />
                  </div>

                  <Button type="submit" className="w-full gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg py-4 sm:py-6 min-h-[48px]">
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Send Quote Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;