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
      "image": [
        "https://axofloorsnj.com/assets/hardwood-hero.jpg",
        "https://axofloorsnj.com/assets/before-after-comparison.png"
      ],
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
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday", 
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "08:00",
          "closes": "18:00"
        }
      ],
      "sameAs": [
        "https://www.google.com/maps/place/AXO+Floors+NJ"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "47"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Flooring Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Hardwood Floor Installation",
              "description": "Professional hardwood flooring installation for homes and businesses in New Jersey"
            },
            "areaServed": "New Jersey"
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Floor Refinishing",
              "description": "Expert hardwood floor refinishing and restoration services"
            },
            "areaServed": "New Jersey"
          }
        ]
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

  return (
    <Card className="bg-white shadow-lg border-gold/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-navy mb-2">{businessInfo.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(businessInfo.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold text-navy">{businessInfo.rating}</span>
              <span className="text-grey">({businessInfo.reviewCount} reviews)</span>
            </div>
          </div>
          <Button
            onClick={() => window.open(businessInfo.googleMapsUrl, '_blank')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on Maps
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-grey">
            <Phone className="w-4 h-4" />
            <a 
              href={`tel:${businessInfo.phone}`}
              className="hover:text-gold transition-colors"
            >
              {businessInfo.phone}
            </a>
          </div>
          
          <div className="flex items-center gap-3 text-grey">
            <MapPin className="w-4 h-4" />
            <span>{businessInfo.address}</span>
          </div>
          
          <div className="flex items-center gap-3 text-grey">
            <Clock className="w-4 h-4" />
            <span>{businessInfo.hours}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-grey/20">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => window.open(businessInfo.reviewUrl, '_blank')}
              className="gold-gradient text-black font-semibold flex-1"
            >
              Leave a Google Review
            </Button>
            <Button
              onClick={() => window.open(businessInfo.googleMapsUrl, '_blank')}
              variant="outline"
              className="flex-1"
            >
              Get Directions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleBusinessIntegration;