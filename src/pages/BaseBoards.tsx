import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Ruler, Sparkles, Clock, Award } from "lucide-react";
import baseboardsHero from "@/assets/baseboards-hero.jpg";

const BaseBoards = () => {
  const benefits = [
    "Precision Measuring & Cutting",
    "Perfect Corner Joints & Miters", 
    "Professional Grade Materials",
    "Clean & Seamless Installation",
    "Multiple Style Options",
    "Enhanced Room Appearance"
  ];

  const services = [
    {
      title: "Baseboard Installation",
      description: "Complete baseboard installation for new construction or renovations",
      icon: Ruler,
      features: ["Precise Measurements", "Quality Materials", "Clean Installation"]
    },
    {
      title: "Baseboard Replacement",
      description: "Replace old, damaged, or outdated baseboards with new premium trim",
      icon: Sparkles,
      features: ["Damage Repair", "Style Updates", "Seamless Removal"]
    },
    {
      title: "Crown Molding & Trim",
      description: "Complete trim package including crown molding and decorative elements",
      icon: Award,
      features: ["Crown Molding", "Chair Rails", "Decorative Trim"]
    }
  ];

  const styles = [
    {
      name: "Traditional Colonial",
      height: "5.25\"",
      description: "Classic profile with elegant curves and traditional proportions",
      bestFor: "Traditional & Colonial homes"
    },
    {
      name: "Modern Flat Panel", 
      height: "4.25\"",
      description: "Clean, simple lines perfect for contemporary interiors",
      bestFor: "Modern & Minimalist spaces"
    },
    {
      name: "Craftsman Style",
      height: "6\"",
      description: "Substantial profile with clean lines and architectural detail",
      bestFor: "Craftsman & Bungalow homes"
    },
    {
      name: "Victorian Ornate",
      height: "7\"",
      description: "Decorative profile with intricate details and classic proportions",
      bestFor: "Victorian & Period homes"
    }
  ];

  const finishingDetails = [
    "Precise Miter Cuts",
    "Caulked & Sealed Joints",
    "Nail Hole Filling",
    "Professional Priming",
    "Paint-Ready Finish",
    "Complete Cleanup"
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <Hero
        title="Professional Baseboard & Trim Installation"
        subtitle="Perfect Finishing Touches for Every Room"
        description="Complete your flooring project with professionally installed baseboards and trim. Our precision installation ensures clean lines and perfect joints that enhance your home's finished appearance."
        image={baseboardsHero}
      />

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Complete Trim Solutions
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              From baseboards to crown molding, we provide comprehensive trim installation services that add the perfect finishing touch to your spaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold group-hover:scale-110 transition-bounce">
                    <service.icon className="w-8 h-8 text-gold group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-navy mb-3 group-hover:text-gold transition-smooth">
                    {service.title}
                  </h3>
                  <p className="text-grey mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-grey justify-center">
                        <CheckCircle className="w-4 h-4 text-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
                Why Professional <span className="text-gradient-gold">Installation Matters</span>
              </h2>
              <p className="text-lg text-grey mb-8 leading-relaxed">
                Baseboards and trim are the details that make the difference between a good job and a professional finish. Our craftsmen ensure every joint is perfect and every line is straight.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-grey">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="bg-background p-6 rounded-lg shadow-elegant mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-6 h-6 text-gold" />
                  <h3 className="font-heading font-semibold text-navy">Same-Day Installation</h3>
                </div>
                <p className="text-grey">Most baseboard installations completed in a single day with minimal disruption to your home.</p>
              </div>

              <Button asChild className="gold-gradient hover:scale-105 transition-bounce">
                <Link to="/contact" className="flex items-center gap-2">
                  Get Installation Quote
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-background p-6 rounded-lg text-center shadow-elegant">
                  <h3 className="text-3xl font-bold text-navy mb-2">15+</h3>
                  <p className="text-grey text-sm">Years of Experience</p>
                </div>
                <div className="bg-background p-6 rounded-lg text-center shadow-elegant">
                  <h3 className="text-3xl font-bold text-navy mb-2">100%</h3>
                  <p className="text-grey text-sm">Quality Guarantee</p>
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="bg-background p-6 rounded-lg text-center shadow-elegant">
                  <h3 className="text-3xl font-bold text-navy mb-2">500+</h3>
                  <p className="text-grey text-sm">Homes Completed</p>
                </div>
                <div className="bg-background p-6 rounded-lg text-center shadow-elegant">
                  <h3 className="text-3xl font-bold text-navy mb-2">1 Day</h3>
                  <p className="text-grey text-sm">Typical Installation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Style Options */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Baseboard Style Options
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Choose the perfect baseboard style to complement your home's architecture and interior design aesthetic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {styles.map((style, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-heading font-semibold text-navy group-hover:text-gold transition-smooth">
                      {style.name}
                    </h3>
                    <span className="text-sm bg-gold/20 text-navy px-2 py-1 rounded font-medium">
                      {style.height}
                    </span>
                  </div>
                  <p className="text-grey mb-3 text-sm leading-relaxed">
                    {style.description}
                  </p>
                  <div className="text-xs text-gold font-medium">
                    Best for: {style.bestFor}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 navy-gradient text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Our Installation Process
            </h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Every detail matters in achieving a professional finish that enhances your home's appearance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finishingDetails.map((detail, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="font-medium">{detail}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/80 mb-6">Every installation is paint-ready and includes complete cleanup</p>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-navy">
              <Link to="/gallery">View Our Work</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Value Section */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
            The Perfect Finishing Touch
          </h2>
          <p className="text-lg text-grey mb-8 max-w-3xl mx-auto">
            Professional baseboards and trim installation doesn't just look better - it protects your walls, hides expansion gaps, and adds significant value to your home.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
                <Award className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-navy mb-2">Enhanced Appearance</h3>
              <p className="text-grey">Clean lines and professional finish elevate your entire space</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-navy mb-2">Wall Protection</h3>
              <p className="text-grey">Protects walls from damage and covers expansion gaps</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-navy mb-2">Added Value</h3>
              <p className="text-grey">Quality trim work increases your home's market value</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                Get Installation Quote
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-lg px-8 py-6 h-auto">
              <a href="tel:(732) 351-8653">Call (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BaseBoards;