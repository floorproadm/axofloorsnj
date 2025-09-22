import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Award, Users, Clock } from "lucide-react";
const About = () => {
  const values = [{
    icon: Award,
    title: "Quality Excellence",
    description: "We use only premium materials and proven installation techniques to ensure lasting results."
  }, {
    icon: Users,
    title: "Expert Team",
    description: "Our certified flooring specialists bring years of experience to every project."
  }, {
    icon: Clock,
    title: "Timely Service",
    description: "We respect your time and complete projects on schedule without compromising quality."
  }, {
    icon: CheckCircle,
    title: "Customer Satisfaction",
    description: "Your satisfaction is our priority, backed by our comprehensive warranty."
  }];
  return <div className="min-h-screen bg-background">
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
                throughout New Jersey with premium flooring solutions and exceptional craftsmanship.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">Our Story</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="text-center mb-8">
                  Founded with a passion for excellence, AXO Floors began as a small family business 
                  with a simple mission: to provide New Jersey homeowners with beautiful, durable 
                  flooring solutions that stand the test of time.
                </p>
                <p className="text-center">
                  Today, we're proud to be one of the region's most trusted flooring contractors, 
                  with hundreds of satisfied customers and a reputation built on quality, reliability, 
                  and exceptional service.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">Why Choose AXO Floors</h2>
            
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
    </div>;
};
export default About;