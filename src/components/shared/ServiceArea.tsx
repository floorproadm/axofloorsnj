import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";

const ServiceArea = () => {
  const serviceAreas = [
    "Newark", "Jersey City", "Paterson", "Elizabeth", "Edison",
    "Woodbridge", "Dover", "Hamilton", "Trenton", "Camden",
    "Brick", "Toms River", "Union", "Plainfield", "Bayonne"
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 navy-gradient text-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4 sm:mb-6 px-2 sm:px-0">
              We're active <span className="text-gold">all over NJ, NY, and PA</span>
            </h2>
            <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
              Serving homeowners and businesses across the tri-state area with premium flooring solutions. 
              No matter where you're located, our expert team is ready to transform your space.
            </p>

            {/* Service Areas Grid - Mobile First */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8 px-2 sm:px-0">
              {serviceAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gold flex-shrink-0" />
                  <span>{area}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-gold font-medium text-sm">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>+ Many More</span>
              </div>
            </div>

            <div className="px-2 sm:px-0">
              <Button className="gold-gradient hover:scale-105 transition-bounce w-full sm:w-auto min-h-[48px]">
                <Phone className="w-4 h-4 mr-2" />
                Get Started Today
              </Button>
            </div>
          </div>

          {/* Map Placeholder - Hidden on mobile, shown on larger screens */}
          <div className="relative hidden lg:block">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-white/20">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
                    <p className="text-white/70">Service Area Coverage</p>
                    <p className="text-sm text-white/50 mt-2">
                      50+ locations across tri-state area
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;