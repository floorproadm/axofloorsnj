import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

interface HeroProps {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  showReviews?: boolean;
}

const Hero = ({ 
  title, 
  subtitle, 
  description, 
  image, 
  ctaPrimary = "Get Free Quote", 
  ctaSecondary = "Call Now",
  showReviews = true 
}: HeroProps) => {
  return (
    <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={image} 
          alt="AXO Floors Premium Service" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Reviews Badge */}
          {showReviews && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 sm:px-4 mb-4 sm:mb-6 border border-white/20">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium">35+ Google Reviews</span>
            </div>
          )}

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl font-medium text-gold mb-3 sm:mb-4 font-heading">
            {subtitle}
          </p>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading mb-4 sm:mb-6 leading-tight px-2">
            {title}
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-2">
            {description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] text-black font-semibold">
              <Link to="/contact" className="flex items-center justify-center gap-2 text-black">
                {ctaPrimary}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-white text-black bg-white hover:bg-white hover:text-black text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 h-auto min-h-[48px] font-semibold">
              <a href="tel:(732) 351-8653" className="flex items-center justify-center gap-2 text-black">
                {ctaSecondary}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;