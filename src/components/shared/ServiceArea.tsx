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
    <section className="py-20 navy-gradient text-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              We're active <span className="text-gold">all over NJ, NY, and PA</span>
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Serving homeowners and businesses across the tri-state area with premium flooring solutions. 
              No matter where you're located, our expert team is ready to transform your space.
            </p>

            {/* Service Areas Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {serviceAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-gold font-medium">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">+ Many More</span>
              </div>
            </div>

            <Button className="gold-gradient hover:scale-105 transition-bounce">
              <Phone className="w-4 h-4 mr-2" />
              Get Started Today
            </Button>
          </div>

          {/* Map Placeholder */}
          <div className="relative">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border-2 border-dashed border-white/20">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
                    <p className="text-white/70">Interactive Service Area Map</p>
                    <p className="text-sm text-white/50 mt-2">
                      Covering 50+ locations across tri-state area
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