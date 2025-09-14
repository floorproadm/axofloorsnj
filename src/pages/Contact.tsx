import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Clock, Star, ArrowRight, Send } from "lucide-react";
const Contact = () => {
  const services = ["Hardwood Flooring Installation", "Floor Sanding & Refinishing", "Vinyl Plank Flooring", "Staircase Renovation", "Baseboards & Trim", "Floor Repair", "Free Consultation", "Other"];
  const contactInfo = [{
    icon: Phone,
    title: "Call Us",
    info: "(732) 351-8653",
    description: "Available Mon-Fri 8AM-6PM",
    action: "tel:(732) 351-8653"
  }, {
    icon: Mail,
    title: "Email Us",
    info: "contact@axofloorsnj.com",
    description: "We respond within 2 hours",
    action: "mailto:contact@axofloorsnj.com"
  }, {
    icon: MapPin,
    title: "Service Area",
    info: "All of New Jersey",
    description: "Free estimates available",
    action: null
  }];
  return <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 navy-gradient text-white relative overflow-hidden">
        
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-gold text-gold" />)}
            </div>
            <span className="text-gold font-medium">35+ Google Reviews</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
            Get Your Free Quote Today
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Ready to transform your floors? Contact AXO Floors for a free consultation and detailed quote. We're here to bring your flooring vision to life.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-white/60">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Free Estimates</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>Licensed & Insured</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
          </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Choose the best way to reach us. We're committed to responding quickly and providing the information you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((contact, index) => <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2 text-center">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-6 group-hover:bg-gold group-hover:scale-110 transition-bounce">
                    <contact.icon className="w-8 h-8 text-gold group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-navy mb-2 group-hover:text-gold transition-smooth">
                    {contact.title}
                  </h3>
                  <p className="text-2xl font-bold text-navy mb-2">{contact.info}</p>
                  <p className="text-grey mb-6">{contact.description}</p>
                  {contact.action && <Button asChild variant="outline" className="hover:bg-gold hover:text-navy hover:border-gold">
                      <a href={contact.action}>
                        {contact.title === "Call Us" ? "Call Now" : "Send Email"}
                      </a>
                    </Button>}
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Form */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-3xl font-heading font-bold text-navy text-center">
                  Request Free Quote
                </CardTitle>
                <p className="text-grey text-center">Fill out the form below and we'll get back to you within 2 hours</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="John" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Smith" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="(732) 555-0123" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Property Address</Label>
                  <Input id="address" placeholder="123 Main St, City, NJ 07001" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service">Service Needed</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => <SelectItem key={service} value={service.toLowerCase().replace(/\s+/g, '-')}>
                          {service}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeline">Project Timeline</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="When do you want to start?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">As soon as possible</SelectItem>
                      <SelectItem value="1-month">Within 1 month</SelectItem>
                      <SelectItem value="2-3-months">2-3 months</SelectItem>
                      <SelectItem value="3-6-months">3-6 months</SelectItem>
                      <SelectItem value="planning">Just planning/researching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Project Details</Label>
                  <Textarea id="message" placeholder="Tell us about your project - room size, current flooring, specific requirements, etc." rows={4} />
                </div>
                
                <Button className="w-full gold-gradient hover:scale-105 transition-bounce text-lg py-6 h-auto">
                  <Send className="w-5 h-5 mr-2" />
                  Send My Request
                </Button>
                
                <p className="text-xs text-grey text-center">
                  By submitting this form, you agree to be contacted by AXO Floors regarding your project. 
                  We respect your privacy and will never share your information.
                </p>
              </CardContent>
            </Card>

            {/* Info Side */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-heading font-bold text-navy mb-6">
                  Why Choose AXO Floors?
                </h3>
                <div className="space-y-4">
                  {["Free in-home consultation and detailed quotes", "Licensed, insured, and bonded professionals", "Premium materials from trusted suppliers", "Competitive pricing with no hidden fees", "100% satisfaction guarantee on all work", "Serving all of New Jersey since 2009"].map((benefit, index) => <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        <ArrowRight className="w-3 h-3 text-gold" />
                      </div>
                      <span className="text-grey">{benefit}</span>
                    </div>)}
                </div>
              </div>

              <Card className="bg-navy text-white">
                <CardContent className="p-6">
                  <h4 className="text-xl font-heading font-semibold mb-4 text-gold">
                    Prefer to Talk? Call Now!
                  </h4>
                  <p className="text-white/80 mb-4">
                    Speak directly with our flooring experts for immediate answers to your questions.
                  </p>
                  <Button asChild variant="outline" className="border-gold text-gold hover:bg-gold hover:text-navy w-full">
                    <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      (732) 351-8653
                    </a>
                  </Button>
                  <p className="text-xs text-white/60 mt-3 text-center">
                    Available Mon-Fri 8AM-6PM, Sat 9AM-4PM
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gold/10 border-gold/20">
                <CardContent className="p-6">
                  <h4 className="text-xl font-heading font-semibold mb-4 text-navy">
                    Emergency Repairs Available
                  </h4>
                  <p className="text-grey mb-4">
                    Water damage? Urgent repair needed? We offer emergency flooring services for urgent situations.
                  </p>
                  <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">
                    Emergency Contact
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Contact;