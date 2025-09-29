import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Award, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import teamPhoto from "@/assets/team-photo.jpg";

const About = () => {
  const values = [
    {
      icon: Award,
      title: "Quality Excellence",
      description: "We use only premium materials and proven installation techniques to ensure lasting results."
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Our certified flooring specialists bring years of experience to every project."
    },
    {
      icon: Clock,
      title: "Timely Service",
      description: "We respect your time and complete projects on schedule without compromising quality."
    },
    {
      icon: CheckCircle,
      title: "Customer Satisfaction",
      description: "Your satisfaction is our priority, backed by our comprehensive warranty."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-black text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                About <span className="text-gold">AXO Floors</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed">
                With over a decade of experience, AXO Floors has been transforming homes and businesses 
                throughout the tri-state area (NJ, NY & PA) with premium flooring solutions and exceptional craftsmanship.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Team Photo */}
              <div className="flex flex-col items-center mb-16">
                <div className="w-80 h-96 sm:w-96 sm:h-[28rem] mx-auto mb-6 rounded-2xl overflow-hidden shadow-elegant border-4 border-gold/20">
                  <img 
                    src={teamPhoto} 
                    alt="Ademir and Eduardo - AXO Floors Team" 
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground mt-4">Father and son, side by side, bringing dedication and precision to every floor we touch.</p>
                </div>
              </div>
              
              {/* Team Members */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 mb-16">
                {/* Ademir */}
                <Card className="p-6 md:p-8 border-2 border-gold/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-gradient-to-br from-background to-muted/20">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Ademir</h3>
                        <p className="text-gold font-medium">Owner</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      With over 15 years of hands-on experience, Ademir brings the precision and 
                      craftsmanship hardwood services across tri-state homes. He specializes in 
                      sanding, staining, and hardwood installation — helping families protect their 
                      investment with floors that are both durable and elegant.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                      Ademir's mission is simple: deliver results that last, with honesty and care 
                      in every detail, so customers can enjoy their floors for years to come.
                    </p>
                  </CardContent>
                </Card>

                {/* Eduardo */}
                <Card className="p-6 md:p-8 border-2 border-gold/20 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl bg-gradient-to-br from-background to-muted/20">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold">Eduardo</h3>
                        <p className="text-gold font-medium">General Manager</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Following in his father's footsteps, Eduardo has been in the flooring industry 
                      for 9 years. He focuses on guiding customers through every decision — from stain 
                      colors to finish options — so they feel confident before work even begins.
                    </p>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                      Known for his precision and customer-first approach, Eduardo has supported dozens 
                      of homeowners across NJ, NY, and PA, earning a reputation for excellence and reliability. 
                      His passion: making sure every client sees exactly how their new floor will look 
                      before the job is done — and walking away knowing they made the right choice.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Together Section */}
              <Card className="bg-muted/50 p-6 md:p-8">
                <CardContent className="p-0 text-center">
                  <h3 className="text-2xl font-bold mb-6">Together</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                    AXO Floors is more than a family business — it's a promise of craftsmanship, 
                    honesty, and lasting beauty. Whether restoring old floors or creating something new, 
                    our goal is always the same: deliver a result you'll be proud to walk on every day.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">Why Choose AXO Floors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6 text-gold" />
                      </div>
                      <h3 className="font-semibold mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-black text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-4xl font-bold mb-6">
                Ready to see how your floors can look?
              </h2>
              <p className="text-lg text-white/80 mb-8">
                Request your free in-home consultation today and let us show you 
                the possibilities for your space.
              </p>
              <Button asChild size="lg" className="gold-gradient hover:scale-105 transition-bounce">
                <Link to="/contact">
                  Get Your Free Consultation
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24 bg-black text-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">500+</div>
                <div className="text-white/80">Projects Completed</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">10+</div>
                <div className="text-white/80">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">35+</div>
                <div className="text-white/80">Google Reviews</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">100%</div>
                <div className="text-white/80">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;