import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Palette, Settings, Shield } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const StepSection = () => {
  const steps: Step[] = [
    {
      number: 1,
      title: "Solicite Visita Gratuita",
      description: "Agendamento flexível, sem compromisso. Nosso especialista avalia seu piso e oferece consultoria personalizada.",
      icon: <Calendar className="w-8 h-8" />
    },
    {
      number: 2,
      title: "Consultoria + Amostras",
      description: "Apresentamos opções de acabamento, cronograma detalhado e garantias. Você escolhe a melhor solução.",
      icon: <Palette className="w-8 h-8" />
    },
    {
      number: 3,
      title: "Refinish Profissional",
      description: "Processo com controle total de poeira, pet-friendly e sem sujeira. Transformação completa em poucos dias.",
      icon: <Settings className="w-8 h-8" />
    },
    {
      number: 4,
      title: "Pós-venda com Garantia",
      description: "Acompanhamento, dicas de manutenção e garantia estendida. Seu piso protegido por anos.",
      icon: <Shield className="w-8 h-8" />
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
            Por que agora é o momento ideal?
          </h2>
          <p className="text-lg text-grey max-w-2xl mx-auto">
            Processo simples, resultado garantido e seu piso renovado antes das festas de fim de ano.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, index) => (
            <Card key={step.number} className="p-6 text-center relative overflow-hidden">
              {/* Step number background */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-gold">{step.number}</span>
              </div>

              <div className="flex justify-center mb-4 text-navy">
                {step.icon}
              </div>

              <h3 className="text-lg font-heading font-bold text-navy mb-3">
                {step.title}
              </h3>

              <p className="text-grey leading-relaxed">
                {step.description}
              </p>

              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gold/30 z-10"></div>
              )}
            </Card>
          ))}
        </div>

        {/* Benefits highlights */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🏠</div>
            <h4 className="font-heading font-bold text-navy mb-2">Piso renovado antes das festas</h4>
            <p className="text-grey">Receba visitas com um piso impecável</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h4 className="font-heading font-bold text-navy mb-2">Preço promocional com qualidade premium</h4>
            <p className="text-grey">15% de desconto sem comprometer a excelência</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🐕</div>
            <h4 className="font-heading font-bold text-navy mb-2">Serviço pet-friendly, sem sujeira</h4>
            <p className="text-grey">Controle total de poeira, seguro para toda família</p>
          </div>
        </div>
      </div>
    </section>
  );
};