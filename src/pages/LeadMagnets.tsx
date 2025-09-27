import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import SEOHead from "@/components/shared/SEOHead";
import LeadMagnetGate from "@/components/shared/LeadMagnetGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, Calculator, Palette, TrendingUp, Home, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
const LeadMagnets = () => {
  const leadMagnets = [{
    id: 1,
    title: "Guia Completo de Cuidados com Piso de Madeira",
    description: "Aprenda a manter seus pisos de madeira como novos por décadas. Inclui cronograma de manutenção, produtos recomendados e técnicas profissionais.",
    fileName: "guia-cuidados-piso-madeira.pdf",
    downloadUrl: "/downloads/guia-cuidados-piso-madeira.pdf",
    benefits: ["Cronograma de manutenção semanal, mensal e anual", "Lista dos melhores produtos de limpeza para madeira", "Como remover manchas e arranhões em casa", "Sinais de quando chamar um profissional", "Dicas para aumentar a vida útil em 50%"],
    value: "$97",
    category: "maintenance",
    icon: BookOpen,
    color: "bg-blue-500"
  }, {
    id: 2,
    title: "Calculadora de Custos & Planejamento de Orçamento",
    description: "Ferramenta completa para estimar custos de instalação e reforma de pisos. Inclui planilhas editáveis e guia de negociação.",
    fileName: "calculadora-custos-pisos.pdf",
    downloadUrl: "/downloads/calculadora-custos-pisos.pdf",
    benefits: ["Calculadora Excel para diferentes tipos de piso", "Custos médios por m² atualizados 2024", "Como negociar com fornecedores", "Checklist de custos extras escondidos", "Planejamento financeiro para reformas"],
    value: "$129",
    category: "budgeting",
    icon: Calculator,
    color: "bg-green-500"
  }, {
    id: 3,
    title: "Guia de Seleção de Cores e Acabamentos 2024",
    description: "Descubra as tendências mais atuais em stains e acabamentos. Inclui paleta de cores e guia de combinações para cada estilo de casa.",
    fileName: "guia-cores-acabamentos-2024.pdf",
    downloadUrl: "/downloads/guia-cores-acabamentos-2024.pdf",
    benefits: ["50+ combinações de cores testadas", "Tendências 2024 para pisos de madeira", "Como combinar com móveis e decoração", "Acabamentos para cada ambiente da casa", "Dicas de iluminação para realçar a madeira"],
    value: "$87",
    category: "design",
    icon: Palette,
    color: "bg-gold"
  }, {
    id: 4,
    title: "Como Escolher o Piso Ideal para Sua Casa",
    description: "Comparativo completo entre hardwood, laminado, vinyl e outros. Descubra qual é o melhor investimento para seu estilo de vida.",
    fileName: "escolha-piso-ideal.pdf",
    downloadUrl: "/downloads/escolha-piso-ideal.pdf",
    benefits: ["Comparativo detalhado de 8 tipos de piso", "Teste de personalidade para escolha ideal", "Prós e contras com base no seu lifestyle", "Durabilidade e custo-benefício por tipo", "Checklist de decisão passo-a-passo"],
    value: "$67",
    category: "selection",
    icon: Home,
    color: "bg-purple-500"
  }, {
    id: 5,
    title: "Maximizando o Valor da Sua Casa com Pisos",
    description: "Estratégias comprovadas para aumentar o valor de revenda da sua propriedade através de pisos inteligentes.",
    fileName: "valor-casa-pisos.pdf",
    downloadUrl: "/downloads/valor-casa-pisos.pdf",
    benefits: ["ROI médio de diferentes tipos de piso", "Quais reformas trazem maior retorno", "Como apresentar para potenciais compradores", "Erros que diminuem o valor da propriedade", "Timing ideal para renovar antes da venda"],
    value: "$149",
    category: "investment",
    icon: TrendingUp,
    color: "bg-emerald-500"
  }];
  return <>
      <SEOHead title="Guias Gratuitos para Pisos de Madeira | AXO Floors" description="Baixe nossos guias especializados sobre pisos de madeira: manutenção, seleção, orçamento e tendências. Conteúdo profissional gratuito para transformar sua casa." keywords="guia pisos madeira, manutenção piso madeira, como escolher piso, calculadora custo piso, tendências pisos 2024" />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="py-12 sm:py-20 bg-gradient-to-br from-navy via-navy/95 to-navy/90 text-white">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-6 bg-gold text-navy font-semibold px-6 py-2">
              RECURSOS GRATUITOS
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
              Guias Profissionais <span className="text-gold">Gratuitos</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-grey-light mb-8 max-w-3xl mx-auto">
              Tudo o que você precisa saber sobre pisos de madeira em guias detalhados, 
              criados por nossos especialistas com mais de 15 anos de experiência.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Download className="h-4 w-4 text-gold" />
                <span>Download Imediato</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <BookOpen className="h-4 w-4 text-gold" />
                <span>Conteúdo Profissional</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <TrendingUp className="h-4 w-4 text-gold" />
                <span>Atualizado 2025
              </span>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Magnets Grid */}
        <section className="py-12 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {leadMagnets.map(magnet => {
              const IconComponent = magnet.icon;
              return <Card key={magnet.id} className="group hover:shadow-elegant transition-all duration-300 border-2 hover:border-gold/20">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 ${magnet.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      
                      {magnet.value && <Badge className="mb-3 bg-gold text-navy font-semibold mx-auto">
                          Valor {magnet.value} - GRÁTIS
                        </Badge>}
                      
                      <CardTitle className="text-lg font-heading font-bold text-navy mb-2">
                        {magnet.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-muted-foreground mb-4 text-sm">
                        {magnet.description}
                      </p>

                      <div className="mb-6">
                        <h4 className="font-semibold text-navy mb-2 text-sm">
                          O que você vai aprender:
                        </h4>
                        <ul className="space-y-1">
                          {magnet.benefits.slice(0, 3).map((benefit, index) => <li key={index} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                              <span className="text-muted-foreground">{benefit}</span>
                            </li>)}
                          {magnet.benefits.length > 3 && <li className="text-xs text-gold font-medium">
                              +{magnet.benefits.length - 3} mais dicas...
                            </li>}
                        </ul>
                      </div>

                      <LeadMagnetGate title={magnet.title} description={magnet.description} fileName={magnet.fileName} downloadUrl={magnet.downloadUrl} benefits={magnet.benefits} triggerText="Baixar Grátis" triggerVariant="gold" value={magnet.value} category={magnet.category} />
                    </CardContent>
                  </Card>;
            })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gold/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-navy mb-4">
              Precisa de Ajuda Personalizada?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Nossos guias são ótimos, mas nada substitui uma consultoria personalizada. 
              Agende uma avaliação gratuita para seu projeto específico.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-navy text-white hover:bg-navy/90" asChild>
                <Link to="/contact">
                  Agendar Avaliação Gratuita
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button size="lg" variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white" asChild>
                <Link to="/quiz">
                  Fazer Quiz Personalizado
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>;
};
export default LeadMagnets;