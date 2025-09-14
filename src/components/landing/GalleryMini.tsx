import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BeforeAfter {
  id: number;
  before: string;
  after: string;
  location: string;
  description: string;
}

export const GalleryMini = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAfter, setShowAfter] = useState(false);

  const projects: BeforeAfter[] = [
    {
      id: 1,
      before: "/src/assets/before-after-comparison.png",
      after: "/src/assets/hardwood-hero.jpg",
      location: "Hoboken, NJ",
      description: "Refinishing completo em sala e quarto"
    },
    {
      id: 2,
      before: "/src/assets/before-after-2.png",
      after: "/src/assets/sanding-hero.jpg",
      location: "Jersey City, NJ",
      description: "Restauração de piso vintage"
    },
    {
      id: 3,
      before: "/src/assets/before-after-comparison.png",
      after: "/src/assets/staircase-hero.jpg",
      location: "Weehawken, NJ",
      description: "Escadaria e hall de entrada"
    }
  ];

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
    setShowAfter(false);
  };

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
    setShowAfter(false);
  };

  const currentProject = projects[currentIndex];

  return (
    <section className="py-16 bg-navy/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
            Transformações Reais no Outono Passado
          </h2>
          <p className="text-lg text-grey max-w-2xl mx-auto">
            Veja o antes e depois dos nossos projetos mais recentes na região.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            {/* Image comparison */}
            <div className="relative aspect-video bg-grey/10">
              <img 
                src={showAfter ? currentProject.after : currentProject.before}
                alt={showAfter ? "Depois do refinishing" : "Antes do refinishing"}
                className="w-full h-full object-cover transition-all duration-500"
              />
              
              {/* Before/After toggle */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 flex">
                  <Button
                    variant={!showAfter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowAfter(false)}
                    className="rounded-full"
                  >
                    Antes
                  </Button>
                  <Button
                    variant={showAfter ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowAfter(true)}
                    className="rounded-full"
                  >
                    Depois
                  </Button>
                </div>
              </div>

              {/* Navigation arrows */}
              <Button
                variant="outline"
                size="icon"
                onClick={prevProject}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={nextProject}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Project info */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-heading font-bold text-navy mb-1">
                    {currentProject.description}
                  </h3>
                  <p className="text-grey">📍 {currentProject.location}</p>
                </div>
                <div className="text-sm text-grey">
                  {currentIndex + 1} de {projects.length}
                </div>
              </div>

              {/* Project indicators */}
              <div className="flex gap-2">
                {projects.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setShowAfter(false);
                    }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-gold' : 'bg-grey/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};