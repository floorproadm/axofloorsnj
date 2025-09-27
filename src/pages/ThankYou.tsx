import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { CheckCircle, Phone, Mail, Calendar, ArrowRight, Home, Gift } from "lucide-react";
import { toast } from "@/hooks/use-toast";
interface QuizData {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  squareFootage: string;
  budget: string;
}
const ThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  useEffect(() => {
    // Get quiz data from navigation state
    const data = location.state?.quizData;
    if (data) {
      setQuizData(data);
    } else {
      // If no data, redirect to home
      navigate("/");
    }
  }, [location.state, navigate]);
  const getServiceName = (serviceType: string) => {
    return serviceType === "new-installation" ? "New Floor Installation" : "Floor Refinishing";
  };
  const getBudgetRange = (budget: string) => {
    switch (budget) {
      case "under-2k":
        return "Under $2,000";
      case "2k-5k":
        return "$2,000 - $5,000";
      case "5k-10k":
        return "$5,000 - $10,000";
      case "10k-plus":
        return "$10,000+";
      default:
        return "Not specified";
    }
  };
  const getRecommendedService = () => {
    if (!quizData) return "/";
    if (quizData.serviceType === "new-installation") {
      return "/hardwood-flooring";
    }
    return "/sanding-and-refinish";
  };
  if (!quizData) {
    return <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-grey">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-navy mb-4">
                Thank You, {quizData.name}!
              </h1>
              <p className="text-lg sm:text-xl text-grey mb-4">
                We've received your information and will be in touch within 24 hours with personalized recommendations for your project.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* What's Next */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-2 border-gold/20 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-2xl font-heading text-navy flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-gold" />
                      What Happens Next
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 bg-gold/5 rounded-lg">
                        <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-semibold text-sm">1</div>
                        <div>
                          <h3 className="font-semibold text-navy">Personalized Consultation</h3>
                          <p className="text-grey text-sm">
                            Our flooring expert will call you within 24 hours to discuss your specific needs and provide tailored recommendations.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-gold/5 rounded-lg">
                        <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-semibold text-sm">
                          2
                        </div>
                        <div>
                          <h3 className="font-semibold text-navy">Free In-Home Estimate</h3>
                          <p className="text-grey text-sm">
                            We'll schedule a convenient time to visit your home and provide a detailed, no-obligation estimate.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-gold/5 rounded-lg">
                        <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-semibold text-sm">
                          3
                        </div>
                        <div>
                          <h3 className="font-semibold text-navy">Professional Installation</h3>
                          <p className="text-grey text-sm">
                            Once you approve, our skilled craftsmen will transform your floors with precision and care.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-grey/20">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={() => navigate(getRecommendedService())} className="gold-gradient text-black font-semibold flex-1">
                          Learn More About Your Service
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                          <Home className="w-4 h-4 mr-2" />
                          Back to Home
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Summary & Contact */}
              <div className="space-y-6">
                {/* Project Summary */}
                <Card className="bg-white border-2 border-gold/20 shadow-elegant">
                  <CardHeader>
                    <CardTitle className="text-xl font-heading text-navy">
                      Your Project Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-grey">Service Type</p>
                      <p className="font-medium text-navy">{getServiceName(quizData.serviceType)}</p>
                    </div>
                    
                    {quizData.squareFootage && <div>
                        <p className="text-sm text-grey">Area Size</p>
                        <p className="font-medium text-navy">{quizData.squareFootage} sq ft</p>
                      </div>}

                    {quizData.budget && <div>
                        <p className="text-sm text-grey">Budget Range</p>
                        <p className="font-medium text-navy">{getBudgetRange(quizData.budget)}</p>
                      </div>}

                    <div>
                      <p className="text-sm text-grey">Contact Email</p>
                      <p className="font-medium text-navy">{quizData.email}</p>
                    </div>

                    <div>
                      <p className="text-sm text-grey">Phone Number</p>
                      <p className="font-medium text-navy">{quizData.phone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contact */}
                <Card className="bg-navy text-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-heading flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gold" />
                      Need to Talk Now?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm mb-4">
                      Have urgent questions? Give us a call directly.
                    </p>
                    <div className="space-y-3">
                      <a href="tel:(732) 351-8653" className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors">
                        <Phone className="w-4 h-4" />
                        (732) 351-8653
                      </a>
                      <a href="mailto:axofloorsnj@gmail.com" className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors">
                        <Mail className="w-4 h-4" />
                        axofloorsnj@gmail.com
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral CTA Section */}
      <section className="py-16 bg-gold/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-gold/20 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Content */}
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-gold" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-navy">
                      Know Someone Who Needs New Floors?
                    </h2>
                  </div>
                  
                  <p className="text-grey mb-6 leading-relaxed">
                    Share your great experience and <strong className="text-navy">earn 1% when you refer</strong> friends, 
                    family, or neighbors to AXO Floors. There's no limit to how much you can earn!
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      <span className="text-grey">Your friends get VIP treatment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      <span className="text-grey">You get 1% of their project value</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      <span className="text-grey">No limits on earnings</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      console.log('[Referral CTA] Thank you page - Learn more clicked');
                      navigate("/referral-program");
                    }}
                    className="gold-gradient text-black font-semibold w-full sm:w-auto"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Learn More & Start Earning
                  </Button>
                </div>
                
                {/* Visual Element */}
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gold mb-2">1%</div>
                    <p className="text-navy font-medium mb-4">of every referral</p>
                    <div className="space-y-2 text-sm text-grey">
                      <div>$5K project = <span className="font-semibold text-gold">$50 for you</span></div>
                      <div>$15K project = <span className="font-semibold text-gold">$150 for you</span></div>
                      <div>$25K project = <span className="font-semibold text-gold">$250 for you</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default ThankYou;