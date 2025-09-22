import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Users, Clock } from "lucide-react";

const AboutSection = () => {
  const stats = [
    { icon: Award, number: "500+", label: "Projects Completed" },
    { icon: Users, number: "35+", label: "Google Reviews" },
    { icon: Clock, number: "10+", label: "Years Experience" }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual - Show first on mobile, second on desktop */}
          <div className="relative order-1 lg:order-2">
            <Card className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-navy to-navy/80 flex items-center justify-center relative">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="grid grid-cols-8 h-full">
                      {[...Array(64)].map((_, i) => (
                        <div key={i} className="border border-white/20" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Logo placeholder */}
                  <div className="relative z-10 text-center">
                    <div className="text-6xl font-heading font-bold text-white mb-4">
                      •AXO•
                    </div>
                    <div className="text-2xl font-medium text-gold tracking-wider">
                      FLOORS
                    </div>
                    <p className="text-white/70 mt-4 text-sm">
                      we bring your vision to life
                    </p>
                  </div>

                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content - Show second on mobile, first on desktop */}
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              About <span className="text-gradient-gold">AXO Floors</span>
            </h2>
            <p className="text-lg text-grey mb-6 leading-relaxed">
              AXO FLOORS is a hardwood and flooring company located in 
              New Jersey that offers professional installation services for 
              residential and commercial properties. We specialize in hardwood, 
              luxury vinyl, laminate, and tile flooring, providing high-quality 
              craftsmanship and exceptional customer service every step of the way.
            </p>
            <p className="text-lg text-grey mb-8 leading-relaxed">
              When you choose us, you are choosing a company that 
              understands the importance of quality work and 
              exceptional customer service.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gold/10 rounded-full mb-3">
                    <stat.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="text-2xl font-bold font-heading text-navy">{stat.number}</div>
                  <div className="text-sm text-grey">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center md:justify-start">
              <Button asChild className="gold-gradient hover:scale-105 transition-bounce w-full md:w-auto">
                <Link to="/contact" className="flex items-center justify-center gap-2">
                  Learn More About Us
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;