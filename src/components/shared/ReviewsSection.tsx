import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
const ReviewsSection = () => {
  const reviews = [{
    id: 1,
    name: "Maria Santos",
    location: "Newark, NJ",
    rating: 5,
    date: "2024-01-15",
    text: "Exceptional work! AXO Floors transformed our old hardwood floors completely. Eduardo and his team were professional, punctual, and the results exceeded our expectations. Highly recommended!",
    service: "Floor Refinishing"
  }, {
    id: 2,
    name: "John Mitchell",
    location: "Jersey City, NJ",
    rating: 5,
    date: "2024-02-08",
    text: "Outstanding service from start to finish. The new hardwood installation looks amazing and the crew was incredibly clean and respectful of our home. Worth every penny!",
    service: "Hardwood Installation"
  }, {
    id: 3,
    name: "Lisa Rodriguez",
    location: "Elizabeth, NJ",
    rating: 5,
    date: "2024-02-20",
    text: "AXO Floors saved our damaged floors! The sanding and refinishing work brought them back to life. Professional service, fair pricing, and beautiful results.",
    service: "Floor Restoration"
  }, {
    id: 4,
    name: "David Chen",
    location: "Hoboken, NJ",
    rating: 5,
    date: "2024-03-05",
    text: "Fantastic experience with AXO Floors. Eduardo provided excellent guidance on wood selection and the installation was flawless. Our home value definitely increased!",
    service: "New Installation"
  }, {
    id: 5,
    name: "Sarah Johnson",
    location: "Paterson, NJ",
    rating: 5,
    date: "2024-03-12",
    text: "I'm amazed by the transformation! The team was professional, finished on time, and cleaned up perfectly. The floors look better than when our house was new.",
    service: "Complete Refinishing"
  }, {
    id: 6,
    name: "Roberto Silva",
    location: "Union City, NJ",
    rating: 5,
    date: "2024-03-18",
    text: "AXO Floors exceeded all expectations. Great communication, quality work, and reasonable prices. I've already recommended them to three neighbors!",
    service: "Hardwood Repair"
  }];
  const handleGoogleReview = () => {
    window.open('https://search.google.com/local/writereview?placeid=ChIJExample', '_blank');
  };
  const renderStars = (rating: number) => {
    return Array.from({
      length: 5
    }, (_, i) => <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />);
  };
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-navy mb-4 sm:mb-6 px-2">
            What Our <span className="text-gradient-gold">Customers Say</span>
          </h2>
          <p className="text-base sm:text-lg text-grey max-w-3xl mx-auto leading-relaxed px-2">
            Don't just take our word for it. Here's what homeowners across New Jersey are saying about their AXO Floors experience.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {reviews.slice(0, 6).map((review) => (
            <Card key={review.id} className="bg-grey-light border-0 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-xs text-grey">{review.service}</span>
                </div>
                
                <Quote className="w-8 h-8 text-gold mb-3" />
                
                <p className="text-grey text-sm leading-relaxed mb-4 line-clamp-4">
                  "{review.text}"
                </p>
                
                <div className="border-t border-grey/20 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-navy text-sm">{review.name}</p>
                      <p className="text-xs text-grey">{review.location}</p>
                    </div>
                    <p className="text-xs text-grey">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Google Review CTA */}
        <div className="text-center">
          <Button 
            onClick={handleGoogleReview}
            className="gold-gradient hover:scale-105 transition-all duration-200 inline-flex items-center gap-2"
          >
            Leave us a Google Review
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
export default ReviewsSection;