import { useEffect } from 'react';
import { Star, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
const GoogleBusinessIntegration = () => {
  useEffect(() => {
    // Google My Business Rich Snippets
    const businessData = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "AXO Floors NJ",
      "image": ["https://axofloorsnj.com/assets/hardwood-hero.jpg", "https://axofloorsnj.com/assets/before-after-comparison.png"],
      "@id": "https://axofloorsnj.com",
      "url": "https://axofloorsnj.com",
      "telephone": "+17323518653",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "",
        "addressLocality": "New Jersey",
        "addressRegion": "NJ",
        "postalCode": "",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 40.0583,
        "longitude": -74.4057
      },
      "openingHoursSpecification": [{
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "08:00",
        "closes": "18:00"
      }],
      "sameAs": ["https://www.google.com/maps/place/AXO+Floors+NJ"],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "47"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Flooring Services",
        "itemListElement": [{
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Hardwood Floor Installation",
            "description": "Professional hardwood flooring installation for homes and businesses in New Jersey"
          },
          "areaServed": "New Jersey"
        }, {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Floor Refinishing",
            "description": "Expert hardwood floor refinishing and restoration services"
          },
          "areaServed": "New Jersey"
        }]
      }
    };

    // Inject structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(businessData);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  const businessInfo = {
    name: "AXO Floors NJ",
    rating: 4.9,
    reviewCount: 47,
    phone: "(732) 351-8653",
    address: "Serving all Tri-state",
    hours: "Mon-Sat: 8:00 AM - 6:00 PM",
    googleMapsUrl: "https://maps.google.com/?q=AXO+Floors+NJ",
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJExample"
  };
  return <Card className="bg-white shadow-lg border-gold/20">
      
    </Card>;
};
export default GoogleBusinessIntegration;