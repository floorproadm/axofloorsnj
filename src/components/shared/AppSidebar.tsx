import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AppSidebarProps {
  onClose: () => void;
}

const services = [
  { name: "Hardwood Flooring Installation", href: "/hardwood-flooring" },
  { name: "Sanding And Refinish", href: "/sanding-and-refinish" },
  { name: "Vinyl Plank Flooring", href: "/vinyl-plank-flooring" },
  { name: "Staircase", href: "/staircase" },
  { name: "Base Boards", href: "/base-boards" },
];

const mainNavigation = [
  { name: "Contact", href: "/contact" },
  { name: "About", href: "/about" },
  { name: "Gallery", href: "/gallery" },
];

export function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation();
  const [servicesOpen, setServicesOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const hasActiveService = services.some(service => isActive(service.href));

  const closeSidebar = () => onClose();

  return (
    <div className="w-full max-w-sm bg-black border-r border-white/10 h-full flex flex-col">
      <div className="bg-black border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeSidebar} className="flex items-center">
            <div className="text-xl sm:text-2xl font-heading font-bold text-white">
              <span className="text-gold">•</span>AXO<span className="text-gold">•</span>
              <div className="text-xs font-medium tracking-[0.2em] text-white -mt-1">FLOORS</div>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSidebar}
            className="text-white hover:bg-white/10 p-2 touch-target"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="bg-black flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-1">
            {/* Services with submenu */}
            <div>
              <Collapsible open={servicesOpen || hasActiveService} onOpenChange={setServicesOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between text-white hover:text-gold hover:bg-white/5 text-mobile-base py-4 px-4 rounded transition-smooth touch-target">
                    <span>Services</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen || hasActiveService ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 space-y-1">
                  {services.map((service) => (
                    <Link
                      key={service.name}
                      to={service.href}
                      onClick={closeSidebar}
                      className={`block text-white/80 hover:text-gold hover:bg-white/5 py-3 px-4 rounded transition-smooth text-mobile-sm touch-target ${isActive(service.href) ? 'text-gold bg-white/5' : ''}`}
                    >
                      {service.name}
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Main navigation */}
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={closeSidebar}
                className={`block text-white hover:text-gold hover:bg-white/5 text-mobile-base py-4 px-4 rounded transition-smooth touch-target ${isActive(item.href) ? 'text-gold bg-white/5' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black border-t border-white/10 p-4">
        <Button asChild className="gold-gradient w-full font-semibold mb-2">
          <a href="tel:(732) 351-8653" onClick={closeSidebar}>
            GET A QUOTE
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full border-gold text-gold hover:bg-gold hover:text-black">
          <Link to="/contact" onClick={closeSidebar}>
            CONTACT US
          </Link>
        </Button>
        
        <div className="text-center mt-4 text-white/80">
          <div className="flex items-center justify-center gap-1 text-sm">
            <span>Google</span>
            <div className="flex text-gold">
              ★★★★★
            </div>
            <span>35+ Reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}