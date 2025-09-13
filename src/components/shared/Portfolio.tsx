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
    <section className="py-20 bg-grey-light">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
            Take a Look at <span className="text-gradient-gold">Some of Our Work</span>
          </h2>
          <p className="text-lg text-grey max-w-3xl mx-auto leading-relaxed">
            Every project tells a story of transformation. See how we've helped homeowners across New Jersey create beautiful, lasting floors.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "gold-gradient" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden hover:shadow-gold transition-smooth">
              <div className="relative overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-smooth"
                />
                <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-navy">
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gold font-medium bg-gold/10 px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-grey">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <Button asChild className="gold-gradient hover:scale-105 transition-bounce">
            <Link to="/gallery" className="flex items-center gap-2">
              View Complete Gallery
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;