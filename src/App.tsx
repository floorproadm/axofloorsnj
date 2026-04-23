import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import PartnerProgram from "./pages/PartnerProgram";
import Quiz from "./pages/Quiz";
import ThankYou from "./pages/ThankYou";
import ReferralProgram from "./pages/ReferralProgram";
import Builders from "./pages/Builders";
import Realtors from "./pages/Realtors";
import AdminDashboard from './pages/admin/Dashboard';

import FeedPostDetail from './pages/admin/FeedPostDetail';
import FeedPostEdit from './pages/admin/FeedPostEdit';
import GalleryHub from './pages/admin/GalleryHub';
import AdminLeadsManager from './pages/admin/LeadsManager';
import LeadDetail from './pages/admin/LeadDetail';
import JobDetail from './pages/admin/JobDetail';
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
import WeeklyReview from './pages/admin/WeeklyReview';
import LaborPayroll from './pages/admin/LaborPayroll';
import CrewsVans from './pages/admin/CrewsVans';
import AdminProposals from './pages/admin/Proposals';
import ProjectsHub from './pages/admin/ProjectsHub';
import Auth from "./pages/Auth";
import AdminAuth from "./pages/admin/AdminAuth";
import Campaign from "./pages/Campaign";

import FloorDiagnostic from "./pages/FloorDiagnostic";
import AxoMasterSystem from "./pages/AxoMasterSystem";
import WowPack from "./pages/WowPack";
import ProjectWizard from "./pages/ProjectWizard";
import ReviewRequest from "./pages/ReviewRequest";
import NotFound from "./pages/NotFound";
import SharedPost from "./pages/SharedPost";
import PublicInvoice from "./pages/PublicInvoice";
import PublicProposal from "./pages/PublicProposal";
import PublicPortal from "./pages/PublicPortal";
import Links from "./pages/Links";

import CollaboratorLayout from "./components/collaborator/CollaboratorLayout";
import CollaboratorDashboard from "./pages/collaborator/CollaboratorDashboard";
import CollaboratorProjectDetail from "./pages/collaborator/CollaboratorProjectDetail";
import CollaboratorSchedule from "./pages/collaborator/CollaboratorSchedule";
import CollaboratorDocs from "./pages/collaborator/CollaboratorDocs";
import CollaboratorProfile from "./pages/collaborator/CollaboratorProfile";
import CollaboratorChat from "./pages/collaborator/CollaboratorChat";

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
            <Route path="/partner-program" element={<PartnerProgram />} />
            
            <Route path="/floor-diagnostic" element={<FloorDiagnostic />} />
            <Route path="/axo-master-system" element={<AxoMasterSystem />} />
            <Route path="/wow-pack" element={<WowPack />} />
            <Route path="/project-wizard" element={<ProjectWizard />} />
            <Route path="/review-request" element={<ReviewRequest />} />
            <Route path="/shared/:token" element={<SharedPost />} />
            <Route path="/invoice/:token" element={<PublicInvoice />} />
            <Route path="/proposal/:token" element={<PublicProposal />} />
            <Route path="/portal/:token" element={<PublicPortal />} />
            <Route path="/hub" element={<Links />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/auth" element={<AdminAuth />} />
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
                <GalleryHub />
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
            <Route path="/admin/leads/:leadId" element={
              <ProtectedRoute>
                <LeadDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs/:jobId" element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/jobs" element={<Navigate to="/admin/projects" replace />} />
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
            <Route path="/admin/weekly-review" element={
              <ProtectedRoute>
                <WeeklyReview />
              </ProtectedRoute>
            } />
            <Route path="/admin/labor-payroll" element={
              <ProtectedRoute>
                <LaborPayroll />
              </ProtectedRoute>
            } />
            <Route path="/admin/crews" element={
              <ProtectedRoute>
                <CrewsVans />
              </ProtectedRoute>
            } />
            <Route path="/admin/proposals" element={
              <ProtectedRoute>
                <AdminProposals />
              </ProtectedRoute>
            } />
            <Route path="/admin/projects" element={
              <ProtectedRoute>
                <ProjectsHub />
              </ProtectedRoute>
            } />
            {/* Collaborator Portal */}
            <Route path="/collaborator" element={
              <ProtectedRoute requireAdmin={false}>
                <CollaboratorLayout />
              </ProtectedRoute>
            }>
              <Route index element={<CollaboratorDashboard />} />
              <Route path="schedule" element={<CollaboratorSchedule />} />
              <Route path="docs" element={<CollaboratorDocs />} />
              <Route path="chat" element={<CollaboratorChat />} />
              <Route path="profile" element={<CollaboratorProfile />} />
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
