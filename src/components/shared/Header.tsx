import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Phone, ChevronDown, Facebook, Instagram, X } from "lucide-react";
import axoLogo from "@/assets/axo-logo.png";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";

const Header = () => {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Services", href: "#", hasDropdown: true },
    { name: "Contact", href: "/contact" },
    { name: "About", href: "/about" },
    { name: "Gallery", href: "/gallery" },
  ];

  const services = [
    { name: "Hardwood Flooring", href: "/hardwood-flooring" },
    { name: "Sanding & Refinish", href: "/sanding-and-refinish" },
    { name: "Vinyl Plank Flooring", href: "/vinyl-plank-flooring" },
    { name: "Staircase", href: "/staircase" },
    { name: "Base Boards", href: "/base-boards" },
  ];

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-gold text-black py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <a href="sms:(732) 351-8653?body=Hi! Interested in flooring quote from your website (yellow bar)" className="flex items-center gap-2 hover:opacity-80 transition-smooth font-semibold">
            <Phone className="h-4 w-4" />
            (732) 351-8653
          </a>
          <div className="flex items-center gap-2">
            <a 
              href="#" 
              className="w-8 h-8 bg-black text-gold flex items-center justify-center rounded hover:bg-black/80 transition-smooth"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 bg-black text-gold flex items-center justify-center rounded hover:bg-black/80 transition-smooth"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-black border-b border-white/10 shadow-elegant sticky top-0 z-[100] w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src={axoLogo} 
                alt="AXO Floors" 
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              {navigation.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  {item.hasDropdown ? (
                    <div 
                      className="relative"
                      onMouseEnter={() => setIsServicesOpen(true)}
                      onMouseLeave={() => setIsServicesOpen(false)}
                    >
                      <button className="flex items-center gap-1 text-white hover:text-gold font-medium transition-smooth">
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {isServicesOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-white/10 rounded-lg shadow-elegant z-50">
                          <div className="py-2">
                            {services.map((service) => (
                              <Link
                                key={service.name}
                                to={service.href}
                                className="block px-4 py-2 text-white hover:text-gold hover:bg-white/5 transition-smooth text-sm"
                              >
                                {service.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-white hover:text-gold font-medium transition-smooth"
                    >
                      {item.name}
                    </Link>
                  )}
                  {index < navigation.length - 1 && (
                    <span className="text-gold mx-4">|</span>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-white hover:text-gold transition-smooth p-2"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="fixed right-0 top-0 h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <AppSidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;