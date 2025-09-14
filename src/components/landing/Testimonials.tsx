import React from 'react';
import { Card } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  city: string;
  rating: number;
  text: string;
  project: string;
}

export const Testimonials = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Maria Santos",
      city: "Hoboken, NJ",
      rating: 5,
      text: "Fantástico! Refinishing feito no outono passado e o piso ainda está impecável. Zero sujeira e muito profissional.",
      project: "Refinishing sala e corredor"
    },
    {
      id: 2,
      name: "John Miller",
      city: "Jersey City, NJ", 
      rating: 5,
      text: "A promoção de outono foi perfeita. Consegui renovar toda a casa antes do Thanksgiving. Recomendo muito!",
      project: "Refinishing completo - 3 quartos"
    },
    {
      id: 3,
      name: "Ana Rodriguez",
      city: "Union City, NJ",
      rating: 5,
      text: "Meus gatos ficaram super tranquilos durante todo o processo. Controle de poeira realmente funciona!",
      project: "Refinishing pet-friendly"
    }
  ];

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'fill-gold text-gold' : 'text-grey/30'}`} 
        />
      ))}
    </div>
  );

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-grey max-w-2xl mx-auto">
            Depoimentos reais de clientes que aproveitaram nossa promoção de outono anterior.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="p-6 h-full">
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={testimonial.rating} />
                <span className="text-sm font-medium text-grey">
                  {testimonial.rating}.0
                </span>
              </div>

              {/* Testimonial text */}
              <blockquote className="text-grey leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </blockquote>

              {/* Customer info */}
              <div className="border-t pt-4">
                <div className="font-heading font-bold text-navy mb-1">
                  {testimonial.name}
                </div>
                <div className="text-sm text-grey mb-2">
                  📍 {testimonial.city}
                </div>
                <div className="text-sm text-gold font-medium">
                  {testimonial.project}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="text-center mt-12">
          <div className="flex flex-wrap justify-center items-center gap-8 text-grey">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-gold text-gold" />
              <span className="font-medium">4.9/5 no Google Reviews</span>
            </div>
            <div className="font-medium">500+ pisos refinados</div>
            <div className="font-medium">100% dos clientes recomendam</div>
            <div className="font-medium">Garantia de 2 anos</div>
          </div>
        </div>
      </div>
    </section>
  );
};