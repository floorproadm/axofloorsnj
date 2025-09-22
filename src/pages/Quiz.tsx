import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Home, DollarSign, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging
  console.log('[Quiz] Component mounted, currentStep:', currentStep);
  
  const [formData, setFormData] = useState({
    roomSize: "",
    services: [] as string[],
    budget: [5000],
    name: "",
    email: "",
    phone: "",
    city: ""
  });

  const roomSizes = [
    { value: "small", label: "Pequeno (< 18 m²)", rooms: "Quarto, Escritório" },
    { value: "medium", label: "Médio (18-46 m²)", rooms: "Sala, Cozinha" },
    { value: "large", label: "Grande (46-93 m²)", rooms: "Planta Aberta" },
    { value: "xlarge", label: "Muito Grande (93+ m²)", rooms: "Múltiplos Ambientes" }
  ];

  const serviceOptions = [
    { id: "hardwood", label: "Instalação de Piso de Madeira", route: "/hardwood-flooring" },
    { id: "sanding", label: "Lixamento e Envernizamento", route: "/sanding-and-refinish" },
    { id: "vinyl", label: "Piso Vinílico", route: "/vinyl-plank-flooring" },
    { id: "staircase", label: "Restauração de Escadas", route: "/staircase" },
    { id: "baseboards", label: "Rodapés", route: "/base-boards" }
  ];

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        services: prev.services.filter(s => s !== serviceId)
      }));
    }
  };

  const getRecommendedService = () => {
    if (formData.services.includes("sanding")) return "/sanding-and-refinish";
    if (formData.services.includes("hardwood")) return "/hardwood-flooring";
    if (formData.services.includes("vinyl")) return "/vinyl-plank-flooring";
    if (formData.services.includes("staircase")) return "/staircase";
    if (formData.services.includes("baseboards")) return "/base-boards";
    return "/sanding-and-refinish"; // Default fallback
  };

  const handleSubmit = async () => {
    console.log('[Quiz] handleSubmit called with formData:', formData);
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Por favor preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Store quiz results in Supabase
      const quizData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city || null,
        room_size: formData.roomSize,
        services: formData.services,
        budget: formData.budget[0],
        source: 'quiz'
      };

      console.log('[Quiz] Submitting data:', quizData);

      // Save to Supabase database
      const { data: savedQuiz, error: saveError } = await supabase
        .from('quiz_responses')
        .insert([quizData])
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save quiz response: ${saveError.message}`);
      }

      console.log('[Quiz] Saved successfully:', savedQuiz);

      // Send follow-up email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-follow-up', {
          body: {
            name: formData.name,
            email: formData.email,
            source: 'quiz',
            leadType: 'quiz'
          }
        });

        if (emailError) {
          console.error('[Quiz] Email error:', emailError);
          // Don't fail the whole process for email errors
        } else {
          console.log('[Quiz] Follow-up email sent successfully');
        }
      } catch (emailError) {
        console.error('[Quiz] Email sending failed:', emailError);
        // Don't fail the whole process for email errors
      }

      toast({
        title: "Obrigado!",
        description: "Entraremos em contato em até 24 horas com suas recomendações personalizadas."
      });

      // Redirect to recommended service page
      const recommendedRoute = getRecommendedService();
      navigate(recommendedRoute + '?source=quiz');

    } catch (error) {
      console.error('Quiz submission error:', error);
      toast({
        title: "Algo deu errado",
        description: "Tente novamente ou ligue diretamente para (732) 351-8653",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    console.log('[Quiz] nextStep called, currentStep:', currentStep, 'formData:', formData);
    
    if (currentStep === 1 && !formData.roomSize) {
      toast({
        title: "Por favor selecione o tamanho do ambiente",
        variant: "destructive"
      });
      return;
    }
    if (currentStep === 2 && formData.services.length === 0) {
      toast({
        title: "Por favor selecione pelo menos um serviço",
        variant: "destructive"
      });
      return;
    }
    
    const newStep = Math.min(currentStep + 1, 4);
    console.log('[Quiz] Moving to step:', newStep);
    setCurrentStep(newStep);
  };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    console.log('[Quiz] Going back to step:', newStep);
    setCurrentStep(newStep);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">
                Seu Piso Valoriza ou Desvaloriza Sua Casa?
              </h1>
              <p className="text-lg sm:text-xl text-grey mb-6">
                Descubra em 30 segundos como transformar seu piso em um diferencial de alto impacto para sua casa.
              </p>
              <div className="flex justify-center items-center gap-2 text-sm text-grey">
                <span className={`w-8 h-1 rounded ${currentStep >= 1 ? 'bg-gold' : 'bg-grey/30'}`}></span>
                <span className={`w-8 h-1 rounded ${currentStep >= 2 ? 'bg-gold' : 'bg-grey/30'}`}></span>
                <span className={`w-8 h-1 rounded ${currentStep >= 3 ? 'bg-gold' : 'bg-grey/30'}`}></span>
                <span className={`w-8 h-1 rounded ${currentStep >= 4 ? 'bg-gold' : 'bg-grey/30'}`}></span>
              </div>
            </div>

            <Card className="bg-white border-2 border-gold/20 shadow-elegant">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-heading text-navy">
                  Passo {currentStep} de 4
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                {/* Step 1: Room Size */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Home className="w-12 h-12 text-gold mx-auto mb-4" />
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Qual o tamanho do seu ambiente principal?
                      </h3>
                      <p className="text-grey">Isso nos ajuda a recomendar a melhor abordagem</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {roomSizes.map((size) => (
                        <Card 
                          key={size.value}
                          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                            formData.roomSize === size.value 
                              ? 'border-gold bg-gold/10' 
                              : 'border-grey/20 hover:border-gold/50'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, roomSize: size.value }))}
                        >
                          <CardContent className="p-4 text-center">
                            <h4 className="font-semibold text-navy mb-1">{size.label}</h4>
                            <p className="text-sm text-grey">{size.rooms}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Services */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <Wrench className="w-12 h-12 text-gold mx-auto mb-4" />
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Qual serviço mais te interessa?
                      </h3>
                      <p className="text-grey">Selecione todos que se aplicam</p>
                    </div>

                    <div className="space-y-4">
                      {serviceOptions.map((service) => (
                        <div key={service.id} className="flex items-center space-x-3 p-4 border border-grey/20 rounded-lg hover:border-gold/50 transition-colors">
                          <Checkbox
                            id={service.id}
                            checked={formData.services.includes(service.id)}
                            onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                          />
                          <Label 
                            htmlFor={service.id} 
                            className="text-navy font-medium cursor-pointer flex-1"
                          >
                            {service.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Budget */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <DollarSign className="w-12 h-12 text-gold mx-auto mb-4" />
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Qual sua faixa de investimento?
                      </h3>
                      <p className="text-grey">Isso nos ajuda a fornecer recomendações precisas</p>
                    </div>

                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gold mb-4">
                          ${formData.budget[0].toLocaleString()}
                        </div>
                        <Slider
                          value={formData.budget}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                          min={1000}
                          max={15000}
                          step={500}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-grey mt-2">
                          <span>$1,000</span>
                          <span>$15,000+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Contact Info */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-heading font-bold text-navy mb-2">
                        Receba Suas Recomendações Personalizadas
                      </h3>
                      <p className="text-grey">Enviaremos ideias e amostras que combinam com seu espaço</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Seu nome"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="seu@email.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Sua cidade em NJ"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="bg-gold/10 p-4 rounded-lg border border-gold/20">
                      <p className="text-sm text-navy text-center">
                        <strong>Sem pressão, sem ligações de vendas.</strong> Enviaremos recomendações personalizadas 
                        e você pode entrar em contato quando estiver pronto.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-grey/20">
                  {currentStep > 1 && (
                    <Button 
                      variant="outline" 
                      onClick={prevStep}
                      className="border-grey/30 text-grey hover:border-gold hover:text-gold"
                    >
                      Voltar
                    </Button>
                  )}
                  
                  <div className="ml-auto">
                    {currentStep < 4 ? (
                      <Button 
                        onClick={nextStep}
                        className="gold-gradient text-black font-semibold"
                      >
                        Próximo Passo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="gold-gradient text-black font-semibold"
                      >
                        {isLoading ? "Enviando..." : "Receber Minhas Recomendações"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Quiz;