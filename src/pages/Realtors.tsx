import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { supabase } from "@/integrations/supabase/client";
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
  TrendingUp, 
  Zap, 
  Shield, 
  Home,
  Users,
  Star,
  Camera,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Realtors = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agentName: "",
    brokerageName: "",
    email: "",
    phone: "",
    averageListings: "",
    marketArea: "",
    message: ""
  });

  const benefits = [
    {
      icon: TrendingUp,
      title: "Increase Home Value",
      description: "Refinished floors can add $5,000-$15,000 to listing value instantly."
    },
    {
      icon: Camera,
      title: "Picture-Perfect Listings",
      description: "Beautiful floors make your listing photos pop and attract more showings."
    },
    {
      icon: Clock,
      title: "Quick Turnaround",
      description: "Most projects complete in 2-5 days. List faster, sell sooner."
    },
    {
      icon: DollarSign,
      title: "Realtor Pricing",
      description: "Special rates for real estate professionals and their clients."
    },
    {
      icon: Calendar,
      title: "Flexible Scheduling",
      description: "We work around showings and closing timelines."
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "10-year warranty gives buyers confidence in their investment."
    }
  ];

  const processSteps = [
    {
      step: "1. Pre-Listing Assessment",
      description: "We evaluate the floors and provide a detailed estimate of value increase potential.",
      icon: Home
    },
    {
      step: "2. Strategic Planning",
      description: "Choose the best stain/finish to match target buyer preferences in your market.",
      icon: Star
    },
    {
      step: "3. Fast Execution",
      description: "Complete the work quickly so you can get the property back on market ASAP.",
      icon: Zap
    }
  ];

  const testimonials = [
    {
      text: "The floors looked incredible in the listing photos. We got 3 offers in the first week, $8,000 over asking price.",
      author: "Jennifer M., RE/MAX Realtor",
      location: "Princeton, NJ"
    },
    {
      text: "AXO Floors helped me turn a dated property into a showstopper. The transformation was remarkable.",
      author: "Mike R., Coldwell Banker",
      location: "Red Bank, NJ"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agentName || !formData.email || !formData.phone) {
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
          contact_name: formData.agentName,
          company_name: formData.brokerageName || formData.agentName,
          email: formData.email,
          phone: formData.phone,
          partner_type: 'realtor',
          status: 'prospect',
          service_zone: 'core',
          lead_source_tag: 'realtors_page',
          notes: `Average Listings: ${formData.averageListings}\nMarket Area: ${formData.marketArea}\n\nMessage: ${formData.message}`,
        } as any]);

      if (error) {
        console.error('Error saving realtor partner:', error);
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
            title: `Novo parceiro B2B: ${formData.agentName}`,
            body: `${formData.brokerageName || formData.agentName} via Realtors Page`,
            type: 'partner',
            link: '/admin/partners',
          }))
        );
      }

      toast({
        title: "Partnership Inquiry Received!",
        description: "We'll be in touch within 24 hours to discuss realtor pricing and scheduling."
      });

      // Reset form
      setFormData({
        agentName: "",
        brokerageName: "",
        email: "",
        phone: "",
        averageListings: "",
        marketArea: "",
        message: ""
      });

    } catch (error) {
      console.error('Realtor form submission error:', error);
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
              Premium Flooring Partner for New Jersey Realtors
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed">
              Transform dated listings into showstoppers. Special realtor pricing, 
              fast turnaround, and guaranteed results that sell homes faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="gold-gradient text-black font-semibold text-lg px-8 py-4 h-auto">
                <a href="#realtor-form" className="flex items-center gap-2">
                  Get Realtor Pricing
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
              <Button variant="outline" asChild className="border-white text-white bg-transparent hover:bg-white hover:text-navy text-lg px-8 py-4 h-auto">
                <Link to="/gallery" className="flex items-center gap-2">
                  See Transformations
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-heading text-navy mb-6">
              Turn Problem Properties into Premium Listings
            </h2>
            <p className="text-xl text-grey leading-relaxed">
              Worn, scratched, or outdated floors are the #1 reason buyers walk away from showings. 
              In just 48 hours, we can transform those floors into a selling feature that 
              adds thousands to your listing value.
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
              How We Help You Sell Faster
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Our proven process is designed specifically for real estate professionals 
              who need results fast.
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

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold font-heading text-navy mb-6">
              Success Stories from NJ Realtors
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-2 border-gold/20 hover:shadow-elegant transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-grey mb-6 text-lg leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="text-navy font-semibold">{testimonial.author}</p>
                    <p className="text-grey text-sm">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Realtor Form Section */}
      <section id="realtor-form" className="py-20 gold-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold font-heading text-black mb-6">
                Partner with AXO Floors Today
              </h2>
              <p className="text-xl text-black/80">
                Get special realtor pricing and priority scheduling for your listings.
              </p>
            </div>

            <Card className="bg-white border-2 border-black/20 shadow-elegant">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="agentName">Agent Name *</Label>
                      <Input
                        id="agentName"
                        value={formData.agentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, agentName: e.target.value }))}
                        placeholder="Your name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="brokerageName">Brokerage</Label>
                      <Input
                        id="brokerageName"
                        value={formData.brokerageName}
                        onChange={(e) => setFormData(prev => ({ ...prev, brokerageName: e.target.value }))}
                        placeholder="RE/MAX, Coldwell Banker, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@realty.com"
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
                      <Label htmlFor="averageListings">Average Monthly Listings</Label>
                      <Input
                        id="averageListings"
                        value={formData.averageListings}
                        onChange={(e) => setFormData(prev => ({ ...prev, averageListings: e.target.value }))}
                        placeholder="e.g., 5-10 per month"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marketArea">Primary Market Area</Label>
                      <Input
                        id="marketArea"
                        value={formData.marketArea}
                        onChange={(e) => setFormData(prev => ({ ...prev, marketArea: e.target.value }))}
                        placeholder="e.g., Monmouth County"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Tell Us About Your Flooring Needs</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="What types of properties do you list? Do you have any current listings that need flooring work? Any specific requirements?"
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <div className="bg-navy/10 p-6 rounded-lg border border-navy/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-navy mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-navy mb-2">What you'll receive:</h4>
                        <ul className="text-sm text-grey space-y-1">
                          <li>• Custom realtor pricing sheet within 24 hours</li>
                          <li>• Priority scheduling for your listings</li>
                          <li>• Before/after photos for your marketing materials</li>
                          <li>• Direct contact with project managers</li>
                          <li>• Marketing materials highlighting floor improvements</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-black text-gold hover:bg-black/90 font-semibold text-lg px-12 py-4 h-auto"
                    >
                      {isSubmitting ? "Sending..." : "Get Realtor Pricing"}
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
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold font-heading text-white mb-6">
            Ready to Transform Your Listings?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join New Jersey realtors who trust AXO Floors to turn problem properties 
            into premium listings that sell faster and for more money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient text-black font-semibold text-lg px-8 py-4 h-auto">
              <a href="#realtor-form">
                Start Partnership Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            <Button variant="outline" asChild className="border-white text-white bg-transparent hover:bg-white hover:text-navy text-lg px-8 py-4 h-auto">
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

export default Realtors;