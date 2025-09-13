import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Eye } from "lucide-react";

const Gallery = () => {
  // Placeholder images - in a real implementation, these would be actual project photos
  const projects = [
    {
      id: 1,
      title: "Modern Oak Hardwood Installation",
      category: "Hardwood Flooring",
      location: "Princeton, NJ",
      description: "Complete hardwood floor installation in a contemporary home with custom staining.",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 2,
      title: "Victorian Home Floor Refinishing",
      category: "Sanding & Refinish",
      location: "Morristown, NJ",
      description: "Restored 100-year-old hardwood floors to their original beauty with custom finishing.",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 3,
      title: "Luxury Vinyl Plank Kitchen",
      category: "Vinyl Plank",
      location: "Edison, NJ",
      description: "Waterproof luxury vinyl plank installation perfect for this busy family kitchen.",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 4,
      title: "Custom Staircase Renovation",
      category: "Staircase",
      location: "Summit, NJ",
      description: "Complete staircase makeover with new oak treads and custom railings.",
      image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 5,
      title: "Craftsman Style Trim Package",
      category: "Baseboards & Trim",
      location: "Westfield, NJ",
      description: "Complete baseboard and crown molding installation in a Craftsman style home.",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 6,
      title: "Open Concept Living Space",
      category: "Hardwood Flooring",
      location: "Short Hills, NJ",
      description: "Seamless hardwood installation throughout an open concept living area.",
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 7,
      title: "Basement Luxury Vinyl Installation",
      category: "Vinyl Plank",
      location: "Millburn, NJ",
      description: "Waterproof vinyl plank flooring transformed this basement into a functional space.",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 8,
      title: "Antique Heart Pine Restoration",
      category: "Sanding & Refinish",
      location: "Madison, NJ",
      description: "Careful restoration of antique heart pine floors preserving their historic character.",
      image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    },
    {
      id: 9,
      title: "Modern Floating Staircase",
      category: "Staircase",
      location: "Chatham, NJ",
      description: "Contemporary floating staircase design with glass railings and LED lighting.",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    }
  ];

  const categories = ["All", "Hardwood Flooring", "Sanding & Refinish", "Vinyl Plank", "Staircase", "Baseboards & Trim"];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 navy-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-gold text-gold" />
              ))}
            </div>
            <span className="text-gold font-medium">35+ Google Reviews</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
            Our Project Gallery
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Explore our portfolio of completed flooring projects throughout New Jersey. See the quality craftsmanship and attention to detail that sets AXO Floors apart.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Eye className="w-5 h-5" />
            <span>Over 500 successful projects completed</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 bg-grey-light border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                className={category === "All" ? "gold-gradient" : "hover:bg-gold hover:text-navy hover:border-gold"}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Card key={project.id} className="group hover:shadow-gold transition-smooth hover:-translate-y-2 overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                  />
                  <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                    <div className="text-white text-center">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <span className="font-medium">View Project</span>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-gold text-navy px-3 py-1 rounded-full text-sm font-medium">
                      {project.category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-semibold text-navy mb-2 group-hover:text-gold transition-smooth">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gold font-medium mb-2">{project.location}</p>
                  <p className="text-grey leading-relaxed">{project.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          <div className="text-center mt-16">
            <p className="text-grey mb-6">Showing 9 of 50+ completed projects</p>
            <Button variant="outline" className="hover:bg-gold hover:text-navy hover:border-gold">
              Load More Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-8">
            What Our Customers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: "Jennifer M.",
                text: "The transformation of our hardwood floors was incredible. AXO Floors exceeded our expectations with their attention to detail.",
                rating: 5
              },
              {
                name: "Robert K.",
                text: "Professional, punctual, and the quality is outstanding. Our new staircase is the centerpiece of our home.",
                rating: 5
              },
              {
                name: "Maria L.",
                text: "From quote to completion, the process was seamless. The vinyl plank floors look amazing and are so practical.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-grey mb-4 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <p className="font-heading font-semibold text-navy">
                    - {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                Start Your Project
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-lg px-8 py-6 h-auto hover:bg-gold hover:text-navy hover:border-gold">
              <a href="tel:(732) 351-8653">Call (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;