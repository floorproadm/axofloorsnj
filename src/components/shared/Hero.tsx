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
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
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
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Reviews Badge */}
          {showReviews && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-sm font-medium">35+ Google Reviews</span>
            </div>
          )}

          {/* Subtitle */}
          <p className="text-lg md:text-xl font-medium text-gold mb-4 font-heading">
            {subtitle}
          </p>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 leading-tight">
            {title}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                {ctaPrimary}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-6 h-auto">
              <a href="tel:(732) 351-8653" className="flex items-center gap-2">
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