import React, { useEffect } from 'react';
import { HeroPromo } from '@/components/landing/HeroPromo';
import { StepSection } from '@/components/landing/StepSection';
import { GalleryMini } from '@/components/landing/GalleryMini';
import { Testimonials } from '@/components/landing/Testimonials';
import { OfferBox } from '@/components/landing/OfferBox';
import { LeadForm } from '@/components/landing/LeadForm';
import { Button } from '@/components/ui/button';
import { Phone, Instagram, Facebook, Twitter } from 'lucide-react';

const FallPromoPage = () => {
  const scrollToForm = () => {
    const formElement = document.getElementById('lead-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // A/B Testing: alternates between image and video hero
  const isVideoVersion = Math.random() > 0.5;

  useEffect(() => {
    // Track page view for analytics
    console.log('[FallPromo] Page loaded', {
      version: isVideoVersion ? 'video' : 'image',
      utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      timestamp: new Date().toISOString()
    });
  }, [isVideoVersion]);

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <title>Fall Promo: 15% OFF Refinishing de Pisos - AXO Floors</title>
      <meta 
        name="description" 
        content="Promoção limitada: 15% OFF no refinishing de pisos de madeira. Válida até 15 de outubro para moradores do Tri-State. Agende sua avaliação gratuita hoje!" 
      />
      <meta name="keywords" content="refinishing pisos, promoção outono, desconto pisos madeira, tri-state, NJ, NY" />
      <link rel="canonical" href="https://axofloors.com/campaigns/fall-promo" />

      {/* Hero Section */}
      <HeroPromo
        headline="Outono com Brilho: 15% OFF no Refinishing de Pisos de Madeira"
        subheadline="Oferta válida até 15 de outubro para moradores do Tri-State"
        ctaText="Agendar Avaliação Gratuita"
        backgroundImage="/src/assets/sanding-hero-new.jpg"
        onCtaClick={scrollToForm}
        isVideoVersion={isVideoVersion}
      />

      {/* Benefits and Process */}
      <StepSection />

      {/* Social Proof */}
      <Testimonials />

      {/* Gallery */}
      <GalleryMini />

      {/* Main Offer */}
      <OfferBox
        discount="15%"
        validUntil="2024-10-15T23:59:59"
        spotLimit={15}
        onCtaClick={scrollToForm}
      />

      {/* Lead Form */}
      <div id="lead-form">
        <LeadForm />
      </div>

      {/* Simplified Footer */}
      <footer className="bg-navy text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/src/assets/axo-logo.png" alt="AXO Floors" className="w-8 h-8" />
                <span className="text-xl font-heading font-bold">AXO Floors</span>
              </div>
              <p className="text-white/80 mb-4">
                Especialistas em refinishing de pisos de madeira no Tri-State desde 2015.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:text-gold">
                  <Instagram className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:text-gold">
                  <Facebook className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:text-gold">
                  <Twitter className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-heading font-bold mb-4">Links Rápidos</h4>
              <div className="space-y-2">
                <a href="/privacy" className="block text-white/80 hover:text-gold transition-colors">
                  Política de Privacidade
                </a>
                <a href="/terms" className="block text-white/80 hover:text-gold transition-colors">
                  Termos de Serviço
                </a>
                <a href="/gallery" className="block text-white/80 hover:text-gold transition-colors">
                  Nossa Galeria
                </a>
                <a href="/about" className="block text-white/80 hover:text-gold transition-colors">
                  Sobre Nós
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-heading font-bold mb-4">Contato</h4>
              <div className="space-y-3">
                <a 
                  href="tel:+12015550123"
                  className="flex items-center gap-3 text-white/80 hover:text-gold transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  (201) 555-0123
                </a>
                <p className="text-white/80">
                  📍 Atendendo: NJ, NY, CT
                </p>
                <p className="text-white/80">
                  ⏰ Seg-Sáb: 7h-19h
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2024 AXO Floors. Todos os direitos reservados.</p>
            <p className="mt-2 text-sm">
              Promoção válida até 15/10/2024. Limitada aos primeiros 15 agendamentos. 
              Termos e condições aplicáveis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FallPromoPage;