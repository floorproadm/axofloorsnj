import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { AppSidebar } from "@/components/shared/AppSidebar";
import Hero from "@/components/shared/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Star, ArrowRight, Zap, Shield, Award } from "lucide-react";
import hardwoodHero from "@/assets/hardwood-hero.jpg";

const HardwoodFlooring = () => {
  const benefits = [
    "Premium Hardwood Species Selection",
    "Professional Installation Guaranteed", 
    "Lifetime Structural Warranty",
    "Increases Home Value by 10-15%",
    "Custom Staining & Finishing Options",
    "Dust-Free Installation Process"
  ];

  const woodTypes = [
    {
      name: "Oak Flooring",
      description: "Classic, durable, and versatile with beautiful grain patterns",
      features: ["Extremely Durable", "Stains Beautifully", "Timeless Appeal"]
    },
    {
      name: "Maple Flooring", 
      description: "Light, consistent grain perfect for modern and traditional homes",
      features: ["Light & Bright", "Consistent Grain", "Hard & Durable"]
    },
    {
      name: "Walnut Flooring",
      description: "Rich, dark chocolate tones for luxury and sophistication", 
      features: ["Rich Dark Tones", "Luxury Appeal", "Premium Grade"]
    }
  ];

  const process = [
    { step: "1", title: "Free Consultation", description: "We assess your space and provide detailed recommendations" },
    { step: "2", title: "Material Selection", description: "Choose from our premium hardwood species and finishes" },
    { step: "3", title: "Professional Installation", description: "Expert installation with precision and attention to detail" },
    { step: "4", title: "Final Inspection", description: "Quality check and walkthrough to ensure perfection" }
  ];

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <Header />
      
      <Hero
        title="Premium Hardwood Flooring Installation"
        subtitle="Transform Your Home with Timeless Beauty"
        description="Discover the lasting elegance of premium hardwood floors. Our expert installation ensures your investment will enhance your home's beauty and value for generations to come."
        image={hardwoodHero}
      />

      {/* Benefits Section */}
      <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2 sm:px-0">
              Why Choose Our <span className="text-gradient-gold">Hardwood Flooring?</span>
            </h2>
            <p className="text-base sm:text-lg text-grey mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
              Our premium hardwood flooring combines traditional craftsmanship with modern installation techniques to deliver floors that will last a lifetime.
            </p>
            
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gold flex-shrink-0 mt-0.5" />
                  <span className="text-grey text-sm sm:text-base leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="px-2 sm:px-0">
              <Button asChild className="gold-gradient hover:scale-105 transition-bounce w-full sm:w-auto min-h-[48px]">
                <Link to="/contact" className="flex items-center justify-center gap-2">
                  Get Free Quote
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 mt-8 lg:mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-grey-light rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-navy text-base sm:text-lg">Premium Quality Materials</h3>
                <p className="text-grey text-sm leading-relaxed">Only the finest hardwood species from trusted suppliers</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-grey-light rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-navy text-base sm:text-lg">Lifetime Warranty</h3>
                <p className="text-grey text-sm leading-relaxed">Comprehensive warranty on installation and materials</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-grey-light rounded-lg">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-navy text-base sm:text-lg">Expert Installation</h3>
                <p className="text-grey text-sm leading-relaxed">Professional team with years of experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Wood Types Section */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Premium Hardwood Species
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Choose from our carefully selected hardwood species, each offering unique characteristics and beauty to match your style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {woodTypes.map((wood, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-semibold text-navy mb-3 group-hover:text-gold transition-smooth">
                    {wood.name}
                  </h3>
                  <p className="text-grey mb-4 leading-relaxed">
                    {wood.description}
                  </p>
                  <ul className="space-y-2">
                    {wood.features.map((feature, i) => (
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

      {/* Process Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Our Installation Process
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              From consultation to completion, we ensure every step meets our high standards of quality and professionalism.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 gold-gradient rounded-full mb-4 text-navy font-bold text-xl group-hover:scale-110 transition-bounce">
                  {item.step}
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-grey leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 navy-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
            Ready for Beautiful Hardwood Floors?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Contact us today for a free consultation and quote. Let's transform your home with premium hardwood flooring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                Get Free Quote
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-6 h-auto">
              <a href="tel:(732) 351-8653">Call (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HardwoodFlooring;