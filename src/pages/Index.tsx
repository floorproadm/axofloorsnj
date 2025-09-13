import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Hero from "@/components/shared/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Star, ArrowRight, Award, Users, Clock, Shield } from "lucide-react";
import homeHero from "@/assets/home-hero.jpg";
import woodyMascot from "@/assets/woody-mascot.png";

const Index = () => {
  const services = [
    {
      title: "Hardwood Flooring",
      description: "Premium hardwood installation with expert craftsmanship and attention to detail.",
      href: "/hardwood-flooring",
      features: ["Premium Materials", "Expert Installation", "Lifetime Warranty"]
    },
    {
      title: "Sanding & Refinishing", 
      description: "Restore your floors to their original beauty with professional refinishing services.",
      href: "/sanding-and-refinish",
      features: ["Complete Restoration", "Dust-Free Process", "Quick Turnaround"]
    },
    {
      title: "Vinyl Plank Flooring",
      description: "Waterproof and durable luxury vinyl with the look of real hardwood.",
      href: "/vinyl-plank-flooring", 
      features: ["100% Waterproof", "Easy Maintenance", "Realistic Wood Look"]
    },
    {
      title: "Staircase Renovation",
      description: "Transform your staircase with custom hardwood steps and elegant railings.",
      href: "/staircase",
      features: ["Custom Design", "Safety First", "Premium Materials"]
    }
  ];

  const benefits = [
    { icon: Award, title: "35+ Google Reviews", description: "Consistent 5-star quality" },
    { icon: Users, title: "Expert Craftsmen", description: "Professional installation team" },
    { icon: Clock, title: "Quick Turnaround", description: "Efficient project completion" },
    { icon: Shield, title: "Guaranteed Quality", description: "100% satisfaction guarantee" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      text: "AXO Floors transformed our entire home. The attention to detail and professionalism was outstanding!",
      rating: 5
    },
    {
      name: "Mike Rodriguez", 
      text: "Best flooring company in NJ. Quality work, fair prices, and they finished ahead of schedule.",
      rating: 5
    },
    {
      name: "Lisa Chen",
      text: "The refinishing work on our hardwood floors exceeded expectations. Looks brand new!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      <Hero
        title="Your Flooring deserves the attention that only us can provide!"
        subtitle="Premium Flooring Solutions in New Jersey"
        description="Over time, flooring often fades and becomes damaged. However, with expert care and the right team by your side, this won't be a problem anymore."
        image={homeHero}
        showReviews={true}
      />

      {/* Services Section */}
      <section className="py-20 bg-grey-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              We have all the solutions you need to <span className="text-gradient-gold">renew your space!</span>
            </h2>
            <p className="text-lg text-grey max-w-3xl mx-auto leading-relaxed">
              We offer a wide range of services, from installation to finishing touches, guaranteeing that you achieve the modern, sophisticated, and elegant aesthetics you desire for your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-gold transition-smooth hover:-translate-y-2">
                <CardContent className="p-6">
                  <h3 className="text-xl font-heading font-semibold text-navy mb-3 group-hover:text-gold transition-smooth">
                    {service.title}
                  </h3>
                  <p className="text-grey mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-grey">
                        <CheckCircle className="w-4 h-4 text-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="w-full group-hover:bg-gold group-hover:text-navy group-hover:border-gold">
                    <Link to={service.href} className="flex items-center justify-center gap-2">
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
              Why Choose AXO Floors?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-full mb-4 group-hover:bg-gold group-hover:scale-110 transition-bounce">
                  <benefit.icon className="w-8 h-8 text-gold group-hover:text-white" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-2">
                  {benefit.title}
                </h3>
                <p className="text-grey">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 navy-gradient text-white relative overflow-hidden">
        <div className="absolute top-10 right-10 opacity-20">
          <img src={woodyMascot} alt="Woody" className="w-32 h-32" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">
              What Our Customers Say
            </h2>
            <p className="text-lg text-white/80">
              Don't just take our word for it - hear from satisfied homeowners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-white/90 mb-4 leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <p className="text-gold font-semibold">
                    - {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-navy mb-6">
            Ready to Transform Your Floors?
          </h2>
          <p className="text-lg text-grey mb-8 max-w-2xl mx-auto">
            If you're looking for durability, quality, and comfort for your everyday life, trust AXO Floors to deliver that!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gold-gradient hover:scale-105 transition-bounce text-lg px-8 py-6 h-auto">
              <Link to="/contact" className="flex items-center gap-2">
                Get Free Quote
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="text-lg px-8 py-6 h-auto">
              <a href="tel:(732) 351-8653">Call (732) 351-8653</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;