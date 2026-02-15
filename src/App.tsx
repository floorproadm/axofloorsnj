import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ScrollToTop from "@/components/shared/ScrollToTop";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import SecurityHeaders from "@/components/SecurityHeaders";
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

import StainGallery from "./pages/StainGallery";
import BuilderPartnerships from "./pages/BuilderPartnerships";
import Quiz from "./pages/Quiz";
import ThankYou from "./pages/ThankYou";
import ReferralProgram from "./pages/ReferralProgram";
import Builders from "./pages/Builders";
import Realtors from "./pages/Realtors";
import AdminDashboard from './pages/admin/Dashboard';
import AdminGalleryManager from './pages/admin/GalleryManager';
import CompanyFeed from './pages/admin/CompanyFeed';
import AdminLeadsManager from './pages/admin/LeadsManager';
import AdminJobsManager from './pages/admin/JobsManager';
import AdminIntake from './pages/admin/Intake';
import AdminSettings from './pages/admin/Settings';
import ProjectDetail from './pages/admin/ProjectDetail';
import ProjectDocuments from './pages/admin/ProjectDocuments';
import MeasurementsManager from './pages/admin/MeasurementsManager';
import AdminSchedule from './pages/admin/Schedule';
import AdminPerformance from './pages/admin/Performance';
import Auth from "./pages/Auth";
import Campaign from "./pages/Campaign";
import Sales2026 from "./pages/Sales2026";
import FloorDiagnostic from "./pages/FloorDiagnostic";
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
          <SecurityHeaders />
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
            <Route path="/campaign" element={<Campaign />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/referral-program" element={<ReferralProgram />} />
            <Route path="/builders" element={<Builders />} />
            <Route path="/realtors" element={<Realtors />} />
            <Route path="/builder-offer" element={<BuilderPartnerships />} />
            <Route path="/sales2026" element={<Sales2026 />} />
            <Route path="/floor-diagnostic" element={<FloorDiagnostic />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/gallery" element={
              <ProtectedRoute>
                <AdminGalleryManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/feed" element={
              <ProtectedRoute>
                <CompanyFeed />
              </ProtectedRoute>
            } />
            <Route path="/admin/leads" element={
              <ProtectedRoute>
                <AdminLeadsManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs" element={
              <ProtectedRoute>
                <AdminJobsManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/intake" element={
              <ProtectedRoute>
                <AdminIntake />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects/:projectId" element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs/:projectId/documents" element={
              <ProtectedRoute>
                <ProjectDocuments />
              </ProtectedRoute>
            } />
            <Route path="/admin/measurements" element={
              <ProtectedRoute>
                <MeasurementsManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/schedule" element={
              <ProtectedRoute>
                <AdminSchedule />
              </ProtectedRoute>
            } />
            <Route path="/admin/performance" element={
              <ProtectedRoute>
                <AdminPerformance />
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
