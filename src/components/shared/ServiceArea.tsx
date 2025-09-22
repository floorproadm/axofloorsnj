import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";
const ServiceArea = () => {
  const serviceAreas = ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Dover", "Hamilton", "Trenton", "Camden", "Brick", "Toms River", "Union", "Plainfield", "Bayonne"];
  
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
            Service Areas in <span className="text-gradient-gold">Tri-state</span>
          </h2>
          <p className="text-base sm:text-lg text-grey max-w-3xl mx-auto leading-relaxed px-2">
            We proudly serve homeowners throughout the Tri-state area with premium flooring solutions.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12">
          {serviceAreas.map((area, index) => (
            <Card key={index} className="text-center hover:shadow-gold transition-smooth border-0 shadow-elegant">
              <CardContent className="p-3 sm:p-4">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-navy">{area}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild className="bg-navy text-white hover:bg-navy/90 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto">
            <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              Call (732) 351-8653
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
export default ServiceArea;