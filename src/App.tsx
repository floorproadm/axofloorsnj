import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HardwoodFlooring from "./pages/HardwoodFlooring";
import SandingRefinish from "./pages/SandingRefinish";
import VinylPlankFlooring from "./pages/VinylPlankFlooring";
import Staircase from "./pages/Staircase";
import BaseBoards from "./pages/BaseBoards";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hardwood-flooring" element={<HardwoodFlooring />} />
          <Route path="/sanding-and-refinish" element={<SandingRefinish />} />
          <Route path="/vinyl-plank-flooring" element={<VinylPlankFlooring />} />
          <Route path="/staircase" element={<Staircase />} />
          <Route path="/base-boards" element={<BaseBoards />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
