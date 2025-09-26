import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Phone, CheckCircle, Shield, Calendar, Award, Users, Sparkles } from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import SEOHead from "@/components/shared/SEOHead";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Import existing assets
import beforeAfterComparison from "@/assets/before-after-comparison.png";
import homeHero from "@/assets/home-hero.jpg";
import hardwoodHero from "@/assets/hardwood-hero.jpg";
import sandingHero from "@/assets/sanding-hero-new.jpg";
import teamPhoto from "@/assets/team-photo.jpg";

const Campaign = () => {
  const testimonials = [
    {
      quote: "Our Christmas tree lights literally reflected on the floor. Stunning.",
      location: "Princeton, NJ",
      rating: 5
    },
    {
      quote: "We feared dust everywhere, but AXO's system kept the house spotless.",
      location: "Brooklyn, NY", 
      rating: 5
    },
    {
      quote: "Kids, dog, daily chaos… two months later the floor still looks new.",
      location: "Doylestown, PA",
      rating: 5
    },
    {
      quote: "Professional, punctual, premium. Worth every dollar.",
      location: "Jersey City, NJ",
      rating: 5
    }
  ];

  const signatureServices = [
    { icon: Users, title: "In-home Floor Assessment & Samples" },
    { icon: Sparkles, title: "Low-dust Sanding (HEPA system)" },
    { icon: Award, title: "Premium Low-odor Finishes" },
    { icon: CheckCircle, title: "Custom Color & Tone Matching" },
    { icon: Sparkles, title: "Post-project Deep Cleaning" },
    { icon: Calendar, title: "30-Day Follow-up Visit" },
    { icon: Shield, title: "10-Year Written Warranty" }
  ];

  const benefits = [
    "Immediate pride — a floor that gets compliments instantly",
    "More light & space — finishes that brighten the room",
    "Hygienic & easy-to-clean surfaces",
    "Long-lasting durability (kids & pets approved)",
    "No mess, no heavy odors",
    "Custom look — samples shown under your lighting",
    "Added home value for future resale",
    "Stress-free premium experience from start to finish"
  ];

  return (
    <>
      <SEOHead
        title="Get Ready for the Holidays - Premium Floor Transformation | AXO Floors"
        description="Transform worn floors to stunning in just 72 hours. Premium hardwood restoration across NJ, NY & PA. Limited October slots available. Book your free assessment."
        keywords="holiday floor renovation, hardwood restoration NJ NY PA, floor refinishing, premium flooring services"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Section 1 - Hero */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${beforeAfterComparison})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/60 to-transparent" />
          </div>
          
          <div className="relative z-10 container mx-auto px-4 py-20 text-center text-white">
            <Badge className="mb-6 bg-gold text-navy font-semibold px-6 py-2 text-sm">
              LIMITED OCTOBER SLOTS AVAILABLE
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
              From Worn to <span className="text-gold">WOW</span><br />
              in Just <span className="text-gold">72 Hours</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-grey-light">
              Premium hardwood restoration and installation across NJ, NY & PA
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 text-lg px-8 py-4" asChild>
                <Link to="/contact">
                  Book Your Free Floor Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-4" asChild>
                <Link to="/gallery">
                  See Before & After Gallery
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2 - The Pain */}
        <section className="py-20 bg-grey-light/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src={sandingHero} 
                  alt="Scratched and worn hardwood floor needing restoration"
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
              
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-8">
                  Do your floors <span className="text-destructive">embarrass you</span> when guests arrive?
                </h2>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-3 flex-shrink-0" />
                    <p className="text-lg text-muted-foreground">Scratches that catch the light</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-3 flex-shrink-0" />
                    <p className="text-lg text-muted-foreground">Stains that never disappear</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-3 flex-shrink-0" />
                    <p className="text-lg text-muted-foreground">Floors that age your home overnight</p>
                  </div>
                </div>
                
                <Button className="bg-navy text-white hover:bg-navy/90">
                  Discover the Solution
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 - Transformation */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-6">
                The Difference is <span className="text-gold">Night and Day</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Imagine welcoming family and friends to floors that shine, feel smooth underfoot, 
                and spark the first compliment before the first glass of wine.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <img 
                src={beforeAfterComparison} 
                alt="Before and after floor transformation showing dramatic improvement"
                className="w-full rounded-lg shadow-elegant"
              />
            </div>
          </div>
        </section>

        {/* Section 4 - Customer Story */}
        <section className="py-20 bg-gold/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src={teamPhoto} 
                  alt="Happy homeowners in their beautifully restored living room"
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
              
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-8">
                  From Avoiding Guests… to <span className="text-gold">Proudly Hosting</span> Again
                </h2>
                
                <blockquote className="text-xl italic text-muted-foreground mb-8 pl-6 border-l-4 border-gold">
                  "We delayed hosting dinners for years because of our floors. AXO Floors restored them in 4 days. 
                  The first words we heard? 'Did you replace the entire floor?' We just smiled."
                </blockquote>
                
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white" asChild>
                  <Link to="/gallery">
                    Read More Client Stories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5 - Signature Offer */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-6">
                The AXO Signature Experience
              </h2>
              <p className="text-xl text-muted-foreground">
                More Than Just Floors
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {signatureServices.map((service, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-elegant transition-smooth">
                  <CardContent className="pt-6">
                    <service.icon className="h-12 w-12 text-gold mx-auto mb-4" />
                    <h3 className="font-semibold text-navy">{service.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-gold to-gold/80 text-navy rounded-lg p-8 text-center">
              <h3 className="text-2xl font-heading font-bold mb-4">
                This Month Only: Special Holiday Package
              </h3>
              <p className="text-lg">
                Free Design Consultation + Traffic-Grade Sealant Upgrade + Maintenance Kit
              </p>
            </div>
          </div>
        </section>

        {/* Section 6 - Testimonials Carousel */}
        <section className="py-20 bg-navy text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6">
                What Homeowners Like You Are Saying
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Carousel className="w-full">
                <CarouselContent>
                  {testimonials.map((testimonial, index) => (
                    <CarouselItem key={index}>
                      <Card className="bg-white/10 border-white/20 text-center p-8">
                        <CardContent className="pt-6">
                          <div className="flex justify-center gap-1 mb-6">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                            ))}
                          </div>
                          <blockquote className="text-xl italic mb-6">
                            "{testimonial.quote}"
                          </blockquote>
                          <p className="text-gold font-semibold">
                            — {testimonial.location}
                          </p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </section>

        {/* Section 7 - Emotional Benefits */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-6">
                Here's What You'll <span className="text-gold">Gain</span> with AXO Floors
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-gold flex-shrink-0 mt-1" />
                  <p className="text-lg text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 8 - Guarantee + Scarcity */}
        <section className="py-20 bg-navy text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <Shield className="h-16 w-16 text-gold mx-auto mb-8" />
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-8">
                Protected by Our <span className="text-gold">10-Year AXO Warranty</span>
              </h2>
              
              <p className="text-xl mb-12">
                If your finish peels or fails due to application within 10 years, we'll fix it. Period.
              </p>
              
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-6 mb-8">
                <p className="text-lg font-semibold">
                  ⚠️ We take on only 5 projects per week to maintain premium standards. 
                  <span className="text-gold"> October is almost full.</span>
                </p>
              </div>
              
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 text-xl px-12 py-6" asChild>
                <Link to="/contact">
                  Reserve Your October Spot
                  <Calendar className="ml-2 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 9 - Final CTA */}
        <section className="py-20 bg-gradient-to-r from-gold to-gold/80 text-navy">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6">
                Your Home Deserves to Shine Before the Holidays
              </h2>
              
              <p className="text-xl mb-12">
                Each week you wait means fewer dates available — and another season of excuses. 
                Let's change that today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-navy text-white hover:bg-navy/90 text-xl px-12 py-6" asChild>
                  <Link to="/contact">
                    Book Your Free Floor Assessment
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-navy text-navy hover:bg-navy hover:text-white text-xl px-12 py-6"
                  asChild
                >
                  <a href="tel:+1-555-AXO-FLOOR">
                    <Phone className="mr-2 h-6 w-6" />
                    Call Us Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Campaign;