import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, Mail } from "lucide-react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

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
      <header className="bg-background border-b shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-heading font-bold text-navy">
                •AXO•
                <span className="block text-sm font-medium tracking-wider">FLOORS</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-navy hover:text-gold font-medium transition-smooth"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/contact">Get Quote</Link>
              </Button>
              <Button asChild className="gold-gradient">
                <a href="tel:(732) 351-8653">Call Now</a>
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-lg font-medium text-navy hover:text-gold transition-smooth"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="flex flex-col gap-3 mt-6">
                    <Button variant="outline" asChild>
                      <Link to="/contact" onClick={() => setIsOpen(false)}>Get Quote</Link>
                    </Button>
                    <Button asChild className="gold-gradient">
                      <a href="tel:(732) 351-8653">Call Now</a>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;