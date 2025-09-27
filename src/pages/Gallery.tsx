import { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Eye, Image, ChevronLeft, ChevronRight, X, Gift } from "lucide-react";
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
import beforeAfter9 from "@/assets/before-after/before-after-9.png";
import beforeAfter10 from "@/assets/before-after/before-after-10.png";
import beforeAfter11 from "@/assets/before-after/before-after-11.png";
import beforeAfter12 from "@/assets/before-after/before-after-12.png";
import albumCover from "@/assets/before-after/album-cover.png";

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
  "before-after-9.png": beforeAfter9,
  "before-after-10.png": beforeAfter10,
  "before-after-11.png": beforeAfter11,
  "before-after-12.png": beforeAfter12,
  "album-cover.png": albumCover,
};

const Gallery = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<GalleryProject[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<GalleryProject[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
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

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      switch (event.key) {
        case 'Escape':
          handleCloseLightbox();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handlePreviousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, lightboxImages.length]);

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

      // Count projects per folder and ensure English descriptions
      const foldersWithCounts = (foldersData || []).map(folder => ({
        ...folder,
        // Force English description for Before and After folder
        description: folder.name === 'Before and After' 
          ? 'Stunning transformations from our floor refinishing projects'
          : folder.description,
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
    const folderProjects = projects.filter(project => project.parent_folder_id === folder.id);
    if (folderProjects.length > 0) {
      setLightboxImages(folderProjects);
      setCurrentImageIndex(0);
      setIsLightboxOpen(true);
    }
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImages([]);
    setCurrentImageIndex(0);
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
  };

  const handleBackToFolders = () => {
    setSelectedFolder(null);
    setSelectedCategory("All");
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
            Explore our albums organized by project type. Click to see the incredible transformations we create.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-white/60">
            <Eye className="w-5 h-5" />
            <span>Over 500 successful projects completed</span>
          </div>
        </div>
      </section>

      {/* Referral Sticky Banner */}
      <div className="sticky top-0 z-40 bg-gold/95 backdrop-blur-sm border-b border-gold/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-black" />
              <p className="text-black font-medium text-sm sm:text-base">
                <span className="hidden sm:inline">Love these transformations? </span>
                Refer friends & earn 1% of their project value!
              </p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-black text-white hover:bg-black/80 border-black"
              onClick={() => {
                console.log('[Referral CTA] Gallery sticky banner clicked');
                window.location.href = "/referral-program";
              }}
            >
              <span className="hidden sm:inline">Start Earning</span>
              <span className="sm:hidden">Earn 1%</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-grey text-lg">Loading gallery...</p>
            </div>
          ) : (
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
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                    />
                     <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                       <div className="text-white text-center">
                         <Image className="w-12 h-12 mx-auto mb-2" />
                         <span className="font-medium text-lg">View Photos</span>
                       </div>
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
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={handleCloseLightbox}
        >
          <div className="relative w-full h-full max-w-6xl flex items-center justify-center p-4">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
              onClick={handleCloseLightbox}
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Image Navigation */}
            {lightboxImages.length > 0 && (
              <>
                {/* Previous Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>

                {/* Current Image */}
                <div className="flex items-center justify-center w-full h-full">
                  <img
                    src={imageMap[lightboxImages[currentImageIndex]?.image_url] || lightboxImages[currentImageIndex]?.image_url}
                    alt={lightboxImages[currentImageIndex]?.title}
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Photo Counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {lightboxImages.length}
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>

              </>
            )}
          </div>
        </div>
      )}

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

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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
          
          {/* Inline Referral CTA */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-gold/20 bg-gold/5">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Gift className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-heading font-semibold text-navy">
                    Impressed by Our Work?
                  </h3>
                </div>
                <p className="text-grey mb-4">
                  Share your experience and earn 1% of every project you refer. 
                  Help your friends get beautiful floors while you earn extra income!
                </p>
                <Button 
                  onClick={() => {
                    console.log('[Referral CTA] Gallery inline section clicked');
                    window.location.href = "/referral-program";
                  }}
                  className="gold-gradient text-black font-semibold"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Start Referring & Earning
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;