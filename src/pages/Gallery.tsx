import { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GalleryProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string;
  display_order: number;
  is_featured: boolean;
}

const Gallery = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<GalleryProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);
  const { toast } = useToast();

  const categories = ["All", "Hardwood Flooring", "Sanding & Refinish", "Before and After", "Vinyl Plank", "Staircase", "Baseboards & Trim"];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => project.category === selectedCategory));
    }
  }, [projects, selectedCategory]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const visibleProjects = filteredProjects.slice(0, visibleCount);

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
                variant={category === selectedCategory ? "default" : "outline"}
                className={category === selectedCategory ? "gold-gradient" : "hover:bg-gold hover:text-navy hover:border-gold"}
                onClick={() => setSelectedCategory(category)}
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
          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-grey text-lg">Loading gallery projects...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleProjects.map((project) => (
                  <Card key={project.id} className="group hover:shadow-gold transition-smooth hover:-translate-y-2 overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={project.image_url} 
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
                      {project.is_featured && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-navy text-white px-2 py-1 rounded-full text-xs font-medium">
                            Featured
                          </span>
                        </div>
                      )}
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
                <p className="text-grey mb-6">
                  Showing {visibleProjects.length} of {filteredProjects.length} projects
                </p>
                {visibleCount < filteredProjects.length && (
                  <Button 
                    variant="outline" 
                    className="hover:bg-gold hover:text-navy hover:border-gold"
                    onClick={handleLoadMore}
                  >
                    Load More Projects
                  </Button>
                )}
              </div>
            </>
          )}
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
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
              <Link to="/contact" className="flex items-center gap-2">
                Start Your Project
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold hover:bg-gold hover:text-navy hover:border-gold">
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