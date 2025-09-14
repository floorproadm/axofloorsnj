import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar } from 'lucide-react';

interface HeroPromoProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  backgroundImage: string;
  onCtaClick: () => void;
  isVideoVersion?: boolean;
}

export const HeroPromo = ({ 
  headline, 
  subheadline, 
  ctaText, 
  backgroundImage, 
  onCtaClick,
  isVideoVersion = false 
}: HeroPromoProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        {isVideoVersion ? (
          <video 
            autoPlay 
            muted 
            loop 
            className="w-full h-full object-cover"
            poster={backgroundImage}
          >
            <source src="/sanding-process-closeup.mp4" type="video/mp4" />
            <img src={backgroundImage} alt="Refinished floor" className="w-full h-full object-cover" />
          </video>
        ) : (
          <img 
            src={backgroundImage} 
            alt="Refinished floor with autumn leaves" 
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-navy/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Autumn leaf accent */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold/80 rounded-full flex items-center justify-center text-2xl">
              🍂
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
            {headline}
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={onCtaClick}
              className="bg-gold hover:bg-gold/90 text-navy font-heading font-bold text-lg px-8 py-4 h-auto"
            >
              <Calendar className="mr-2" />
              {ctaText}
              <ArrowRight className="ml-2" />
            </Button>
            
            <div className="text-white/80 text-sm">
              <p>✓ Avaliação 100% gratuita</p>
              <p>✓ Sem compromisso</p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-white/70">
            <div className="flex items-center gap-2">
              <span className="text-gold">★★★★★</span>
              <span className="text-sm">4.9/5 no Google</span>
            </div>
            <div className="text-sm">500+ pisos refinados</div>
            <div className="text-sm">Garantia de 2 anos</div>
          </div>
        </div>
      </div>

      {/* Mascot Woody */}
      <div className="absolute bottom-8 right-8 hidden lg:block">
        <img 
          src="/src/assets/woody-mascot.png" 
          alt="Woody mascot pointing to offer" 
          className="w-24 h-24 animate-bounce"
        />
      </div>
    </section>
  );
};