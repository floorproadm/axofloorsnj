import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import woodyMascot from "@/assets/woody-mascot.png";

const Footer = () => {
  const services = [
    { name: "Hardwood Flooring", href: "/hardwood-flooring" },
    { name: "Sanding & Refinish", href: "/sanding-and-refinish" },
    { name: "Vinyl Plank Flooring", href: "/vinyl-plank-flooring" },
    { name: "Staircase Renovation", href: "/staircase" },
    { name: "Base Boards", href: "/base-boards" },
  ];

  return (
    <footer className="navy-gradient text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="text-xl sm:text-2xl font-heading font-bold text-gold">
                •AXO•
                <span className="block text-xs sm:text-sm font-medium tracking-wider text-white">FLOORS</span>
              </div>
              <img src={woodyMascot} alt="Woody Mascot" className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto sm:max-w-none sm:mx-0">
              Premium flooring solutions in New Jersey. Your floors deserve the attention that only we can provide!
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-gold">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-sm">⭐</span>
              ))}
              <span className="text-white/80 text-xs sm:text-sm ml-1 sm:ml-2">35+ Reviews</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-heading font-semibold text-gold">Services</h3>
            <ul className="space-y-1 sm:space-y-2">
              {services.map((service) => (
                <li key={service.name}>
                  <Link 
                    to={service.href}
                    className="text-white/80 hover:text-gold transition-smooth text-sm block"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-heading font-semibold text-gold">Contact</h3>
            <div className="space-y-2 sm:space-y-3">
              <a 
                href="tel:(732) 351-8653"
                className="flex items-center justify-center sm:justify-start gap-2 text-white/80 hover:text-gold transition-smooth text-sm"
              >
                <Phone className="w-4 h-4" />
                (732) 351-8653
              </a>
              <a 
                href="mailto:contact@axofloorsnj.com"
                className="flex items-center justify-center sm:justify-start gap-2 text-white/80 hover:text-gold transition-smooth text-sm break-all"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                contact@axofloorsnj.com
              </a>
              <div className="flex items-start justify-center sm:justify-start gap-2 text-white/80 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Serving all of New Jersey</span>
              </div>
            </div>
          </div>

          {/* Hours & Links */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-heading font-semibold text-gold">Hours</h3>
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-white/80 text-sm">
                <Clock className="w-4 h-4" />
                <span>Mon - Fri: 8AM - 6PM</span>
              </div>
              <div className="text-white/80 text-sm">
                Sat: 9AM - 4PM
              </div>
              <div className="text-white/80 text-sm">
                Sun: By Appointment
              </div>
            </div>
            <div className="pt-2 sm:pt-4">
              <Link 
                to="/gallery"
                className="text-gold hover:text-white transition-smooth font-medium text-sm inline-block"
              >
                View Our Gallery →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center">
          <p className="text-white/60 text-xs sm:text-sm px-2">
            © 2024 AXO Floors. All rights reserved. Premium flooring services in New Jersey.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;