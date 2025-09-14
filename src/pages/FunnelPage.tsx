import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Star, Shield, TrendingUp, DollarSign, Clock, Zap, Sparkles, AlertTriangle, Phone, Mail } from "lucide-react";
import sandingHero from "@/assets/sanding-hero-new.jpg";
import step1Image from "@/assets/step1-sanding.png";

const FunnelPage = () => {
  const benefits = [
    {
      icon: Shield,
      title: "Durability",
      description: "Floors built to last—with a 10-year guarantee."
    },
    {
      icon: TrendingUp,
      title: "Increase Home Value", 
      description: "Boost property value instantly with refinished hardwood."
    },
    {
      icon: DollarSign,
      title: "Savings",
      description: "Refinish for up to 40% less than replacement."
    },
    {
      icon: CheckCircle,
      title: "Certified Safety",
      description: "Professional team, dust-free systems, spotless cleanup."
    }
  ];

  const processSteps = [
    {
      step: "Step 1: Sanding",
      description: "We remove scratches, stains, and imperfections.",
      image: step1Image
    },
    {
      step: "Step 2: Staining",
      description: "Choose the perfect shade—or keep the natural wood color.",
      image: null // Will be replaced with GIF
    },
    {
      step: "Step 3: Finishing",
      description: "Protected with 3 coats of premium finish for long-lasting shine.",
      image: null // Will be replaced with GIF
    }
  ];

  const testimonials = [
    {
      text: "We thought we'd have to spend $10,000 replacing the floors. Axo Floors refinished them for half the price and finished in just 4 days.",
      author: "Maria S., Long Branch NJ",
      rating: 5
    },
    {
      text: "The team was professional, fast, and the results blew us away. Our house looks brand new.",
      author: "David R., Princeton NJ", 
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "Is refinishing cheaper than replacing?",
      answer: "Yes. Refinishing saves up to 40% compared to full replacement."
    },
    {
      question: "How long does it take?",
      answer: "Most NJ projects finish in 3–5 days."
    },
    {
      question: "Will it last?",
      answer: "Yes. All floors are covered by a 10-year guarantee."
    },
    {
      question: "What about dust & mess?",
      answer: "We use dust-free sanding systems and leave your home spotless."
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading mb-4 sm:mb-6 leading-tight px-2">
              Tired of your worn-out floors? Don't waste thousands replacing them.
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 leading-relaxed px-2">
              Refinish your hardwood floors in 48 hours, save up to 40% vs replacement, and enjoy a 10-year guarantee—trusted by New Jersey homeowners.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px] text-black">
                <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                  Get Free Estimate in 24h
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-white text-black bg-white hover:bg-white hover:text-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px]">
                <Link to="/gallery" className="flex items-center justify-center gap-2 text-black">
                  See Transformations
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white border-navy/10 text-center hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-6">
                    <benefit.icon className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-navy mb-4">{benefit.title}</h3>
                  <p className="text-grey text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Process Section */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4 sm:mb-6 px-4">
              Our 3-Step Process
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {processSteps.map((step, index) => (
              <Card key={index} className="bg-white/95 backdrop-blur-sm border-gold/20 text-center group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6 sm:p-8">
                  <div className="w-full h-48 sm:h-56 bg-gold/10 rounded-lg mb-4 sm:mb-6 group-hover:scale-105 transition-bounce overflow-hidden">
                    {step.image ? (
                      <img src={step.image} alt={step.step} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full bg-gold/20 rounded-lg flex items-center justify-center">
                        <span className="text-gold font-bold text-2xl">{index + 1}</span>
                      </div>
                    )}
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
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 h-auto min-h-[48px] text-black">
              <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                Get My Free Estimate
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. Social Proof Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-4">
              What New Jersey Homeowners Are Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-navy/10 hover:shadow-gold transition-smooth">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-grey mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <p className="text-navy font-semibold">
                    – {testimonial.author}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center px-4">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto min-h-[48px] text-black">
              <Link to="/gallery" className="flex items-center justify-center gap-2 text-black">
                See More Transformations
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Before & After Section */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white mb-4 sm:mb-6 px-4">
              From Scratched & Dull → To Stunning Hardwood
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gold font-semibold">Same floors. Different result.</p>
          </div>

          <div className="text-center px-4">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-6 h-auto min-h-[48px] text-black">
              <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                Book Your Free Estimate Today
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
              Still wondering if refinishing is right for you?
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
              September Schedule 90% Full
            </h2>
          </div>
          
          <p className="text-base sm:text-lg text-grey mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Hardwood refinishing projects in New Jersey book fast. We only take a limited number of homes per month to guarantee top quality. Don't wait until next season.
          </p>

          <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black hover:scale-105 transition-bounce text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 h-auto min-h-[48px] font-bold">
            <Link to="/contact" className="flex items-center justify-center gap-2">
              Reserve My Spot Now
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 8. Footer Guarantee */}
      <section className="py-16 navy-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading mb-4 sm:mb-6">
            Your floors. Our guarantee.
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Family-owned, New Jersey trusted. Every floor comes with a 10-year guarantee. If you're not happy, we're not done.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <a href="tel:(732) 351-8653" className="flex items-center gap-2 text-white hover:text-gold transition-smooth text-base sm:text-lg">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>(732) 351-8653</span>
            </a>
            <a href="mailto:info@axofloors.com" className="flex items-center gap-2 text-white hover:text-gold transition-smooth text-base sm:text-lg">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>info@axofloors.com</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FunnelPage;