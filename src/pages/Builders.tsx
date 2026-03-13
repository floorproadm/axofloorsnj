import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp,
  Building,
  Handshake,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Builders = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    projectVolume: "",
    currentFlooringPartner: "",
    message: ""
  });

  const benefits = [
    {
      icon: DollarSign,
      title: "Contractor Pricing",
      description: "Exclusive bulk rates up to 30% off retail pricing for repeat partnerships."
    },
    {
      icon: Clock,
      title: "Priority Scheduling",
      description: "Your projects get first priority in our schedule. No delays on your timelines."
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "10-year warranty on all work. We stand behind every floor we install."
    },
    {
      icon: Users,
      title: "Dedicated Support",
      description: "Direct line to project managers. No middleman, faster communication."
    },
    {
      icon: Zap,
      title: "Fast Turnaround",
      description: "Most residential projects completed in 2-5 days. Keep your builds on schedule."
    },
    {
      icon: TrendingUp,
      title: "Grow Together",
      description: "As your business grows, your flooring costs decrease with volume discounts."
    }
  ];

  const processSteps = [
    {
      step: "1. Partnership Setup",
      description: "We discuss your typical project volume, preferred timelines, and establish your contractor rates.",
      icon: Handshake
    },
    {
      step: "2. Project Planning",
      description: "Send us your project details and timeline. We provide quotes within 24 hours.",
      icon: Target
    },
    {
      step: "3. Seamless Execution",
      description: "We coordinate with your schedule, complete the work on time, and handle all cleanup.",
      icon: Building
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to partners table as B2B prospect
      const { error } = await supabase
        .from('partners')
        .insert([{
          contact_name: formData.contactName,
          company_name: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          partner_type: 'builder',
          status: 'prospect',
          service_zone: 'core',
          lead_source_tag: 'builders_page',
          notes: `Project Volume: ${formData.projectVolume}\nCurrent Partner: ${formData.currentFlooringPartner}\n\nMessage: ${formData.message}`,
        } as any]);

      if (error) {
        console.error('Error saving builder partner:', error);
        throw error;
      }

      // Notify admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        await supabase.from('notifications').insert(
          admins.map((a: any) => ({
            user_id: a.user_id,
            title: `Novo parceiro B2B: ${formData.companyName}`,
            body: `${formData.contactName} via Builders Page`,
            type: 'partner',
            link: '/admin/partners',
            organization_id: AXO_ORG_ID,
          }))
        );
      }

      toast({
        title: "Partnership Inquiry Received!",
        description: "We'll be in touch within 24 hours to discuss your contractor rates and scheduling."
      });

      // Reset form
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        projectVolume: "",
        currentFlooringPartner: "",
        message: ""
      });

    } catch (error) {
      console.error('Builder form submission error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or call us directly at (732) 351-8653",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading mb-6">
              Premium Flooring Partner for New Jersey Builders
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
              Contractor pricing, priority scheduling, and guaranteed quality. 
              Let's build something great together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gold-gradient text-black font-semibold text-lg px-8 py-4 h-auto">
                <a href="#partnership-form" className="flex items-center gap-2">
                  Get Contractor Pricing
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <Button variant="outline" asChild className="border-white text-white bg-transparent hover:bg-white hover:text-navy text-lg px-8 py-4 h-auto">
                <Link to="/gallery" className="flex items-center gap-2">
                  View Our Work
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-heading text-navy mb-6">
              Why Builders Choose AXO Floors
            </h2>
            <p className="text-xl text-grey max-w-3xl mx-auto">
              We understand that your timeline is everything. That's why we've built our 
              business around supporting builders with reliable, high-quality flooring services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white border-2 border-gold/20 hover:shadow-elegant hover:border-gold/50 transition-all group">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-6 group-hover:bg-gold/20 transition-colors">
                    <benefit.icon className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-navy mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-grey leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-heading text-white mb-6">
              How Our Partnership Works
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Simple, straightforward, and designed to keep your projects on track.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <Card key={index} className="bg-white/95 backdrop-blur-sm border-gold/20 text-center">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-6">
                    <step.icon className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-navy mb-4">
                    {step.step}
                  </h3>
                  <p className="text-grey leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Form Section */}
      <section id="partnership-form" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold font-heading text-navy mb-6">
                Start Your Partnership Today
              </h2>
              <p className="text-xl text-grey">
                Tell us about your projects and we'll provide custom contractor pricing within 24 hours.
              </p>
            </div>

            <Card className="bg-white border-2 border-gold/20 shadow-elegant">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your construction company"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Your name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@company.com"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(732) 555-0123"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectVolume">Monthly Project Volume</Label>
                      <Input
                        id="projectVolume"
                        value={formData.projectVolume}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectVolume: e.target.value }))}
                        placeholder="e.g., 5-10 homes per month"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentFlooringPartner">Current Flooring Partner</Label>
                      <Input
                        id="currentFlooringPartner"
                        value={formData.currentFlooringPartner}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentFlooringPartner: e.target.value }))}
                        placeholder="Who do you currently use?"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Tell Us About Your Projects</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="What types of homes do you build? What flooring services do you need most? Any specific requirements?"
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <div className="bg-gold/10 p-6 rounded-lg border border-gold/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-gold mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-navy mb-2">What happens next?</h4>
                        <ul className="text-sm text-grey space-y-1">
                          <li>• We'll call you within 24 hours to discuss your needs</li>
                          <li>• Provide custom contractor pricing based on your volume</li>
                          <li>• Schedule a site visit to see our work quality firsthand</li>
                          <li>• Set up your priority scheduling and project management system</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="gold-gradient text-black font-semibold text-lg px-12 py-4 h-auto"
                    >
                      {isSubmitting ? "Sending..." : "Get Contractor Pricing"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gold-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold font-heading text-black mb-6">
            Ready to Partner with New Jersey's Premier Flooring Team?
          </h2>
          <p className="text-xl text-black/80 mb-8 max-w-3xl mx-auto">
            Join the builders who trust AXO Floors for reliable, high-quality flooring 
            that keeps their projects on schedule and their clients happy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-black text-gold hover:bg-black/90 font-semibold text-lg px-8 py-4 h-auto">
              <a href="#partnership-form">
                Start Partnership Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button variant="outline" asChild className="border-black text-black bg-transparent hover:bg-black hover:text-gold text-lg px-8 py-4 h-auto">
              <a href="tel:(732) 351-8653">
                Call Direct: (732) 351-8653
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Builders;