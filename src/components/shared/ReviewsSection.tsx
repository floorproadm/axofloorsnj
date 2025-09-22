import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const ReviewsSection = () => {
  const reviews = [
    {
      id: 1,
      name: "Maria Santos",
      location: "Newark, NJ",
      rating: 5,
      date: "2024-01-15",
      text: "Exceptional work! AXO Floors transformed our old hardwood floors completely. Eduardo and his team were professional, punctual, and the results exceeded our expectations. Highly recommended!",
      service: "Floor Refinishing"
    },
    {
      id: 2,
      name: "John Mitchell",
      location: "Jersey City, NJ", 
      rating: 5,
      date: "2024-02-08",
      text: "Outstanding service from start to finish. The new hardwood installation looks amazing and the crew was incredibly clean and respectful of our home. Worth every penny!",
      service: "Hardwood Installation"
    },
    {
      id: 3,
      name: "Lisa Rodriguez",
      location: "Elizabeth, NJ",
      rating: 5,
      date: "2024-02-20",
      text: "AXO Floors saved our damaged floors! The sanding and refinishing work brought them back to life. Professional service, fair pricing, and beautiful results.",
      service: "Floor Restoration"
    },
    {
      id: 4,
      name: "David Chen",
      location: "Hoboken, NJ",
      rating: 5,
      date: "2024-03-05",
      text: "Fantastic experience with AXO Floors. Eduardo provided excellent guidance on wood selection and the installation was flawless. Our home value definitely increased!",
      service: "New Installation"
    },
    {
      id: 5,
      name: "Sarah Johnson",
      location: "Paterson, NJ",
      rating: 5,
      date: "2024-03-12",
      text: "I'm amazed by the transformation! The team was professional, finished on time, and cleaned up perfectly. The floors look better than when our house was new.",
      service: "Complete Refinishing"
    },
    {
      id: 6,
      name: "Roberto Silva",
      location: "Union City, NJ",
      rating: 5,
      date: "2024-03-18",
      text: "AXO Floors exceeded all expectations. Great communication, quality work, and reasonable prices. I've already recommended them to three neighbors!",
      service: "Hardwood Repair"
    }
  ];

  const handleGoogleReview = () => {
    window.open('https://search.google.com/local/writereview?placeid=ChIJExample', '_blank');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-navy mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-grey max-w-2xl mx-auto mb-6">
            Don't just take our word for it. See why homeowners across New Jersey trust AXO Floors with their most important flooring projects.
          </p>
          
          {/* Overall Rating Display */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <div className="flex">
                {renderStars(5)}
              </div>
              <span className="text-2xl font-bold text-navy">4.9</span>
            </div>
            <div className="text-grey">
              <span className="font-semibold">47+ Reviews</span> on Google
            </div>
            <Button
              onClick={handleGoogleReview}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View on Google
            </Button>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-navy">{review.name}</h4>
                    <p className="text-sm text-grey">{review.location}</p>
                    <p className="text-xs text-gold font-medium">{review.service}</p>
                  </div>
                  <Quote className="w-6 h-6 text-gold/30 flex-shrink-0" />
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-grey">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-grey text-sm leading-relaxed">
                  "{review.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gold/10 border border-gold/20 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-navy mb-4">
              Join Our Happy Customers
            </h3>
            <p className="text-grey mb-6">
              Ready to transform your floors? Get a free estimate and see why we're New Jersey's most trusted flooring experts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = 'tel:(732)351-8653'}
                className="gold-gradient text-black font-semibold"
              >
                Call (732) 351-8653
              </Button>
              <Button
                onClick={handleGoogleReview}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-black"
              >
                Leave a Review
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Data for Reviews */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "AXO Floors NJ",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "47"
            },
            "review": reviews.map(review => ({
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": review.name
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": review.rating,
                "bestRating": "5"
              },
              "reviewBody": review.text,
              "datePublished": review.date
            }))
          })
        }}
      />
    </section>
  );
};

export default ReviewsSection;