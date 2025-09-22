import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
}

const SEOHead = ({ 
  title = "AXO Floors NJ - Professional Hardwood Flooring Installation & Refinishing",
  description = "Expert hardwood flooring services in New Jersey. Professional installation, refinishing, and restoration. Free estimates, licensed & insured. Call (732) 351-8653",
  keywords = "hardwood flooring NJ, floor refinishing New Jersey, flooring installation, wood floor restoration, AXO Floors",
  canonical,
  image = "https://axofloorsnj.com/og-image.jpg"
}: SEOHeadProps) => {
  const location = useLocation();
  const currentUrl = `https://axofloorsnj.com${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    const updateMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    const updateProperty = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('robots', 'index, follow');

    // Open Graph
    updateProperty('og:title', title);
    updateProperty('og:description', description);
    updateProperty('og:url', currentUrl);
    updateProperty('og:image', image);
    updateProperty('og:type', 'website');
    updateProperty('og:site_name', 'AXO Floors NJ');

    // Twitter
    updateProperty('twitter:card', 'summary_large_image');
    updateProperty('twitter:title', title);
    updateProperty('twitter:description', description);
    updateProperty('twitter:image', image);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

  }, [title, description, keywords, currentUrl, canonicalUrl, image]);

  return null;
};

export default SEOHead;