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
    <div className="w-full h-full max-w-xs bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <Link to="/" onClick={closeSidebar} className="flex items-center">
          <div className="text-lg font-heading font-bold text-white">
            <span className="text-gold">•</span>AXO<span className="text-gold">•</span>
            <div className="text-[10px] font-medium tracking-[0.15em] text-white -mt-0.5">FLOORS</div>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={closeSidebar}
          className="text-white hover:bg-white/10 h-10 w-10 p-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {/* Services with submenu */}
          <div>
            <Collapsible open={servicesOpen || hasActiveService} onOpenChange={setServicesOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between text-white hover:text-gold hover:bg-white/5 py-3 px-3 rounded-lg transition-smooth">
                  <span className="font-medium">Services</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen || hasActiveService ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 ml-3 space-y-1">
                {services.map((service) => (
                  <Link
                    key={service.name}
                    to={service.href}
                    onClick={closeSidebar}
                    className={`block text-white/80 hover:text-gold hover:bg-white/5 py-2.5 px-3 rounded-lg transition-smooth text-sm ${isActive(service.href) ? 'text-gold bg-white/5' : ''}`}
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
              className={`block text-white hover:text-gold hover:bg-white/5 py-3 px-3 rounded-lg transition-smooth font-medium ${isActive(item.href) ? 'text-gold bg-white/5' : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <Button asChild className="gold-gradient w-full font-semibold h-12">
          <a href="tel:(732) 351-8653" onClick={closeSidebar}>
            GET A QUOTE
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full border-gold text-gold hover:bg-gold hover:text-black h-12">
          <Link to="/contact" onClick={closeSidebar}>
            CONTACT US
          </Link>
        </Button>
        
        <div className="text-center text-white/80 pt-2">
          <div className="flex items-center justify-center gap-1 text-xs">
            <span>Google</span>
            <div className="flex text-gold text-sm">
              ★★★★★
            </div>
            <span>35+ Reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}