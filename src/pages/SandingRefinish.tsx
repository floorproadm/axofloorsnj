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
      title: "Assessment & Preparation",
      description: "We evaluate your floors and prepare the space for refinishing",
      icon: RefreshCw
    },
    {
      title: "Professional Sanding",
      description: "Dust-free sanding removes old finish and surface imperfections", 
      icon: Zap
    },
    {
      title: "Staining & Sealing",
      description: "Apply your chosen stain color and protective finish coats",
      icon: Sparkles
    },
    {
      title: "Final Inspection",
      description: "Quality check and curing time for perfect results",
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
        title="Professional Floor Sanding & Refinishing"
        subtitle="Restore Your Floors to Their Original Glory"
        description="Bring new life to your existing hardwood floors with our expert sanding and refinishing services. We use dust-free systems and premium finishes to deliver exceptional results."
        image={sandingHero}
      />

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
                Transform Your <span className="text-gradient-gold">Existing Floors</span>
              </h2>
              <p className="text-lg text-grey mb-8 leading-relaxed">
                Don't replace - refinish! Our professional sanding and refinishing service can make your old floors look brand new at a fraction of the cost of replacement.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-grey">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gold/10 p-6 rounded-lg mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-6 h-6 text-gold" />
                  <h3 className="font-heading font-semibold text-navy">Quick Turnaround</h3>
                </div>
                <p className="text-grey">Most projects completed in 2-3 days with minimal disruption to your daily routine.</p>
              </div>

              <Button asChild className="gold-gradient hover:scale-105 transition-bounce">
                <Link to="/contact" className="flex items-center gap-2">
                  Get Free Assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-grey-light p-6 rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-navy mb-2">70%</h3>
                  <p className="text-grey text-sm">Cost savings vs. replacement</p>
                </div>
                <div className="bg-grey-light p-6 rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-navy mb-2">100%</h3>
                  <p className="text-grey text-sm">Dust-free process</p>
                </div>
              </div>
              <div className="space-y-6 pt-12">
                <div className="bg-grey-light p-6 rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-navy mb-2">2-3</h3>
                  <p className="text-grey text-sm">Days typical completion</p>
                </div>
                <div className="bg-grey-light p-6 rounded-lg text-center">
                  <h3 className="text-2xl font-bold text-navy mb-2">15+</h3>
                  <p className="text-grey text-sm">Years added floor life</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Our Refinishing Process
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto">
              We use state-of-the-art equipment and proven techniques to deliver flawless results every time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <Card key={index} className="text-center group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold group-hover:scale-110 transition-bounce">
                    <step.icon className="w-8 h-8 text-gold group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-navy mb-3 group-hover:text-gold transition-smooth">
                    {step.title}
                  </h3>
                  <p className="text-grey leading-relaxed">
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
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-semibold text-navy mb-3 group-hover:text-gold transition-smooth">
                    {finish.name}
                  </h3>
                  <p className="text-grey mb-4 leading-relaxed">
                    {finish.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-gold" />
                    <span className="text-gold font-medium">Best for: {finish.best}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After CTA */}
      <section className="py-20 navy-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
            See the Transformation
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Ready to restore your floors to their former glory? Contact us today for a free assessment and quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                Get Free Assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-white text-white hover:bg-white hover:text-navy text-lg px-8 py-6 h-auto">
              <Link to="/gallery">View Our Work</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SandingRefinish;