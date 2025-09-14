import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Hammer, Shield, Sparkles, TrendingUp } from "lucide-react";
import staircaseHero from "@/assets/staircase-hero.jpg";

const Staircase = () => {
  const benefits = [
    "Custom Design & Craftsmanship",
    "Premium Hardwood Materials", 
    "Safety Code Compliance",
    "Dramatic Home Transformation",
    "Increased Property Value",
    "Professional Installation"
  ];

  const services = [
    {
      title: "Complete Staircase Installation",
      description: "New staircase construction with custom design and premium materials",
      icon: Hammer,
      features: ["Custom Design", "Premium Wood Species", "Expert Installation"]
    },
    {
      title: "Staircase Renovation",
      description: "Transform existing stairs with new treads, risers, and railings",
      icon: Sparkles,
      features: ["Tread Replacement", "Railing Upgrade", "Safety Improvements"]
    },
    {
      title: "Railing & Banister Work",
      description: "Custom railings and banisters for safety and aesthetic appeal",
      icon: Shield,
      features: ["Safety Compliance", "Custom Styles", "Premium Finishes"]
    }
  ];

  const styles = [
    {
      name: "Traditional Oak",
      description: "Classic styling with rich oak treads and elegant turned balusters",
      features: ["Timeless Appeal", "Durable Construction", "Warm Finish Options"]
    },
    {
      name: "Modern Minimalist", 
      description: "Clean lines with sleek glass or metal railings for contemporary homes",
      features: ["Contemporary Design", "Open Feel", "Premium Materials"]
    },
    {
      name: "Rustic Farmhouse",
      description: "Reclaimed wood styling with wrought iron accents for character",
      features: ["Unique Character", "Mixed Materials", "Authentic Look"]
    }
  ];

  const safetyFeatures = [
    "Code-Compliant Railing Height",
    "Proper Tread Depth & Rise",
    "Non-Slip Surface Treatment",
    "Secure Handrail Installation",
    "Proper Lighting Integration",
    "Child Safety Considerations"
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <Hero
        title="Custom Staircase Design & Installation"
        subtitle="Transform Your Home's Centerpiece"
        description="Create a stunning focal point with our custom staircase design and installation services. From traditional elegance to modern sophistication, we craft staircases that are both beautiful and safe."
        image={staircaseHero}
      />

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Our Staircase Services
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Whether you need a complete new staircase or want to renovate your existing stairs, we provide comprehensive services to meet your needs.
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
                Why Choose Our <span className="text-gradient-gold">Staircase Services?</span>
              </h2>
              <p className="text-lg text-grey mb-8 leading-relaxed">
                Your staircase is more than just a way to get upstairs - it's a centerpiece that defines your home's character. We combine craftsmanship, safety, and design to create staircases that make a statement.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-grey">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button asChild className="gold-gradient hover:scale-105 transition-bounce">
                <Link to="/contact" className="flex items-center gap-2">
                  Design My Staircase
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow-elegant">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy">Increase Home Value</h3>
                  <p className="text-grey text-sm">Custom staircases can add 10-15% to your home's value</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow-elegant">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy">Safety First</h3>
                  <p className="text-grey text-sm">All work meets or exceeds local building codes</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-6 bg-background rounded-lg shadow-elegant">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy">Custom Design</h3>
                  <p className="text-grey text-sm">Tailored to match your home's unique style</p>
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
              Popular Staircase Styles
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              From traditional craftsmanship to contemporary design, we create staircases that perfectly complement your home's architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {styles.map((style, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-semibold text-navy mb-3 group-hover:text-gold transition-smooth">
                    {style.name}
                  </h3>
                  <p className="text-grey mb-4 leading-relaxed">
                    {style.description}
                  </p>
                  <ul className="space-y-2">
                    {style.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-grey">
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

      {/* Safety Section */}
      <section className="py-20 navy-gradient text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Safety & Code Compliance
            </h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">
              Beauty and safety go hand in hand. All our staircase installations meet or exceed local building codes and safety requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/80 mb-6">Every project includes a detailed safety inspection and compliance verification</p>
            <Button asChild variant="outline" className="border-white text-white hover:bg-white hover:text-navy">
              <Link to="/contact">Schedule Consultation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
            Ready to Transform Your Staircase?
          </h2>
          <p className="text-lg text-grey mb-8 max-w-2xl mx-auto">
            Let's create a stunning centerpiece for your home. Contact us today to discuss your staircase project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                Get Design Consultation
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

export default Staircase;