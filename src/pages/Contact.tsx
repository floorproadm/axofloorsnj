import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MessageSquare, Star, Check, AlertTriangle, ExternalLink } from "lucide-react";

const Contact = () => {
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
            {/* Contact Form - Simplified */}
            <div className="lg:col-span-2">
              <Card className="shadow-elegant">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl sm:text-3xl font-heading font-bold text-navy">
                    Get My Free Estimate in 24h
                  </CardTitle>
                  <p className="text-grey">Essential fields only - takes 60 seconds</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" placeholder="Full Name" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" placeholder="(732) 555-0123" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="your@email.com" required className="h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Select>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your NJ city" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-input max-h-60 overflow-y-auto">
                        {njCities.map((city) => (
                          <SelectItem key={city} value={city.toLowerCase()}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="service">Service Needed</Label>
                    <Select>
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
                    <Select>
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
                  
                  <Button className="w-full gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg py-4 sm:py-5 h-auto min-h-[48px] font-semibold">
                    Get My Free Estimate in 24h
                  </Button>
                  
                  <p className="text-xs text-grey text-center">
                    100% free estimate • No obligation • We respect your privacy
                  </p>
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
                      <a href="mailto:contact@axofloorsnj.com" className="flex items-center gap-3">
                        <Mail className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium text-xs">contact@axofloorsnj.com</div>
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