import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle, Star, Shield, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput, useFieldValidation } from "@/utils/validation";

interface LeadMagnetGateProps {
  title: string;
  description: string;
  fileName: string;
  downloadUrl: string;
  benefits: string[];
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "gold";
  value?: string; // e.g. "$97 value"
  category?: string;
}

export const LeadMagnetGate = ({
  title,
  description,
  fileName,
  downloadUrl,
  benefits,
  triggerText = "Download Free Guide",
  triggerVariant = "default",
  value,
  category = "guide"
}: LeadMagnetGateProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { validateField } = useFieldValidation();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const nameError = validateField(name, ['required', 'name']);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateField(email, ['required', 'email']);
    if (emailError) newErrors.email = emailError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save lead to database
      const leadData = {
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        phone: "000-000-0000", // Placeholder since we don't collect phone for lead magnets
        lead_source: 'lead_magnet',
        status: 'new',
        priority: 'high',
        services: [category],
        notes: `Downloaded: ${title}`
      };

      const { data: savedLead, error: saveError } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save lead: ${saveError.message}`);
      }

      // Send follow-up email
      try {
        await supabase.functions.invoke('send-follow-up', {
          body: {
            name: name,
            email: email,
            source: 'lead_magnet',
            leadType: 'lead_magnet',
            downloadTitle: title
          }
        });
      } catch (emailError) {
        console.warn('Failed to send follow-up email:', emailError);
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();

      setIsSuccess(true);
      
      toast({
        title: "Success! 🎉",
        description: "Your download should start automatically. Check your email for more resources!"
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setEmail("");
        setName("");
      }, 2000);

    } catch (error) {
      console.error('Lead magnet submission error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonStyles = () => {
    switch (triggerVariant) {
      case "gold":
        return "bg-gold text-navy hover:bg-gold/90 shadow-gold";
      case "outline":
        return "border-navy text-navy hover:bg-navy hover:text-white";
      default:
        return "bg-navy text-white hover:bg-navy/90";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg" 
          className={`${getButtonStyles()} transform hover:scale-105 transition-all duration-300 font-semibold`}
        >
          <Download className="mr-2 h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-center mb-4">
            {value && (
              <Badge className="mb-2 bg-gold text-navy font-semibold">
                {value} - FREE TODAY
              </Badge>
            )}
            <DialogTitle className="text-xl font-heading font-bold text-navy mb-2">
              {title}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          </div>
        </DialogHeader>

        {!isSuccess ? (
          <div className="space-y-4">
            {/* Benefits */}
            <div className="bg-grey-light/10 rounded-lg p-4">
              <h4 className="font-semibold text-navy mb-3 text-sm flex items-center">
                <Sparkles className="h-4 w-4 text-gold mr-2" />
                What You'll Get:
              </h4>
              <ul className="space-y-2">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Your Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Your Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>No Spam</span>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gold text-navy hover:bg-gold/90 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy mr-2" />
                    Getting Your Download...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Get My Free {category === 'guide' ? 'Guide' : 'Download'}
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              By downloading, you agree to receive helpful flooring tips via email. 
              Unsubscribe anytime.
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">
              Download Started! 🎉
            </h3>
            <p className="text-muted-foreground mb-4">
              Check your email for additional resources and tips.
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                We've also sent you exclusive flooring tips and our latest project gallery!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadMagnetGate;