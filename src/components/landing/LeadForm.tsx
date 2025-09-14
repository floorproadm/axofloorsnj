import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Mail, MapPin, Home } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  neighborhood: string;
  floorType: string;
}

export const LeadForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    neighborhood: '',
    floorType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Por favor, informe seu nome."
      });
      return false;
    }
    
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast({
        variant: "destructive", 
        title: "E-mail inválido",
        description: "Por favor, informe um e-mail válido."
      });
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast({
        variant: "destructive",
        title: "Telefone obrigatório", 
        description: "Por favor, informe seu telefone."
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Log for tracking
    console.log('[FallPromo]', {
      ...formData,
      utm_source: 'landing',
      utm_medium: 'form',
      utm_campaign: 'fall_promo_2024',
      timestamp: new Date().toISOString()
    });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sucesso!",
        description: "Seu agendamento foi recebido. Entraremos em contato em até 2 horas.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        neighborhood: '',
        floorType: ''
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Houve um problema. Tente novamente ou ligue (201) 555-0123."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 bg-navy/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
              Quero Meu Orçamento Gratuito
            </h2>
            <p className="text-lg text-grey">
              Preencha os dados e receba uma proposta personalizada em até 2 horas.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-navy font-medium">
                  Nome completo *
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Como devemos te chamar?"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                    <Home className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-navy font-medium">
                  E-mail *
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-navy font-medium">
                  Telefone *
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(201) 555-0123"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    required
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Neighborhood */}
              <div className="space-y-2">
                <Label htmlFor="neighborhood" className="text-navy font-medium">
                  Bairro/Cidade
                </Label>
                <div className="relative">
                  <Input
                    id="neighborhood"
                    type="text"
                    placeholder="Ex: Hoboken, Jersey City..."
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-grey">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Floor Type */}
              <div className="space-y-2">
                <Label htmlFor="floorType" className="text-navy font-medium">
                  Tipo de piso
                </Label>
                <Select value={formData.floorType} onValueChange={(value) => handleInputChange('floorType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de piso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hardwood">Hardwood (madeira maciça)</SelectItem>
                    <SelectItem value="engineered">Engineered wood</SelectItem>
                    <SelectItem value="parquet">Parquet</SelectItem>
                    <SelectItem value="laminate">Laminado</SelectItem>
                    <SelectItem value="not-sure">Não tenho certeza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="lg"
                disabled={isLoading}
                className="w-full bg-gold hover:bg-gold/90 text-navy font-heading font-bold text-lg py-6 h-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Quero Meu Orçamento Gratuito'
                )}
              </Button>

              <div className="text-center text-sm text-grey">
                <p>✓ Resposta em até 2 horas</p>
                <p>✓ Sem compromisso</p>
                <p>✓ Avaliação 100% gratuita</p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
};