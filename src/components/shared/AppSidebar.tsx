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
  const [servicesOpen, setServicesOpen] = useState(true); // Aberto por padrão

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-80 h-full bg-black shadow-2xl flex flex-col">
      {/* Header Compacto */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <Link to="/" onClick={onClose} className="flex items-center">
          <div className="text-white">
            <div className="text-xl font-heading font-bold">
              <span className="text-gold">•</span>AXO<span className="text-gold">•</span>
            </div>
            <div className="text-xs font-medium tracking-wider -mt-1">FLOORS</div>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="text-white hover:text-gold p-2 rounded-full hover:bg-white/10 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu de Navegação */}
      <div className="flex-1 overflow-y-auto py-4">
        
        {/* Serviços */}
        <div className="px-3 mb-4">
          <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between text-white hover:text-gold py-3 px-4 rounded-xl hover:bg-white/5 transition-all group">
                <span className="font-semibold text-base">Services</span>
                <ChevronDown className={`h-4 w-4 transition-transform group-hover:scale-110 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {services.map((service) => (
                <Link
                  key={service.name}
                  to={service.href}
                  onClick={onClose}
                  className={`block py-3 px-6 ml-2 rounded-xl text-sm transition-all ${
                    isActive(service.href) 
                      ? 'text-gold bg-gold/10 border-l-2 border-gold' 
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {service.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Navegação Principal */}
        <div className="px-3 space-y-1">
          {mainNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`block py-3 px-4 rounded-xl font-medium transition-all ${
                isActive(item.href)
                  ? 'text-gold bg-gold/10 border-l-2 border-gold'
                  : 'text-white hover:text-gold hover:bg-white/5'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>

      {/* CTAs na parte inferior */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <a 
          href="tel:(732) 351-8653" 
          onClick={onClose}
          className="block w-full py-3 px-4 bg-gradient-to-r from-gold to-gold-warm text-black font-bold text-center rounded-xl hover:shadow-lg transition-all"
        >
          GET A QUOTE
        </a>
        <Link 
          to="/contact" 
          onClick={onClose}
          className="block w-full py-3 px-4 border-2 border-gold text-gold font-semibold text-center rounded-xl hover:bg-gold hover:text-black transition-all"
        >
          CONTACT US
        </Link>
        
        {/* Reviews */}
        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-1 text-white/70 text-xs">
            <span>Google</span>
            <div className="flex text-gold">★★★★★</div>
            <span>35+ Reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}