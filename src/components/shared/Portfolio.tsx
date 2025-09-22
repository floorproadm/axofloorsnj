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
  return <section className="py-12 sm:py-16 lg:py-20 bg-grey-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
            Take a Look at <span className="text-gradient-gold">Some of Our Work</span>
          </h2>
          <p className="text-base sm:text-lg text-grey max-w-3xl mx-auto leading-relaxed px-2">
            Every project tells a story of transformation. See how we've helped homeowners across New Jersey create beautiful, lasting floors.
          </p>
        </div>

        {/* Hero Image */}
        <div className="mb-12 sm:mb-16">
          <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden">
            <img src={sandingHero} alt="AXO Floors professional working on hardwood floor refinishing" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-navy/40 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">Professional Results</h3>
                <p className="text-lg">Every project, perfectly executed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 sm:mb-12">
          
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {filteredItems.map(item => <Card key={item.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="relative overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-3 right-3">
                  <span className="bg-gold text-navy px-2 py-1 text-xs font-semibold rounded">
                    {item.category}
                  </span>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-navy mb-2">{item.title}</h3>
                <p className="text-grey text-sm leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>)}
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
    </section>;
};
export default Portfolio;