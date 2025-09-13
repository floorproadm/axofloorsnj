import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Eye } from "lucide-react";

const portfolioItems = [
  {
    id: 1,
    title: "Modern Hardwood Installation",
    category: "Hardwood",
    image: "/api/placeholder/400/300",
    description: "Premium oak flooring installation in contemporary home"
  },
  {
    id: 2,
    title: "Luxury Vinyl Transformation",
    category: "Vinyl",
    image: "/api/placeholder/400/300", 
    description: "Waterproof luxury vinyl plank installation"
  },
  {
    id: 3,
    title: "Staircase Renovation",
    category: "Staircase",
    image: "/api/placeholder/400/300",
    description: "Complete staircase refinishing with custom railings"
  },
  {
    id: 4,
    title: "Floor Refinishing Project",
    category: "Refinishing",
    image: "/api/placeholder/400/300",
    description: "Complete hardwood floor restoration and refinishing"
  },
  {
    id: 5,
    title: "Commercial Flooring",
    category: "Commercial",
    image: "/api/placeholder/400/300",
    description: "Large-scale commercial flooring installation"
  },
  {
    id: 6,
    title: "Base Board Installation",
    category: "Baseboards",
    image: "/api/placeholder/400/300",
    description: "Custom baseboard and trim installation"
  }
];

const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", "Hardwood", "Vinyl", "Staircase", "Refinishing", "Commercial", "Baseboards"];

  const filteredItems = selectedCategory === "All" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-grey-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
            Take a Look at <span className="text-gradient-gold">Some of Our Work</span>
          </h2>
          <p className="text-base sm:text-lg text-grey max-w-3xl mx-auto leading-relaxed px-2">
            Every project tells a story of transformation. See how we've helped homeowners across New Jersey create beautiful, lasting floors.
          </p>
        </div>

        {/* Category Filters - Mobile Horizontal Scroll */}
        <div className="mb-8 sm:mb-12">
          <div className="flex sm:flex-wrap sm:justify-center gap-2 overflow-x-auto pb-2 px-4 sm:px-0 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`${selectedCategory === category ? "gold-gradient" : ""} text-sm px-4 py-2 whitespace-nowrap flex-shrink-0 min-h-[40px]`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Portfolio Grid - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-gold transition-smooth">
              <div className="relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-48 sm:h-56 lg:h-64 object-cover group-hover:scale-110 transition-smooth"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-navy text-sm px-4 py-2">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gold font-medium bg-gold/10 px-2 sm:px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-heading font-semibold text-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-grey text-sm sm:text-base leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center px-4 sm:px-0">
          <Button asChild className="gold-gradient hover:scale-105 transition-bounce min-h-[48px] px-6 sm:px-8">
            <Link to="/gallery" className="flex items-center justify-center gap-2 text-sm sm:text-base">
              View Complete Gallery
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;