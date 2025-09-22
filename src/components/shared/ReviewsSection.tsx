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
  return;
};
export default ReviewsSection;