import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ScrollToTop from "@/components/shared/ScrollToTop";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import HardwoodFlooring from "./pages/HardwoodFlooring";
import SandingRefinish from "./pages/SandingRefinish";
import VinylPlankFlooring from "./pages/VinylPlankFlooring";
import Staircase from "./pages/Staircase";
import BaseBoards from "./pages/BaseBoards";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import About from "./pages/About";
import FunnelPage from "./pages/FunnelPage";
import StainGallery from "./pages/StainGallery";
import BuilderPartnerships from "./pages/BuilderPartnerships";
import Quiz from "./pages/Quiz";
import Builders from "./pages/Builders";
import Realtors from "./pages/Realtors";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hardwood-flooring" element={<HardwoodFlooring />} />
            <Route path="/sanding-and-refinish" element={<SandingRefinish />} />
            <Route path="/vinyl-plank-flooring" element={<VinylPlankFlooring />} />
            <Route path="/staircase" element={<Staircase />} />
            <Route path="/base-boards" element={<BaseBoards />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/stain-gallery" element={<StainGallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/funnel" element={<FunnelPage />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/builders" element={<Builders />} />
            <Route path="/realtors" element={<Realtors />} />
            <Route path="/builder-offer" element={<BuilderPartnerships />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
