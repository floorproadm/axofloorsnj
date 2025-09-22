import { useEffect } from 'react';
import { getSecurityHeaders } from '@/utils/security-monitoring';

// Component to set security headers via meta tags for additional protection
export const SecurityHeaders = () => {
  useEffect(() => {
    const securityHeaders = getSecurityHeaders();
    
    // Set security-related meta tags
    const setMetaTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[http-equiv="${name}"]`) as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.httpEquiv = name;
        document.head.appendChild(metaTag);
      }
      metaTag.content = content;
    };

    // Set Content Security Policy via meta tag (as fallback)
    setMetaTag('Content-Security-Policy', securityHeaders['Content-Security-Policy']);
    
    // Set other security headers via meta tags where possible
    setMetaTag('X-Content-Type-Options', securityHeaders['X-Content-Type-Options']);
    setMetaTag('Referrer-Policy', securityHeaders['Referrer-Policy']);
    
    // Add viewport meta tag for responsive design
    let viewportTag = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewportTag) {
      viewportTag = document.createElement('meta');
      viewportTag.name = 'viewport';
      viewportTag.content = 'width=device-width, initial-scale=1.0';
      document.head.appendChild(viewportTag);
    }

    // Add security-related meta tags
    const securityMetaTags = [
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'msapplication-TileColor', content: '#0C1C2E' },
      { name: 'theme-color', content: '#0C1C2E' }
    ];

    securityMetaTags.forEach(({ name, content }) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = name;
        metaTag.content = content;
        document.head.appendChild(metaTag);
      }
    });

    // Log security headers application (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY] Security headers applied:', Object.keys(securityHeaders));
    }
  }, []);

  return null; // This component doesn't render anything
};

export default SecurityHeaders;