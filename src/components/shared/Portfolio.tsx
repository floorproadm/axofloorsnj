import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Eye } from "lucide-react";
import sandingHero from "@/assets/sanding-hero.jpg";
const portfolioItems = [{
  id: 1,
  title: "Modern Hardwood Installation",
  category: "Hardwood",
  image: "/api/placeholder/400/300",
  description: "Premium oak flooring installation in contemporary home"
}, {
  id: 2,
  title: "Luxury Vinyl Transformation",
  category: "Vinyl",
  image: "/api/placeholder/400/300",
  description: "Waterproof luxury vinyl plank installation"
}, {
  id: 3,
  title: "Staircase Renovation",
  category: "Staircase",
  image: "/api/placeholder/400/300",
  description: "Complete staircase refinishing with custom railings"
}, {
  id: 4,
  title: "Floor Refinishing Project",
  category: "Refinishing",
  image: "/api/placeholder/400/300",
  description: "Complete hardwood floor restoration and refinishing"
}, {
  id: 5,
  title: "Commercial Flooring",
  category: "Commercial",
  image: "/api/placeholder/400/300",
  description: "Large-scale commercial flooring installation"
}, {
  id: 6,
  title: "Base Board Installation",
  category: "Baseboards",
  image: "/api/placeholder/400/300",
  description: "Custom baseboard and trim installation"
}];
const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Hardwood", "Vinyl", "Staircase", "Refinishing", "Commercial", "Baseboards"];
  const filteredItems = selectedCategory === "All" ? portfolioItems : portfolioItems.filter(item => item.category === selectedCategory);
  return <section className="relative bg-grey-light overflow-hidden">
      {/* Hero Image with Overlay */}
      <div className="relative h-[60vh] md:h-[70vh] bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url(${sandingHero})`
      }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/60" />
        
        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="container mx-auto px-4 text-center text-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6">
                Take a Look at <span className="text-accent">Some of Our Work</span>
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
                Every project tells a story of transformation. See how we've helped homeowners across New Jersey create beautiful, lasting floors.
              </p>
              
              {/* Professional Badge */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Professional Craftsmen at Work</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">

        {/* Category Filters - Mobile Horizontal Scroll */}
        <div className="mb-8 sm:mb-12">
          
        </div>

        {/* Portfolio Grid - Mobile First */}
        

          {/* View More Button */}
          <div className="text-center px-4 sm:px-0">
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 transition-all duration-300 min-h-[48px] px-6 sm:px-8">
              <Link to="/gallery" className="flex items-center justify-center gap-2 text-sm sm:text-base">
                View Complete Gallery
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>;
};
export default Portfolio;