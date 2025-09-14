import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountdownTimer } from './CountdownTimer';
import { Gift, Shield, Users } from 'lucide-react';

interface OfferBoxProps {
  discount: string;
  validUntil: string;
  spotLimit: number;
  onCtaClick: () => void;
}

export const OfferBox = ({ discount, validUntil, spotLimit, onCtaClick }: OfferBoxProps) => {
  return (
    <section className="py-16 bg-gradient-to-br from-gold/10 to-gold/5">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-gold to-gold/90 text-navy p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <Gift className="w-16 h-16 text-navy" />
            </div>

            <h2 className="text-4xl md:text-6xl font-heading font-bold mb-4">
              {discount} OFF
            </h2>
            
            <p className="text-xl md:text-2xl mb-6 font-medium">
              Refinishing de Pisos de Madeira
            </p>

            <div className="mb-8">
              <CountdownTimer targetDate={validUntil} />
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="font-medium">Garantia extra para pets</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                <span className="font-medium">Controle total de poeira</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Gift className="w-6 h-6" />
                <span className="font-medium">Consultoria incluída</span>
              </div>
            </div>

            <Button 
              size="lg"
              onClick={onCtaClick}
              className="bg-navy hover:bg-navy/90 text-white font-heading font-bold text-xl px-12 py-6 h-auto mb-4"
            >
              Garantir Minha Promoção
            </Button>

            <p className="text-navy/80 font-medium">
              ⚡ Promoção limitada para os primeiros {spotLimit} agendamentos
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};