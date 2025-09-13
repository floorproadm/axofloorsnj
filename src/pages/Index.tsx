import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import Portfolio from "@/components/shared/Portfolio";
import ServiceArea from "@/components/shared/ServiceArea";
import AboutSection from "@/components/shared/AboutSection";
import ContactSection from "@/components/shared/ContactSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Star, ArrowRight, Award, Users, Clock, Shield, Sparkles } from "lucide-react";
import homeHero from "@/assets/home-hero.jpg";

const Index = () => {
  const services = [
    {
      title: "Hardwood Flooring",
      description: "Premium hardwood installation with expert craftsmanship and attention to detail.",
      href: "/hardwood-flooring",
      features: ["Premium Materials", "Expert Installation", "Lifetime Warranty"],
      icon: "🌳"
    },
    {
      title: "Sanding & Refinishing", 
      description: "Restore your floors to their original beauty with professional refinishing services.",
      href: "/sanding-and-refinish",
      features: ["Complete Restoration", "Dust-Free Process", "Quick Turnaround"],
      icon: "✨"
    },
    {
      title: "Vinyl Plank Flooring",
      description: "Waterproof and durable luxury vinyl with the look of real hardwood.",
      href: "/vinyl-plank-flooring", 
      features: ["100% Waterproof", "Easy Maintenance", "Realistic Wood Look"],
      icon: "💧"
    },
    {
      title: "Staircase Renovation",
      description: "Transform your staircase with custom hardwood steps and elegant railings.",
      href: "/staircase",
      features: ["Custom Design", "Safety First", "Premium Materials"],
      icon: "🪜"
    }
  ];

  const benefits = [
    { 
      icon: Award, 
      title: "35+ Google Reviews", 
      description: "Consistent 5-star quality from satisfied customers",
      stat: "⭐⭐⭐⭐⭐"
    },
    { 
      icon: Users, 
      title: "Expert Craftsmen", 
      description: "Professional installation team with years of experience",
      stat: "10+ Years"
    },
    { 
      icon: Clock, 
      title: "Quick Turnaround", 
      description: "Efficient project completion without compromising quality",
      stat: "On Time"
    },
    { 
      icon: Shield, 
      title: "Quality Guarantee", 
      description: "100% satisfaction guarantee on all our work",
      stat: "100%"
    }
  ];

  const testimonials = [
    {
      name: "Michelle Allen",
      text: "Outstanding experience overall! The workmanship was superb, we highly recommend AXO Floors to everyone!",
      rating: 5,
      location: "Ocean County, NJ"
    },
    {
      name: "Richard Davis", 
      text: "We hired AXO Floors and they did amazing work! It was done fast, we had all the work completed. We would highly recommend to anyone! Thank you once again!",
      rating: 5,
      location: "Monmouth County, NJ"
    },
    {
      name: "David Nakano",
      text: "Professional and quality work! They transformed our home and we couldn't be happier with the results.",
      rating: 5,
      location: "Middlesex County, NJ"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Enhanced Hero Section */}
      <Hero
        title="Your Flooring deserves the attention that only us can provide!"
        subtitle="Premium Flooring Solutions in New Jersey"
        description="Over time, flooring often fades and becomes damaged. However, with expert care and the right team by your side, this won't be a problem anymore."
        image={homeHero}
        showReviews={true}
      />

      {/* Services Section - Mobile-First Enhanced */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background relative overflow-hidden">
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 bg-gold/10 rounded-full px-4 sm:px-6 py-2 mb-4 sm:mb-6">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
              <span className="text-gold font-medium text-sm sm:text-base">Premium Services</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
              We have all the solutions you need to <span className="text-gradient-gold">renew your space!</span>
            </h2>
            <p className="text-base sm:text-lg text-grey max-w-3xl mx-auto leading-relaxed px-2">
              We offer a wide range of services, from installation to finishing touches, guaranteeing that you achieve the modern, sophisticated, and elegant aesthetics you desire for your home.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2 border-0 shadow-elegant">
                <CardContent className="p-6 sm:p-8 text-center">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{service.icon}</div>
                  <h3 className="text-lg sm:text-xl font-heading font-semibold text-navy mb-2 sm:mb-3 group-hover:text-gold transition-smooth">
                    {service.title}
                  </h3>
                  <p className="text-grey mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                    {service.description}
                  </p>
                  <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                    {service.features.map((feature, i) => (
                      <div key={i} className="flex items-center justify-center gap-2 text-xs sm:text-sm text-grey">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gold" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Button asChild variant="outline" className="w-full group-hover:bg-gold group-hover:text-white group-hover:border-gold transition-smooth min-h-[44px] text-sm sm:text-base">
                    <Link to={service.href} className="flex items-center justify-center gap-2">
                      Learn More
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
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
            <p className="text-base sm:text-lg text-grey max-w-2xl mx-auto px-2">
              Experience the difference that professional expertise and commitment to quality makes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group text-center hover:shadow-gold transition-smooth border-0 shadow-elegant">
                <CardContent className="p-6 sm:p-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gold/10 rounded-full mb-3 sm:mb-4 group-hover:bg-gold group-hover:scale-110 transition-bounce">
                    <benefit.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gold group-hover:text-white" />
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-heading text-gold mb-1 sm:mb-2">
                    {benefit.stat}
                  </div>
                  <h3 className="text-base sm:text-xl font-heading font-semibold text-navy mb-2 sm:mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-grey leading-relaxed text-sm sm:text-base">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <Portfolio />

      {/* Testimonials Section - Mobile-First Enhanced */}
      <section className="py-12 sm:py-16 lg:py-20 navy-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 h-full">
            {[...Array(64)].map((_, i) => (
              <div key={i} className="border border-white/5" />
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-1 mb-3 sm:mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 fill-gold text-gold" />
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 sm:mb-6 px-2">
              See What Our <span className="text-gold">Customers</span> Are Saying
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto px-2">
              Don't just take our word for it - hear from satisfied homeowners across New Jersey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-smooth">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-1 mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-gold text-gold" />
                    ))}
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
              </Card>
            ))}
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
            <Button asChild variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px] hover:scale-105 transition-bounce">
              <Link to="/contact" className="flex items-center justify-center gap-2">
                Get Free Quote
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <Button asChild className="bg-navy text-white hover:bg-navy/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px] hover:scale-105 transition-bounce">
              <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2">
                Call (732) 351-8653
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;