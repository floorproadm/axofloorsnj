import { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Eye, Folder, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Import before and after images
import beforeAfter1 from "@/assets/before-after/before-after-1.png";
import beforeAfter2 from "@/assets/before-after/before-after-2.png";
import beforeAfter3 from "@/assets/before-after/before-after-3.png";
import beforeAfter4 from "@/assets/before-after/before-after-4.png";
import beforeAfter5 from "@/assets/before-after/before-after-5.png";
import beforeAfter6 from "@/assets/before-after/before-after-6.png";
import beforeAfter7 from "@/assets/before-after/before-after-7.png";
import beforeAfter8 from "@/assets/before-after/before-after-8.png";

interface GalleryProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string;
  display_order: number;
  is_featured: boolean;
  folder_name?: string;
  parent_folder_id?: string;
}

interface GalleryFolder {
  id: string;
  name: string;
  description: string;
  cover_image_url: string;
  display_order: number;
  project_count?: number;
}

// Image mapping for local imports
const imageMap: Record<string, string> = {
  "before-after-1.png": beforeAfter1,
  "before-after-2.png": beforeAfter2,
  "before-after-3.png": beforeAfter3,
  "before-after-4.png": beforeAfter4,
  "before-after-5.png": beforeAfter5,
  "before-after-6.png": beforeAfter6,
  "before-after-7.png": beforeAfter7,
  "before-after-8.png": beforeAfter8,
};

const Gallery = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<GalleryProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'folders' | 'projects'>('folders');
  const [visibleCount, setVisibleCount] = useState(9);
  const { toast } = useToast();

  const categories = ["All", "Hardwood Flooring", "Sanding & Refinish", "Before and After", "Vinyl Plank", "Staircase", "Baseboards & Trim"];

  useEffect(() => {
    fetchFoldersAndProjects();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      setFilteredProjects(projects.filter(project => project.parent_folder_id === selectedFolder));
    } else if (selectedCategory === "All") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => project.category === selectedCategory));
    }
  }, [projects, selectedCategory, selectedFolder]);

  const fetchFoldersAndProjects = async () => {
    try {
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('gallery_folders')
        .select('*')
        .order('display_order', { ascending: true });

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('gallery_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (foldersError) throw foldersError;
      if (projectsError) throw projectsError;

      // Count projects per folder
      const foldersWithCounts = (foldersData || []).map(folder => ({
        ...folder,
        project_count: (projectsData || []).filter(project => project.parent_folder_id === folder.id).length
      }));

      setFolders(foldersWithCounts);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching gallery data:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const handleFolderClick = (folder: GalleryFolder) => {
    setSelectedFolder(folder.id);
    setViewMode('projects');
    setSelectedCategory("All");
  };

  const handleBackToFolders = () => {
    setViewMode('folders');
    setSelectedFolder(null);
    setSelectedCategory("All");
  };

  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const currentFolder = folders.find(f => f.id === selectedFolder);

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
            {viewMode === 'folders' ? 'Nossa Galeria' : currentFolder?.name || 'Projetos'}
          </h1>
          
          {viewMode === 'folders' ? (
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Explore nossos álbuns organizados por tipo de projeto. Veja a qualidade e atenção aos detalhes que diferenciam a AXO Floors.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xl text-white/80 max-w-3xl mx-auto">
                {currentFolder?.description}
              </p>
              <Button 
                variant="outline" 
                onClick={handleBackToFolders}
                className="text-white border-white hover:bg-white hover:text-navy"
              >
                ← Voltar aos Álbuns
              </Button>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Eye className="w-5 h-5" />
            <span>Mais de 500 projetos realizados com sucesso</span>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-grey text-lg">Carregando galeria...</p>
            </div>
          ) : viewMode === 'folders' ? (
            /* Folder View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {folders.map((folder) => (
                <Card 
                  key={folder.id} 
                  className="group hover:shadow-gold transition-smooth hover:-translate-y-2 overflow-hidden cursor-pointer"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={imageMap[folder.cover_image_url] || folder.cover_image_url} 
                      alt={folder.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                    />
                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <div className="text-white text-center">
                        <Folder className="w-12 h-12 mx-auto mb-2" />
                        <span className="font-medium text-lg">Abrir Álbum</span>
                      </div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-gold text-navy px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        {folder.project_count} fotos
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-heading font-semibold text-navy mb-2 group-hover:text-gold transition-smooth">
                      {folder.name}
                    </h3>
                    <p className="text-grey leading-relaxed">{folder.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Project View */
            <>
              {/* Filter Tabs */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleProjects.map((project) => (
                  <Card key={project.id} className="group hover:shadow-gold transition-smooth hover:-translate-y-2 overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={imageMap[project.image_url] || project.image_url} 
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                      />
                      <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                        <div className="text-white text-center">
                          <Eye className="w-8 h-8 mx-auto mb-2" />
                          <span className="font-medium">Ver Projeto</span>
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
                            Destaque
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
                  Mostrando {visibleProjects.length} de {filteredProjects.length} projetos
                </p>
                {visibleCount < filteredProjects.length && (
                  <Button 
                    variant="outline" 
                    className="hover:bg-gold hover:text-navy hover:border-gold"
                    onClick={handleLoadMore}
                  >
                    Ver Mais Projetos
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
            O Que Nossos Clientes Dizem
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: "Jennifer M.",
                text: "A transformação dos nossos pisos foi incrível. A AXO Floors superou nossas expectativas com atenção aos detalhes.",
                rating: 5
              },
              {
                name: "Robert K.",
                text: "Profissionais, pontuais e a qualidade é excepcional. Nossa escada é agora a peça central da nossa casa.",
                rating: 5
              },
              {
                name: "Maria L.",
                text: "Do orçamento ao fim, o processo foi perfeito. Os pisos vinílicos ficaram incríveis e são muito práticos.",
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
                Inicie Seu Projeto
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold hover:bg-gold hover:text-navy hover:border-gold">
              <a href="tel:(732) 351-8653">Ligue (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;