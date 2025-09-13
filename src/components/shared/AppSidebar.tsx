import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Phone, Mail, Facebook, Instagram, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import axoLogo from "@/assets/axo-logo.png";

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

export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const [servicesOpen, setServicesOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const hasActiveService = services.some(service => isActive(service.href));

  const closeSidebar = () => setOpenMobile(false);

  return (
    <Sidebar className="lg:hidden w-80 bg-black border-r border-white/10">
      {/* Header with phone and social */}
      <div className="bg-gold text-black py-3 px-4">
        <div className="flex items-center justify-between text-sm">
          <a href="tel:(732) 351-8653" className="flex items-center gap-1 font-semibold">
            <Phone className="h-4 w-4" />
            (732) 351-8653
          </a>
          <div className="flex gap-2">
            <a href="#" className="bg-black text-white p-1.5 rounded">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" className="bg-black text-white p-1.5 rounded">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <SidebarHeader className="bg-black border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <Link to="/" onClick={closeSidebar} className="flex items-center">
            <img src={axoLogo} alt="AXO Floors" className="h-10 w-auto" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeSidebar}
            className="text-white hover:bg-white/10 p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-black">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Services with submenu */}
              <SidebarMenuItem>
                <Collapsible open={servicesOpen || hasActiveService} onOpenChange={setServicesOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between text-white hover:text-gold hover:bg-white/5 text-lg py-6 px-4">
                      <span>Services</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen || hasActiveService ? 'rotate-180' : ''}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 space-y-1">
                    {services.map((service) => (
                      <SidebarMenuItem key={service.name}>
                        <SidebarMenuButton asChild className={`text-white/80 hover:text-gold hover:bg-white/5 py-3 px-4 ${isActive(service.href) ? 'text-gold bg-white/5' : ''}`}>
                          <Link to={service.href} onClick={closeSidebar}>
                            {service.name}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              {/* Main navigation */}
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild className={`text-white hover:text-gold hover:bg-white/5 text-lg py-6 px-4 ${isActive(item.href) ? 'text-gold bg-white/5' : ''}`}>
                    <Link to={item.href} onClick={closeSidebar}>
                      {item.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-black border-t border-white/10 p-4">
        <Button asChild className="gold-gradient w-full font-semibold">
          <a href="tel:(732) 351-8653" onClick={closeSidebar}>
            GET A QUOTE
          </a>
        </Button>
        <Button asChild variant="outline" className="w-full mt-2 border-gold text-gold hover:bg-gold hover:text-black">
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
      </SidebarFooter>
    </Sidebar>
  );
}