import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Droplets, Shield, Zap, Heart } from "lucide-react";
import vinylHero from "@/assets/vinyl-hero.jpg";

const VinylPlankFlooring = () => {
  const benefits = [
    "100% Waterproof Protection",
    "Realistic Wood Appearance", 
    "Easy Maintenance & Cleaning",
    "Dent & Scratch Resistant",
    "Perfect for All Rooms",
    "Pet & Kid Friendly"
  ];

  const features = [
    {
      title: "Waterproof Technology",
      description: "Perfect for kitchens, bathrooms, and basements",
      icon: Droplets
    },
    {
      title: "Superior Durability",
      description: "Withstands heavy foot traffic and daily wear",
      icon: Shield
    },
    {
      title: "Quick Installation",
      description: "Faster installation with minimal disruption",
      icon: Zap
    },
    {
      title: "Comfort Underfoot",
      description: "Softer and warmer than traditional hardwood",
      icon: Heart
    }
  ];

  const roomApplications = [
    {
      room: "Kitchen",
      benefits: ["Waterproof spill protection", "Easy to clean", "Stain resistant"],
      recommendation: "Perfect choice"
    },
    {
      room: "Bathroom", 
      benefits: ["100% moisture resistant", "Anti-slip surface", "Mold resistant"],
      recommendation: "Ideal solution"
    },
    {
      room: "Basement",
      benefits: ["Moisture barrier", "Temperature stable", "Comfortable"],
      recommendation: "Best option"
    },
    {
      room: "Living Areas",
      benefits: ["Beautiful wood look", "Durable finish", "Pet friendly"],
      recommendation: "Excellent choice"
    }
  ];

  const styles = [
    "Rustic Oak - Warm & Traditional",
    "Modern Grey - Contemporary Appeal", 
    "Classic Walnut - Rich & Elegant",
    "Whitewashed Pine - Light & Airy",
    "Distressed Hickory - Farmhouse Style",
    "Natural Maple - Clean & Bright"
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <Hero
        title="Luxury Vinyl Plank Flooring"
        subtitle="Beautiful, Waterproof & Durable"
        description="Experience the perfect combination of style and functionality with our premium vinyl plank flooring. Get the look of real hardwood with superior water resistance and durability."
        image={vinylHero}
      />

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
                Why Choose <span className="text-gradient-gold">Vinyl Plank Flooring?</span>
              </h2>
              <p className="text-lg text-grey mb-8 leading-relaxed">
                Modern vinyl plank flooring offers the beauty of hardwood with advanced technology that makes it perfect for any room in your home, including areas where traditional hardwood can't go.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-grey">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gold/10 p-6 rounded-lg mb-8">
                <h3 className="font-heading font-semibold text-navy mb-2">Perfect for Every Lifestyle</h3>
                <p className="text-grey">Whether you have pets, kids, or just want beautiful floors that can handle anything life throws at them, vinyl plank is the perfect solution.</p>
              </div>

              <Button asChild className="gold-gradient hover:scale-105 transition-bounce">
                <Link to="/contact" className="flex items-center gap-2">
                  Explore Options
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gold/10 rounded-full mb-4 group-hover:bg-gold group-hover:scale-110 transition-bounce">
                      <feature.icon className="w-6 h-6 text-gold group-hover:text-white" />
                    </div>
                    <h3 className="font-heading font-semibold text-navy mb-2 group-hover:text-gold transition-smooth">
                      {feature.title}
                    </h3>
                    <p className="text-grey text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Room Applications */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Perfect for Every Room
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Unlike traditional hardwood, vinyl plank flooring can be installed anywhere in your home, including moisture-prone areas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roomApplications.map((app, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-heading font-semibold text-navy group-hover:text-gold transition-smooth">
                      {app.room}
                    </h3>
                    <span className="text-xs bg-gold text-navy px-2 py-1 rounded-full font-medium">
                      {app.recommendation}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {app.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-grey">
                        <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Styles Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Popular Style Options
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Choose from a wide variety of wood-look styles and textures to match your home's aesthetic perfectly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {styles.map((style, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-grey-light rounded-lg hover:bg-gold/10 transition-smooth">
                <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="font-medium text-navy">{style}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-grey mb-6">Want to see samples? We bring options to you!</p>
            <Button asChild variant="outline" className="hover:bg-gold hover:text-navy hover:border-gold">
              <Link to="/contact">Schedule In-Home Consultation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 navy-gradient text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              Vinyl vs. Traditional Hardwood
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-heading font-semibold text-gold mb-4">Luxury Vinyl Plank</h3>
              <div className="space-y-4">
                {[
                  "100% waterproof",
                  "Can be installed anywhere",
                  "Scratch & dent resistant", 
                  "Easy maintenance",
                  "Pet & kid friendly",
                  "Lower cost installation"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-heading font-semibold text-white/60 mb-4">Traditional Hardwood</h3>
              <div className="space-y-4">
                {[
                  "Water sensitive",
                  "Limited room placement",
                  "Scratches & dents easily",
                  "Requires regular maintenance",
                  "Shows pet damage",
                  "Higher installation cost"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-white/60">
                    <div className="w-5 h-5 border border-white/30 rounded-full"></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
            Ready for Worry-Free Floors?
          </h2>
          <p className="text-lg text-grey mb-8 max-w-2xl mx-auto">
            Experience the beauty of hardwood without the limitations. Contact us today to explore our vinyl plank options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
              <Link to="/contact" className="flex items-center gap-2">
                Get Free Quote
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold">
              <a href="tel:(732) 351-8653">Call (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VinylPlankFlooring;