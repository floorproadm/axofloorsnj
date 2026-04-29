import { useState, useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Eye, Image, ChevronLeft, ChevronRight, X, Gift, MapPin, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PublicFeedPost {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  tags: string[];
  created_at: string;
  images: { id: string; file_url: string; file_type?: string; display_order: number }[];
}

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
  const [publicPosts, setPublicPosts] = useState<PublicFeedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<PublicFeedPost | null>(null);
  const [postImageIndex, setPostImageIndex] = useState(0);
  const { toast } = useToast();

  const categories = ["All", "Hardwood Flooring", "Sanding & Refinish", "Before and After", "Vinyl Plank", "Staircase", "Baseboards & Trim"];

  useEffect(() => {
    fetchFoldersAndProjects();
    fetchPublicFeedPosts();
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

  const fetchPublicFeedPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from("feed_posts")
        .select("id, title, description, location, category, tags, created_at")
        .eq("visibility", "public")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      const postIds = (posts || []).map((p) => p.id);
      let images: { id: string; file_url: string; file_type: string; feed_post_id: string; display_order: number }[] = [];
      if (postIds.length > 0) {
        const { data: imgData } = await supabase
          .from("feed_post_images")
          .select("id, file_url, file_type, feed_post_id, display_order")
          .in("feed_post_id", postIds)
          .order("display_order", { ascending: true });
        images = imgData || [];
      }

      setPublicPosts(
        (posts || [])
          .map((p) => ({
            ...p,
            tags: p.tags || [],
            images: images.filter((img) => img.feed_post_id === p.id),
          }))
          // Show all public posts (with or without images)
      );
    } catch (err) {
      console.error("Error fetching public feed posts:", err);
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
          <p className="text-gold font-medium tracking-wide uppercase text-sm mb-4">
            Real Projects · NJ · NY · PA
          </p>

          <h1 className="text-3xl md:text-5xl font-bold font-heading mb-6 leading-tight max-w-4xl mx-auto">
            See What Your Floors Could Look Like
            <span className="block bg-gradient-to-r from-gold via-yellow-300 to-gold bg-clip-text text-transparent mt-2">
              In Just Days, Not Weeks
            </span>
          </h1>

          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Every photo on this page is a real home we've worked in. No stock images. No staged renders. Just hardwood floors, refinished and installed by AXO Floors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
              <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                Get My Free Estimate
                <ArrowRight className="w-5 h-5 text-black" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold border-white text-black bg-white hover:bg-white hover:text-black">
              <a href="tel:(732) 351-8653">Call (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>



      {/* Gallery Intro + Folders */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-4">
              Browse Real <span className="text-gradient-gold">Transformations</span>
            </h2>
            <p className="text-grey leading-relaxed">
              Albums organized by project type — refinishing, installations, staircases, and more. Click any album to see the full set of photos.
            </p>
          </div>
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

      {/* Transformation Explanation */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-4">
                Why These Floors Look Different
              </h2>
              <p className="text-grey leading-relaxed max-w-2xl mx-auto">
                The difference isn't luck. It's process, equipment, and craftsmanship — applied the same way on every job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-navy text-lg mb-2">Dust-Contained Sanding</h3>
                  <p className="text-grey text-sm leading-relaxed">
                    Industrial dust-containment systems keep your home clean while we work. No mess on your furniture, no white film on your walls.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-navy text-lg mb-2">Controlled Finish Application</h3>
                  <p className="text-grey text-sm leading-relaxed">
                    Stains and sealers applied in thin, even coats — no streaks, no lap marks, no shortcuts. The grain stays sharp and the color stays true.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-semibold text-navy text-lg mb-2">Owner-Led Quality Control</h3>
                  <p className="text-grey text-sm leading-relaxed">
                    Every job is inspected before we leave. If something isn't right, we fix it before you ever see it.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-background border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-navy text-center mb-8">
              What You're Looking At
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "No stock photos", text: "Every image is from a real AXO Floors project." },
                { title: "Real client homes", text: "Photographed on-site, after final inspection." },
                { title: "No shortcuts", text: "Same process on a $5K job and a $50K job." },
                { title: "Consistent results", text: "What you see here is what we deliver — every time." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 flex-shrink-0" />
                  <div>
                    <p className="font-heading font-semibold text-navy">{item.title}</p>
                    <p className="text-grey text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {publicPosts.length > 0 && (
        <section className="py-20 bg-grey-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-4">
                Recent <span className="text-gradient-gold">Project Updates</span>
              </h2>
              <p className="text-grey max-w-2xl mx-auto">
                See the latest work from our team — real projects, real results.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicPosts.map((post) => (
                <Card
                  key={post.id}
                  className="group hover:shadow-gold transition-smooth hover:-translate-y-2 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedPost(post);
                    setPostImageIndex(0);
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {post.images.length > 0 ? (
                      (() => {
                        const firstImg = post.images[0];
                        const isVideo = firstImg?.file_type === "video";
                        return isVideo ? (
                          <>
                            <video
                              src={firstImg.file_url}
                              className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                              <div className="bg-black/60 rounded-full p-2">
                                <Play className="w-6 h-6 text-white fill-white" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img
                            src={firstImg?.file_url}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
                          />
                        );
                      })()
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Image className="w-16 h-16 text-muted-foreground/40" />
                      </div>
                    )}
                    {post.images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {post.images.length} photos
                      </div>
                    )}
                    <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                      <div className="text-white text-center">
                        <Image className="w-12 h-12 mx-auto mb-2" />
                        <span className="font-medium text-lg">View Project</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-heading font-semibold text-navy mb-1 group-hover:text-gold transition-smooth truncate">
                      {post.title || "Project Update"}
                    </h3>
                    {post.location && (
                      <p className="text-sm text-grey flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{post.location}</span>
                      </p>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feed Post Lightbox */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setSelectedPost(null)}
        >
          <div className="relative w-full h-full max-w-6xl flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
              onClick={() => setSelectedPost(null)}
            >
              <X className="w-6 h-6" />
            </Button>

            {selectedPost.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPostImageIndex((prev) => (prev > 0 ? prev - 1 : selectedPost.images.length - 1));
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPostImageIndex((prev) => (prev < selectedPost.images.length - 1 ? prev + 1 : 0));
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}

            <div className="flex flex-col items-center justify-center w-full h-full" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const currentImg = selectedPost.images[postImageIndex];
                const isVideo = currentImg?.file_type === "video";
                return isVideo ? (
                  <video
                    src={currentImg.file_url}
                    controls
                    muted
                    playsInline
                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={currentImg?.file_url}
                    alt={selectedPost.title}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg"
                  />
                );
              })()}
              <div className="mt-4 text-center text-white">
                <h3 className="text-xl font-heading font-semibold">{selectedPost.title}</h3>
                {selectedPost.description && (
                  <p className="text-white/70 mt-1 max-w-xl">{selectedPost.description}</p>
                )}
                {selectedPost.images.length > 1 && (
                  <div className="mt-2 bg-black/50 inline-block px-3 py-1 rounded-full text-sm">
                    {postImageIndex + 1} / {selectedPost.images.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-navy mb-4">
            Let's Turn Your Floors Into Something You're Proud Of
          </h2>
          <p className="text-grey max-w-2xl mx-auto mb-10 text-lg">
            Tell us about your project in under 2 minutes. We'll respond within 24 hours with a clear, personalized plan — no pressure, no obligation.
          </p>

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
                Get My Free Estimate
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