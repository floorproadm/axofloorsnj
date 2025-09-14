import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, RefreshCw, Zap, Clock, Sparkles } from "lucide-react";
import sandingHero from "@/assets/sanding-hero.jpg";

const SandingRefinish = () => {
  const benefits = [
    "Restores Original Beauty",
    "Eliminates Scratches & Dents", 
    "Dust-Free Sanding System",
    "Quick 2-3 Day Process",
    "Multiple Finish Options",
    "Increases Home Value"
  ];

  const processSteps = [
    {
      title: "Step 1: Sanding",
      description: "We sand your floors to remove old finishes, stains, scratches, chips and any other imperfections.",
      icon: Zap
    },
    {
      title: "Step 2: Staining",
      description: "We can preserve the wood's natural color, or you may choose any number of stains to enhance the color and charm.",
      icon: Sparkles
    },
    {
      title: "Step 3: Finishing",
      description: "We protect & beautify your floors with three coats of Bona or Loba finish with a matte, satin, or gloss sheen.",
      icon: CheckCircle
    }
  ];

  const finishOptions = [
    {
      name: "Matte Finish",
      description: "Natural look with minimal sheen, hides minor imperfections",
      best: "High-traffic areas"
    },
    {
      name: "Satin Finish", 
      description: "Perfect balance of durability and beauty with subtle luster",
      best: "Most popular choice"
    },
    {
      name: "Semi-Gloss Finish",
      description: "Higher sheen with excellent durability and easy cleaning",
      best: "Kitchens & bathrooms"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <Hero
        title="Tired of your worn-out floors?"
        subtitle="Don't worry, we have the solution!"
        description="It's common to face issues with worn-out floors over time, but that won't be a problem anymore with our specialized team by your side."
        image={sandingHero}
      />

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Why Choose Our Service?
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Our floor refinishing service delivers exceptional results with proven benefits.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-white border-navy/10 text-center hover:shadow-gold transition-smooth hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-6">
                  <Zap className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">Durability</h3>
                <p className="text-grey text-sm">Long-lasting protection that stands the test of time</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-navy/10 text-center hover:shadow-gold transition-smooth hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-6">
                  <RefreshCw className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">Increase Home Value</h3>
                <p className="text-grey text-sm">Boost your property value with beautiful floors</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-navy/10 text-center hover:shadow-gold transition-smooth hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-6">
                  <Clock className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">Savings</h3>
                <p className="text-grey text-sm">Cost-effective alternative to floor replacement</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-navy/10 text-center hover:shadow-gold transition-smooth hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-6">
                  <CheckCircle className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-4">Certified Safety</h3>
                <p className="text-grey text-sm">Professional standards and safety protocols</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 navy-gradient">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-6">
              Our Refinishing Process
            </h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto">
              We use state-of-the-art equipment and proven techniques to deliver flawless results every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => (
              <Card key={index} className="bg-white/95 backdrop-blur-sm border-gold/20 text-center group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gold rounded-full mb-6 group-hover:scale-110 transition-bounce">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-navy mb-4">
                    {step.title}
                  </h3>
                  <p className="text-grey leading-relaxed text-lg">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Finish Options Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Finish Options
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              Choose the perfect finish for your lifestyle and aesthetic preferences. All finishes provide excellent protection and durability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {finishOptions.map((finish, index) => (
              <Card key={index} className="bg-white border-navy/10 group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-heading font-bold text-navy mb-4 group-hover:text-gold transition-smooth">
                    {finish.name}
                  </h3>
                  <p className="text-grey mb-6 leading-relaxed text-lg">
                    {finish.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span className="text-gold font-semibold">Best for: {finish.best}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After CTA */}
      <section className="py-20 navy-gradient text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 to-navy/60"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6 animate-fade-in">
            See the Transformation
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto animate-fade-in">
            Ready to restore your floors to their former glory? Contact us today for a free assessment and quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button asChild className="gold-gradient hover:scale-105 hover:shadow-gold transition-all duration-300 text-lg px-10 py-7 h-auto font-semibold group animate-scale-in">
              <Link to="/contact" className="flex items-center gap-3">
                <span>Get Free Assessment</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-2 border-white/80 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-navy hover:scale-105 transition-all duration-300 text-lg px-10 py-7 h-auto font-semibold animate-scale-in">
              <Link to="/gallery" className="flex items-center gap-3">
                <span>View Our Work</span>
                <RefreshCw className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SandingRefinish;