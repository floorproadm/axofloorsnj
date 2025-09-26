import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Phone, CheckCircle, Shield, Calendar, Award, Users, Sparkles, TrendingUp, MapPin } from "lucide-react";
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
import { useState, useEffect } from "react";

// Import existing assets
import holidayHeroFloor from "@/assets/holiday-hero-floor.jpg";
import realDamagedFloor from "@/assets/real-damaged-floor-better.png";
import afterCampaignNew from "@/assets/after-campaign-new.png";
import happyCustomers from "@/assets/happy-customers.jpg";
import happyCoupleFloors from "@/assets/happy-couple-with-mascot.png";
import professionalProcess from "@/assets/professional-process.jpg";

const Campaign = () => {
  const [showStickyButton, setShowStickyButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyButton(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const testimonials = [
    {
      quote: "Our Christmas tree lights literally reflected on the floor. Stunning.",
      location: "Princeton, NJ",
      name: "Sarah M.",
      rating: 5
    },
    {
      quote: "We feared dust everywhere, but AXO's system kept the house spotless.",
      location: "Brooklyn, NY", 
      name: "Michael R.",
      rating: 5
    },
    {
      quote: "Kids, dog, daily chaos… two months later the floor still looks new.",
      location: "Doylestown, PA",
      name: "Jennifer L.",
      rating: 5
    },
    {
      quote: "Professional, punctual, premium. Worth every dollar.",
      location: "Jersey City, NJ",
      name: "David K.",
      rating: 5
    },
    {
      quote: "Neighbors keep asking who did our floors. AXO transformed our entire home's feel.",
      location: "Holmdel, NJ",
      name: "Lisa W.",
      rating: 5
    },
    {
      quote: "From consultation to cleanup, flawless experience. Our Alpine home looks magazine-ready.",
      location: "Alpine, NJ",
      name: "Robert T.",
      rating: 5
    },
    {
      quote: "Hosting Thanksgiving was a dream. Everyone complimented our 'new' 15-year-old floors.",
      location: "Short Hills, NJ",
      name: "Amanda C.",
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
        <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${holidayHeroFloor})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/70 to-navy/40" />
          </div>
          
          <div className="relative z-10 container mx-auto px-4 py-16 sm:py-20 text-center text-white">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Award className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold">500+ Homes Transformed</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <MapPin className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold">NJ, NY & PA</span>
              </div>
            </div>
            
            <Badge className="mb-6 bg-gold text-navy font-semibold px-6 py-2 text-sm">
              LIMITED OCTOBER SLOTS AVAILABLE
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight px-4">
              From Worn to <span className="text-gold animate-pulse">WOW</span><br />
              in Just <span className="text-gold bg-gold/10 px-2 sm:px-3 py-1 rounded-lg">72 Hours</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 max-w-3xl mx-auto text-grey-light px-4">
              Premium hardwood restoration and installation across NJ, NY & PA
            </p>
            
            <div className="flex flex-col gap-4 justify-center px-4 max-w-md sm:max-w-none mx-auto sm:flex-row">
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 text-base sm:text-lg px-6 sm:px-8 py-4 transform hover:scale-105 transition-all duration-300 shadow-gold w-full sm:w-auto" asChild>
                <Link to="/contact">
                  Get My Free Estimate
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="border-white bg-white/10 text-white hover:bg-white hover:text-navy text-base sm:text-lg px-6 sm:px-8 py-4 backdrop-blur-sm w-full sm:w-auto font-semibold" asChild>
                <Link to="/gallery">
                  See Before & After Gallery
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2 - The Pain */}
        <section className="py-12 sm:py-16 lg:py-20 bg-grey-light/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src={realDamagedFloor} 
                  alt="Real damaged hardwood floor showing scratches, stains and wear that embarrasses homeowners"
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
              
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-6 sm:mb-8">
                  Do your floors <span className="text-destructive relative">
                    embarrass you
                    <div className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-0.5 sm:h-1 bg-destructive/30 rounded"></div>
                  </span> when guests arrive?
                </h2>
                
                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-destructive rounded-full mt-1 sm:mt-2 flex-shrink-0 animate-pulse" />
                    <p className="text-base sm:text-lg text-muted-foreground text-left">Scratches that catch the light awkwardly</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-destructive rounded-full mt-1 sm:mt-2 flex-shrink-0 animate-pulse" />
                    <p className="text-base sm:text-lg text-muted-foreground text-left">Stains that never disappear</p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-3 h-3 bg-destructive rounded-full mt-1 sm:mt-2 flex-shrink-0 animate-pulse" />
                    <p className="text-base sm:text-lg text-muted-foreground text-left">Floors that age your home instantly</p>
                  </div>
                </div>
                
                <Button size="lg" className="bg-navy text-white hover:bg-navy/90 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto text-lg px-8 py-4 font-semibold shadow-lg" asChild>
                  <Link to="/contact">
                    Get My Solution Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 - Transformation */}
        <section className="py-12 sm:py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-4 sm:mb-6 px-4">
                The Difference is <span className="text-gold">Night and Day</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
                Imagine welcoming family and friends to floors that shine, feel smooth underfoot, 
                and spark the first compliment before the first glass of wine.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <img 
                  src={afterCampaignNew} 
                  alt="Beautiful restored hardwood floor after AXO Floors transformation showing stunning craftsmanship"
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
              
              <div className="order-1 lg:order-2 text-center lg:text-left">
                <h3 className="text-2xl sm:text-3xl font-heading font-bold text-navy mb-4 sm:mb-6">
                  From Worn to <span className="text-gold">Wow</span>
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground mb-6">
                  See the incredible transformation our expert craftsmen delivered. This beautiful hardwood floor restoration showcases the premium quality and attention to detail that makes AXO Floors the trusted choice across NJ, NY & PA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 - Holiday Storytelling */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gold/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <img 
                  src={happyCoupleFloors} 
                  alt="Happy couple standing in their beautiful living room with restored hardwood floors"
                  className="rounded-lg shadow-elegant w-full"
                />
              </div>
              
              <div className="text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-navy mb-6 sm:mb-8 px-4 lg:px-0">
                  Picture This: <span className="text-gold">Thanksgiving Dinner</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-4 lg:px-0">
                  Instead of apologizing for scratched floors, you proudly host with floors that shine. 
                  Every reflection of the chandelier, every compliment from family — it all starts with one decision today.
                </p>
                
                <blockquote className="text-lg sm:text-xl italic text-muted-foreground mb-6 sm:mb-8 pl-6 border-l-4 border-gold">
                  "We delayed hosting dinners for years because of our floors. AXO Floors restored them in 2 days. 
                  The first words we heard? 'Did you replace the entire floor?' We just smiled."
                </blockquote>
                
                <div className="flex gap-1 mb-4 sm:mb-6 justify-center lg:justify-start">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-gold text-gold" />
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">— The Johnson Family, Short Hills, NJ</p>
                
                <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white w-full sm:w-auto" asChild>
                  <Link to="/gallery">
                    Read More Success Stories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Mid-Page CTA Section */}
        <section className="py-12 sm:py-16 bg-navy text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4">
                Every Month You Wait, <span className="text-destructive">The Wood Suffers More</span>
              </h2>
              <p className="text-lg mb-8">
                Scratches deepen. Stains set. What could be fixed today becomes a replacement tomorrow.
              </p>
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 text-lg px-8 py-4" asChild>
                <Link to="/contact">
                  Get My Free Estimate Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 5 - Signature Offer */}
        <section className="py-12 sm:py-16 lg:py-20 bg-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-5">
            <img 
              src={professionalProcess} 
              alt="Professional floor refinishing equipment"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-4 sm:mb-6 px-4">
                The AXO Signature Experience
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground px-4">
                More Than Just Floors
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
              {signatureServices.map((service, index) => (
                <Card key={index} className="text-center p-4 sm:p-6 hover:shadow-elegant transition-smooth">
                  <CardContent className="pt-4 sm:pt-6">
                    <service.icon className="h-10 w-10 sm:h-12 sm:w-12 text-gold mx-auto mb-3 sm:mb-4" />
                    <h3 className="font-semibold text-navy text-sm sm:text-base">{service.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-gradient-to-r from-gold via-gold/90 to-gold/80 text-navy rounded-lg p-6 sm:p-8 text-center shadow-gold relative overflow-hidden mx-4 sm:mx-0">
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-50"></div>
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-heading font-bold mb-3 sm:mb-4">
                  October Special: Save Up to $500
                </h3>
                <p className="text-base sm:text-lg font-semibold mb-4">
                  Free Stair Repair ($350 value) + Premium Traffic-Grade Sealant Upgrade ($150 value)
                </p>
                <p className="text-sm opacity-90">
                  When you book before October 31st. Limited to 5 projects this month.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 - Testimonials Carousel */}
        <section className="py-12 sm:py-16 lg:py-20 bg-navy text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 px-4">
                What Homeowners Like You Are Saying
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Carousel className="w-full">
                <CarouselContent>
                  {testimonials.map((testimonial, index) => (
                    <CarouselItem key={index}>
                      <Card className="bg-white/10 border-white/20 text-center p-6 sm:p-8 mx-2">
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="flex justify-center gap-1 mb-4 sm:mb-6">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-gold text-gold" />
                            ))}
                          </div>
                          <blockquote className="text-lg sm:text-xl italic mb-4 sm:mb-6">
                            "{testimonial.quote}"
                          </blockquote>
                          <p className="text-gold font-semibold text-sm sm:text-base">
                            — {testimonial.location}
                          </p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            </div>
          </div>
        </section>

        {/* Section 7 - Emotional Benefits */}
        <section className="py-12 sm:py-16 lg:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-navy mb-6 px-4">
                Here's What You'll <span className="text-gold">Gain</span> with AXO Floors
              </h2>
            </div>
            
            <div className="grid gap-4 sm:gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gold flex-shrink-0 mt-0.5 sm:mt-1" />
                  <p className="text-base sm:text-lg text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 8 - Enhanced Guarantee + Scarcity */}
        <section className="py-12 sm:py-16 lg:py-20 bg-navy text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center mb-6 sm:mb-8">
                <div className="bg-gold rounded-full p-4 mr-4">
                  <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-navy" />
                </div>
                <div className="bg-gold/20 border border-gold rounded-lg px-6 py-3">
                  <div className="text-gold font-bold text-lg">10-YEAR WARRANTY</div>
                  <div className="text-xs text-gold/80">Peace of Mind for a Full Decade</div>
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 sm:mb-8 px-4">
                Protected by Our <span className="text-gold">10-Year AXO Warranty</span>
              </h2>
              
              <p className="text-lg sm:text-xl mb-8 sm:mb-12 px-4">
                If your finish peels or fails due to application within 10 years, we'll fix it. Period.
                No questions. No hassles. Complete peace of mind for a full decade.
              </p>
              
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 mx-4 sm:mx-0">
                <p className="text-base sm:text-lg font-semibold">
                  ⚠️ We take on only 5 projects per week to maintain premium standards. 
                  <span className="text-gold block sm:inline"> October is almost full.</span>
                </p>
              </div>
              
              <Button size="lg" className="bg-gold text-navy hover:bg-gold/90 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto" asChild>
                <Link to="/contact">
                  Reserve Your October Spot
                  <Calendar className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 9 - Final CTA */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-gold to-gold/80 text-navy">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4 sm:mb-6 px-4">
                Your Home Deserves to Shine Before the Holidays
              </h2>
              
              <p className="text-lg sm:text-xl mb-8 sm:mb-12 px-4">
                Each week you wait means fewer dates available — and another season of excuses. 
                Let's change that today.
              </p>
              
              <div className="flex flex-col gap-4 justify-center max-w-md mx-auto sm:max-w-none sm:flex-row">
                <Button size="lg" className="bg-navy text-white hover:bg-navy/90 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto" asChild>
                <Link to="/contact">
                  Book Your Spot Today
                  <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
                </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-navy text-navy hover:bg-navy hover:text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 w-full sm:w-auto"
                  asChild
                >
                  <a href="tel:+1-555-AXO-FLOOR">
                    <Phone className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Call Us Now
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Sticky CTA Button for Mobile */}
      {showStickyButton && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <Button 
            size="lg" 
            className="w-full bg-gold text-navy hover:bg-gold/90 text-lg font-bold py-4 shadow-2xl border-2 border-navy/20" 
            asChild
          >
            <Link to="/contact">
              Book My Free Estimate
              <Phone className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </>
  );
};

export default Campaign;