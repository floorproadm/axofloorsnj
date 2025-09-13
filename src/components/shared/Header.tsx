import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, Phone, Mail } from "lucide-react";
import axoLogo from "@/assets/axo-logo.png";

const Header = () => {

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Hardwood Flooring", href: "/hardwood-flooring" },
    { name: "Sanding & Refinish", href: "/sanding-and-refinish" },
    { name: "Vinyl Plank", href: "/vinyl-plank-flooring" },
    { name: "Staircase", href: "/staircase" },
    { name: "Base Boards", href: "/base-boards" },
    { name: "Gallery", href: "/gallery" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* Top Contact Bar */}
      <div className="bg-gold text-navy py-2 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm font-medium">
          <div className="flex items-center gap-4 mb-2 sm:mb-0">
            <a href="mailto:contact@axofloorsnj.com" className="flex items-center gap-1 hover:opacity-80 transition-smooth">
              <Mail className="h-4 w-4" />
              contact@axofloorsnj.com
            </a>
            <a href="tel:(732) 351-8653" className="flex items-center gap-1 hover:opacity-80 transition-smooth">
              <Phone className="h-4 w-4" />
              (732) 351-8653
            </a>
          </div>
          <div className="text-navy font-semibold">35+ Google Reviews ⭐⭐⭐⭐⭐</div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-black border-b border-white/10 shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src={axoLogo} 
                alt="AXO Floors" 
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-white hover:text-gold font-medium transition-smooth"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Button variant="outline" asChild className="border-white text-white hover:bg-white hover:text-black">
                <Link to="/contact">Get Quote</Link>
              </Button>
              <Button asChild className="gold-gradient">
                <a href="tel:(732) 351-8653">Call Now</a>
              </Button>
            </div>

            {/* Mobile Menu Trigger */}
            <SidebarTrigger className="lg:hidden text-white hover:text-gold">
              <Menu className="h-6 w-6" />
            </SidebarTrigger>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;