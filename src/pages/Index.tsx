import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import Portfolio from "@/components/shared/Portfolio";
import ServiceArea from "@/components/shared/ServiceArea";
import AboutSection from "@/components/shared/AboutSection";
import ContactSection from "@/components/shared/ContactSection";
import ReviewsSection from "@/components/shared/ReviewsSection";
import GoogleBusinessIntegration from "@/components/shared/GoogleBusinessIntegration";
import SEOHead from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Star, ArrowRight, Award, Users, Clock, Shield, Sparkles } from "lucide-react";
import homeHero from "@/assets/home-hero.jpg";
const Index = () => {
  const services = [{
    title: "Hardwood Flooring",
    description: "Premium hardwood installation with expert craftsmanship and attention to detail.",
    href: "/hardwood-flooring",
    features: ["Premium Materials", "Expert Installation", "Lifetime Warranty"],
    icon: "🌳"
  }, {
    title: "Sanding & Refinishing",
    description: "Restore your floors to their original beauty with professional refinishing services.",
    href: "/sanding-and-refinish",
    features: ["Complete Restoration", "Dust-Free Process", "Quick Turnaround"],
    icon: "✨"
  }, {
    title: "Vinyl Plank Flooring",
    description: "Waterproof and durable luxury vinyl with the look of real hardwood.",
    href: "/vinyl-plank-flooring",
    features: ["100% Waterproof", "Easy Maintenance", "Realistic Wood Look"],
    icon: "💧"
  }, {
    title: "Staircase Renovation",
    description: "Transform your staircase with custom hardwood steps and elegant railings.",
    href: "/staircase",
    features: ["Custom Design", "Safety First", "Premium Materials"],
    icon: "🪜"
  }];
  const benefits = [{
    icon: Users,
    title: "Expert Craftsmen",
    description: "Professional installation team with years of experience",
    stat: "10+ Years"
  }, {
    icon: Clock,
    title: "Quick Turnaround",
    description: "Efficient project completion without compromising quality",
    stat: "On Time"
  }, {
    icon: Shield,
    title: "Quality Guarantee",
    description: "100% satisfaction guarantee on all our work",
    stat: "100%"
  }];
  const testimonials = [{
    name: "Michelle Allen",
    text: "Outstanding experience overall! The workmanship was superb, we highly recommend AXO Floors to everyone!",
    rating: 5,
    location: "Ocean County, NJ"
  }, {
    name: "Richard Davis",
    text: "We hired AXO Floors and they did amazing work! It was done fast, we had all the work completed. We would highly recommend to anyone! Thank you once again!",
    rating: 5,
    location: "Monmouth County, NJ"
  }, {
    name: "David Nakano",
    text: "Professional and quality work! They transformed our home and we couldn't be happier with the results.",
    rating: 5,
    location: "Middlesex County, NJ"
  }];
  return <div className="min-h-screen">
      <SEOHead title="AXO Floors NJ - #1 Hardwood Flooring Experts in New Jersey" description="Transform your home with AXO Floors NJ. Expert hardwood installation, refinishing & restoration. 4.9★ rating, licensed & insured. Free estimates - Call (732) 351-8653" keywords="hardwood flooring NJ, floor refinishing New Jersey, flooring installation Newark, wood floor restoration Jersey City, AXO Floors, professional flooring contractors" />
      <Header />
      
      {/* Enhanced Hero Section */}
      <Hero title="Your Flooring deserves the attention that only us can provide!" subtitle="Premium Flooring Solutions in New Jersey" description="Over time, flooring often fades and becomes damaged. However, with expert care and the right team by your side, this won't be a problem anymore." image={homeHero} showReviews={true} />

      {/* Services Section - Mobile-First Enhanced */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-grey-light/30 to-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gold rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-navy rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gold/10 to-gold/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 mb-4 sm:mb-6 border border-gold/20 shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold animate-pulse" />
              <span className="text-gold font-medium text-sm sm:text-base">Premium Services</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
              We have all the solutions you need to <span className="text-gradient-gold">renew your space!</span>
            </h2>
            <p className="text-base sm:text-lg text-grey max-w-3xl mx-auto leading-relaxed px-2">
              We offer a wide range of services, from installation to finishing touches, guaranteeing that you achieve the modern, sophisticated, and elegant aesthetics you desire for your home.
            </p>
          </div>

          <div className="relative">
            {/* Enhanced grid container with glass morphism effect */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/50 shadow-2xl">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {services.map((service, index) => <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2 border-0 shadow-elegant">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{service.icon}</div>
                  <h3 className="text-lg sm:text-xl font-heading font-semibold text-navy mb-2 sm:mb-3 group-hover:text-gold transition-smooth">
                    {service.title}
                  </h3>
                  <p className="text-grey mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                    {service.description}
                  </p>
                  <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                    {service.features.map((feature, i) => <div key={i} className="flex items-center justify-center gap-2 text-xs sm:text-sm text-grey">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                        {feature}
                      </div>)}
                  </div>
                  <Button asChild variant="outline" className="w-full group-hover:bg-gold group-hover:text-white group-hover:border-gold transition-smooth min-h-[44px] text-sm sm:text-base">
                    <Link to={service.href} className="flex items-center justify-center gap-2">
                      Learn More
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                  </Button>
                </CardContent>
               </Card>)}
             </div>
           </div>
         </div>
        </div>
      </section>

      {/* Benefits Section - Mobile-First Enhanced */}
      <section className="py-12 sm:py-16 lg:py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
              Why Choose <span className="text-gradient-gold">AXO Floors?</span>
            </h2>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group text-center hover:shadow-gold transition-all duration-300 border-0 shadow-elegant hover:-translate-y-2 bg-gradient-to-br from-white to-grey-light/20">
                <CardContent className="p-8 sm:p-10 relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gold/10 to-gold/20 rounded-2xl mb-6 group-hover:bg-gradient-to-br group-hover:from-gold group-hover:to-gold/80 group-hover:scale-110 transition-all duration-300 shadow-lg">
                      <benefit.icon className="w-8 h-8 sm:w-10 sm:h-10 text-gold group-hover:text-white transition-colors duration-300" />
                    </div>
                    
                    <div className="text-2xl sm:text-3xl font-bold font-heading text-gold mb-3 group-hover:scale-105 transition-transform duration-300">
                      {benefit.stat}
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-heading font-semibold text-navy mb-4 group-hover:text-gold transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    
                    <p className="text-grey leading-relaxed text-base sm:text-lg group-hover:text-navy/80 transition-colors duration-300">
                      {benefit.description}
                    </p>
                  </div>
                  
                  {/* Subtle border animation */}
                  <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-gold/20 transition-all duration-300"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <Portfolio />

      {/* Reviews Section - New SEO-Optimized Component */}
      <ReviewsSection />

      {/* Google Business Integration */}
      <section className="py-12 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-heading text-navy mb-4">
              Find Us on Google Business
            </h2>
            <p className="text-lg text-grey max-w-2xl mx-auto">
              See our location, reviews, and business hours. Get directions and leave your review!
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <GoogleBusinessIntegration />
          </div>
        </div>
      </section>

      {/* Testimonials Section - Mobile-First Enhanced */}
      <section className="py-12 sm:py-16 lg:py-20 navy-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-1 mb-3 sm:mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 fill-gold text-gold" />)}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 sm:mb-6 px-2">
              See What Our <span className="text-gold">Customers</span> Are Saying
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto px-2">
              Don't just take our word for it - hear from satisfied homeowners across New Jersey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-1 mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-gold text-gold" />)}
                  </div>
                  <p className="text-white/90 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base lg:text-lg">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="text-gold font-semibold text-base sm:text-lg">
                      {testimonial.name}
                    </p>
                    <p className="text-white/60 text-xs sm:text-sm">
                      {testimonial.location}
                    </p>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Service Area Section */}
      <ServiceArea />

      {/* About Section */}
      <AboutSection />

      {/* Contact Form Section */}
      <ContactSection />

      {/* Final CTA Section - Mobile-First */}
      <section className="py-12 sm:py-16 lg:py-20 gold-gradient text-navy relative overflow-hidden">
        
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 sm:mb-6 px-2">
            Ready to Transform Your Floors?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
            If you're looking for durability, quality, and comfort for your everyday life, trust AXO Floors to deliver excellence!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button asChild variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] hover:scale-105 transition-bounce font-semibold">
              <Link to="/contact" className="flex items-center justify-center gap-2">
                Get Free Quote
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button asChild className="bg-navy text-white hover:bg-navy/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] hover:scale-105 transition-bounce font-semibold">
              <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2">
                Call (732) 351-8653
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;