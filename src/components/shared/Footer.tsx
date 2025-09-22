import { Link } from "react-router-dom";
import { Phone, Mail, Facebook, Instagram } from "lucide-react";
const Footer = () => {
  const navigationLinks = [{
    name: "Services",
    href: "#"
  }, {
    name: "Contact",
    href: "/contact"
  }, {
    name: "About",
    href: "/about"
  }, {
    name: "Gallery",
    href: "/gallery"
  }];
  return <footer className="bg-black text-white">
      {/* Inspirational Section */}
      <div className="bg-black py-8 sm:py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="h-1 w-16 bg-gold mx-auto mb-6"></div>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Your satisfaction is our priority. Custom solutions and seamless service make your dream home a reality.
          </p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="bg-black border-t border-white/10">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Company Logo & Tagline */}
            <div className="text-center lg:text-left">
              <div className="text-3xl sm:text-4xl font-heading font-bold text-white mb-2">
                <span className="text-gold">•</span>AXO<span className="text-gold">•</span>
                <div className="text-sm font-medium tracking-[0.2em] text-white">FLOORS</div>
              </div>
              <p className="text-white/80 text-sm mt-4">
                We bring your vision to life
              </p>
            </div>

            {/* Navigation Links */}
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-heading font-semibold text-white mb-4">Useful Links</h3>
              <ul className="space-y-2">
                {navigationLinks.map(link => <li key={link.name}>
                    <Link to={link.href} className="text-white/80 hover:text-gold transition-smooth text-sm block">
                      {link.name}
                    </Link>
                  </li>)}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-heading font-semibold text-white mb-4">Useful Links</h3>
              <div className="space-y-3">
                <a href="tel:(732) 351-8653" className="flex items-center justify-center lg:justify-start gap-2 text-gold hover:text-white transition-smooth text-sm">
                  <Phone className="w-4 h-4" />
                  (732) 351-8653
                </a>
                <a href="mailto:contact@axofloorsnj.com" className="flex items-center justify-center lg:justify-start gap-2 text-gold hover:text-white transition-smooth text-sm">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  contact@axofloorsnj.com
                </a>
              </div>
            </div>
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-white/10">
            <a href="#" className="w-10 h-10 bg-gold text-black flex items-center justify-center rounded-sm hover:bg-gold/80 transition-smooth">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 bg-gold text-black flex items-center justify-center rounded-sm hover:bg-gold/80 transition-smooth">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="tel:(732) 351-8653" className="w-10 h-10 bg-gold text-black flex items-center justify-center rounded-sm hover:bg-gold/80 transition-smooth">
              <Phone className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center mt-6 pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm">
              2024 | All Rights Reserved - Axo Floors LLC
              <span className="mx-2">•</span>
              <Link to="/auth" className="text-white/40 hover:text-gold transition-smooth text-xs">
                Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;