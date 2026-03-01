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
import { LanguageProvider } from "@/contexts/LanguageContext";
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

import CompanyFeed from './pages/admin/CompanyFeed';
import FeedPostDetail from './pages/admin/FeedPostDetail';
import FeedPostEdit from './pages/admin/FeedPostEdit';
import AdminLeadsManager from './pages/admin/LeadsManager';
import AdminJobsManager from './pages/admin/JobsManager';
import AdminIntake from './pages/admin/Intake';
import AdminSettings from './pages/admin/Settings';
import ProjectDetail from './pages/admin/ProjectDetail';
import ProjectDocuments from './pages/admin/ProjectDocuments';
import MeasurementsManager from './pages/admin/MeasurementsManager';
import AdminSchedule from './pages/admin/Schedule';
import AdminPerformance from './pages/admin/Performance';
import AdminCatalog from './pages/admin/Catalog';
import AdminHelp from './pages/admin/Help';
import AdminPartners from './pages/admin/Partners';
import AdminPayments from './pages/admin/Payments';
import AdminAutomations from './pages/admin/Automations';
import Auth from "./pages/Auth";
import Campaign from "./pages/Campaign";

import FloorDiagnostic from "./pages/FloorDiagnostic";
import NotFound from "./pages/NotFound";
import SharedPost from "./pages/SharedPost";

import CollaboratorLayout from "./components/collaborator/CollaboratorLayout";
import CollaboratorDashboard from "./pages/collaborator/CollaboratorDashboard";
import CollaboratorProjectDetail from "./pages/collaborator/CollaboratorProjectDetail";

const queryClient = new QueryClient();

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
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
            
            <Route path="/floor-diagnostic" element={<FloorDiagnostic />} />
            <Route path="/shared/:token" element={<SharedPost />} />
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
            {/* Gallery Manager is now inside /admin/settings */}
            <Route path="/admin/feed" element={
              <ProtectedRoute>
                <CompanyFeed />
              </ProtectedRoute>
            } />
            <Route path="/admin/feed/:postId" element={
              <ProtectedRoute>
                <FeedPostDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/feed/:postId/edit" element={
              <ProtectedRoute>
                <FeedPostEdit />
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
            <Route path="/admin/catalog" element={
              <ProtectedRoute>
                <AdminCatalog />
              </ProtectedRoute>
            } />
            <Route path="/admin/help" element={
              <ProtectedRoute>
                <AdminHelp />
              </ProtectedRoute>
            } />
            <Route path="/admin/partners" element={
              <ProtectedRoute>
                <AdminPartners />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute>
                <AdminPayments />
              </ProtectedRoute>
            } />
            <Route path="/admin/automations" element={
              <ProtectedRoute>
                <AdminAutomations />
              </ProtectedRoute>
            } />
            {/* Collaborator Portal */}
            <Route path="/collaborator" element={
              <ProtectedRoute requireAdmin={false}>
                <CollaboratorLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CollaboratorDashboard />} />
              <Route path="project/:projectId" element={<CollaboratorProjectDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
