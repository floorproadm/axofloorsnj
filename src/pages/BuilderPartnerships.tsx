import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Star, Shield, Clock, Zap, Users, Target, AlertTriangle, Phone, Mail } from "lucide-react";
import sandingHero from "@/assets/sanding-hero-new.jpg";
import { FileText, Calculator, Wrench, Handshake } from "lucide-react";
import beforeAfterImage from "@/assets/before-after-comparison.png";
import beforeAfterImage2 from "@/assets/before-after-2.png";

const BuilderPartnerships = () => {
  const benefits = [
    {
      icon: Clock,
      title: "On-Time Execution",
      description: "Crews that show up, finish on time, and keep your schedule intact."
    },
    {
      icon: Users,
      title: "Scalable Workforce", 
      description: "Multiple projects handled in parallel, no compromise in quality."
    },
    {
      icon: Shield,
      title: "Stress-Free Coordination",
      description: "Clear communication, organized processes, professional teams."
    },
    {
      icon: Target,
      title: "Buyer-Ready Finish",
      description: "Floors that impress your buyers and increase perceived value."
    }
  ];

  const processSteps = [
    {
      step: "Step 1: Briefing & Scope",
      description: "Fast understanding of project needs.",
      icon: FileText
    },
    {
      step: "Step 2: Quote in 24h",
      description: "Clear numbers, no hidden costs.",
      icon: Calculator
    },
    {
      step: "Step 3: Execution on Schedule",
      description: "Organized crews, clean job sites.",
      icon: Wrench
    },
    {
      step: "Step 4: Post-Project Support",
      description: "Touch-ups and maintenance guidance.",
      icon: Handshake
    }
  ];

  const testimonials = [
    {
      text: "AXO Floors installed 7,200 sq.ft. of hardwood in just 6 days — with zero delays and zero callbacks. That builder has since partnered with us on 5 more projects.",
      author: "Mike T., General Contractor",
      rating: 5,
      avatar: "👷‍♂️"
    }
  ];

  const faqs = [
    {
      question: "Can AXO handle multiple projects at once?",
      answer: "Yes. Dedicated crews, proven systems."
    },
    {
      question: "Do you guarantee timelines?",
      answer: "Yes. We commit to schedules in writing."
    },
    {
      question: "What types of projects?",
      answer: "Single homes, multi-unit, commercial spaces."
    },
    {
      question: "Do you work with recurring partners?",
      answer: "Absolutely. 80% of our work is ongoing builder partnerships."
    },
    {
      question: "Do you handle site coordination with other trades?",
      answer: "Yes. We adapt to builder schedules and coordinate seamlessly with other crews."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* 1. Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={sandingHero} 
            alt="AXO Floors Premium Service" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-heading mb-6 sm:mb-8 leading-tight px-2" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8), 0 0 15px rgba(255,215,0,0.4)' }}>
              Flooring Partner for Builders Who Can't Afford Delays
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/95 mb-8 sm:mb-10 leading-relaxed px-2 font-medium" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
              We help contractors and developers hit deadlines and hand over projects with premium flooring that boosts client satisfaction and resale value.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 sm:px-0">
              <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
                <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                  Request a Partnership Call
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white text-black bg-white hover:bg-white hover:text-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold">
                <Link to="/gallery" className="flex items-center justify-center gap-2 text-black">
                  See Our Work
                </Link>
              </Button>
            </div>
            
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/95 mt-6 leading-relaxed px-2 font-normal" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
              Trusted by builders and contractors across NJ, NY, and PA.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Why Builders Choose AXO Floors */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-4">
              Why Builders Choose AXO Floors
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white border-2 border-gold/20 text-center hover:shadow-2xl hover:shadow-gold/30 transition-all duration-300 hover:-translate-y-3 hover:border-gold/50 group">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gold to-gold/80 rounded-full mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <benefit.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-navy mb-4 group-hover:text-gold transition-colors duration-300">{benefit.title}</h3>
                  <p className="text-grey text-sm leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Our 4-Step Partnership Process */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4 sm:mb-6 px-4">
              How We Keep Your Projects on Track
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {processSteps.map((step, index) => (
              <Card key={index} className="bg-white/95 backdrop-blur-sm border-gold/20 text-center group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6 sm:p-8">
                  <div className="w-full h-48 sm:h-56 bg-gold/10 rounded-lg mb-4 sm:mb-6 group-hover:scale-105 transition-bounce overflow-hidden border border-gold/20 flex items-center justify-center">
                    <step.icon className="w-16 h-16 text-gold" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-bold text-navy mb-3 sm:mb-4">
                    {step.step}
                  </h3>
                  <p className="text-grey leading-relaxed text-base sm:text-lg">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center px-4">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
              <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                Let's Build Together
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Case Study / Proof */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-4">
              Partnership in Action
            </h2>
          </div>

          {/* Testimonial */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white border-navy/10 hover:shadow-gold transition-smooth">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-grey text-xl leading-relaxed mb-6">
                  "{testimonials[0].text}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-xl">
                    {testimonials[0].avatar}
                  </div>
                  <p className="text-navy font-semibold text-lg">
                    – {testimonials[0].author}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Before & After Section */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading text-white mb-4 sm:mb-6 px-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(255,215,0,0.3)' }}>
              From Slab to Showcase Floors
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gold font-semibold">On time. On budget. Every time.</p>
          </div>

          {/* Before/After Gallery */}
          <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <img 
                  src={beforeAfterImage} 
                  alt="Before and After Floor Installation Transformation 1" 
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
              <div className="space-y-4">
                <img 
                  src={beforeAfterImage2} 
                  alt="Before and After Floor Installation Transformation 2" 
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>

          <div className="text-center px-4 flex justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
              <Link to="/gallery" className="flex items-center justify-center gap-2 text-black">
                See More Projects
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-4">
              Still Wondering if AXO is the Right Partner?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white border-navy/10">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-heading font-semibold text-navy mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-grey flex items-start gap-2 text-sm sm:text-base">
                    <span className="text-gold text-lg sm:text-xl">👉</span>
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Urgency Section */}
      <section className="py-20 bg-red-50 border-t-4 border-red-500">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy">
              Now Accepting New Builder Partnerships for Q4
            </h2>
          </div>
          
          <p className="text-base sm:text-lg text-grey mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            We limit active builder partnerships each quarter to guarantee quality. Only a few new spots available this season.
          </p>

          <div className="px-4">
            <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold max-w-md mx-auto">
              <Link to="/contact" className="flex items-center justify-center gap-2 text-center">
                <span className="block sm:hidden">Let's Build Together</span>
                <span className="hidden sm:block">Let's Build Together</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BuilderPartnerships;