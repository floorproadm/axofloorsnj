import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ScrollToTop from "@/components/shared/ScrollToTop";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import SecurityHeaders from "@/components/SecurityHeaders";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import AdminDashboard from './pages/admin/Dashboard';
import AdminChat from './pages/admin/AdminChat';
import FeedPostDetail from './pages/admin/FeedPostDetail';
import FeedPostEdit from './pages/admin/FeedPostEdit';
import GalleryHub from './pages/admin/GalleryHub';
import AdminLeadsManager from './pages/admin/LeadsManager';
import LeadsTrash from './pages/admin/LeadsTrash';
import LeadDetail from './pages/admin/LeadDetail';
import JobDetail from './pages/admin/JobDetail';
import AdminIntake from './pages/admin/Intake';
import AdminSettings from './pages/admin/Settings';
import ProjectDetail from './pages/admin/ProjectDetail';
import ShareBeforeAfter from './pages/ShareBeforeAfter';
import ProjectDocuments from './pages/admin/ProjectDocuments';
import MeasurementsManager from './pages/admin/MeasurementsManager';
import AdminSchedule from './pages/admin/Schedule';
import AdminPerformance from './pages/admin/Performance';
import AdminReputation from './pages/admin/Reputation';
import AdminCatalog from './pages/admin/Catalog';
import AdminHelp from './pages/admin/Help';
import AdminPartners from './pages/admin/Partners';
import AdminPayments from './pages/admin/Payments';
import AdminAutomations from './pages/admin/Automations';
import WeeklyReview from './pages/admin/WeeklyReview';
import LaborPayroll from './pages/admin/LaborPayroll';
import CrewsVans from './pages/admin/CrewsVans';
import Fleet from './pages/admin/Fleet';
import AdminProposals from './pages/admin/Proposals';
import ProjectsHub from './pages/admin/ProjectsHub';
import AdminMissionControl from './pages/admin/MissionControl';
import AdminCustomers from './pages/admin/Customers';
import Auth from "./pages/Auth";
import AdminAuth from "./pages/admin/AdminAuth";
import ReviewRequest from "./pages/ReviewRequest";
import AppointmentRequests from "./pages/admin/AppointmentRequests";
import NotFound from "./pages/NotFound";
import SharedPost from "./pages/SharedPost";
import PublicInvoice from "./pages/PublicInvoice";
import PublicProposal from "./pages/PublicProposal";
import PublicDepositInvoice from "./pages/PublicDepositInvoice";
import PublicPortal from "./pages/PublicPortal";

import CollaboratorLayout from "./components/collaborator/CollaboratorLayout";
import CollaboratorDashboard from "./pages/collaborator/CollaboratorDashboard";
import CollaboratorProjectDetail from "./pages/collaborator/CollaboratorProjectDetail";
import CollaboratorSchedule from "./pages/collaborator/CollaboratorSchedule";
import CollaboratorDocs from "./pages/collaborator/CollaboratorDocs";
import CollaboratorProfile from "./pages/collaborator/CollaboratorProfile";
import CollaboratorChat from "./pages/collaborator/CollaboratorChat";
import CollaboratorTimesheet from "./pages/collaborator/CollaboratorTimesheet";
import TimesheetApprovals from "./pages/admin/TimesheetApprovals";

import PartnerAuth from "./pages/partner/PartnerAuth";
import ResetPassword from "./pages/ResetPassword";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerWelcome from "./pages/partner/PartnerWelcome";

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
          <ErrorBoundary scope="app">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/auth" replace />} />

            {/* Auth */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/auth" element={<AdminAuth />} />
            <Route path="/partner/auth" element={<PartnerAuth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public token-based routes (kept) */}
            <Route path="/review-request" element={<ReviewRequest />} />
            <Route path="/shared/:token" element={<SharedPost />} />
            <Route path="/share/before-after/:token" element={<ShareBeforeAfter />} />
            <Route path="/invoice/:token" element={<PublicInvoice />} />
            <Route path="/proposal/:token" element={<PublicProposal />} />
            <Route path="/proposal/:token/invoice" element={<PublicDepositInvoice />} />
            <Route path="/portal/:token" element={<PublicPortal />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />
            <Route path="/admin/gallery" element={<ProtectedRoute><GalleryHub /></ProtectedRoute>} />
            <Route path="/admin/feed/:postId" element={<ProtectedRoute><FeedPostDetail /></ProtectedRoute>} />
            <Route path="/admin/feed/:postId/edit" element={<ProtectedRoute><FeedPostEdit /></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute><AdminLeadsManager /></ProtectedRoute>} />
            <Route path="/admin/leads/trash" element={<ProtectedRoute><LeadsTrash /></ProtectedRoute>} />
            <Route path="/admin/leads/:leadId" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/admin/jobs/:jobId" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/admin/jobs" element={<Navigate to="/admin/projects" replace />} />
            <Route path="/admin/intake" element={<ProtectedRoute><AdminIntake /></ProtectedRoute>} />
            <Route path="/admin/mission-control" element={<ProtectedRoute><AdminMissionControl /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="/admin/jobs/:projectId/documents" element={<ProtectedRoute><ProjectDocuments /></ProtectedRoute>} />
            <Route path="/admin/measurements" element={<ProtectedRoute><MeasurementsManager /></ProtectedRoute>} />
            <Route path="/admin/schedule" element={<ProtectedRoute><AdminSchedule /></ProtectedRoute>} />
            <Route path="/admin/performance" element={<ProtectedRoute><AdminPerformance /></ProtectedRoute>} />
            <Route path="/admin/reputation" element={<ProtectedRoute><AdminReputation /></ProtectedRoute>} />
            <Route path="/admin/catalog" element={<ProtectedRoute><AdminCatalog /></ProtectedRoute>} />
            <Route path="/admin/help" element={<ProtectedRoute><AdminHelp /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute><AdminPartners /></ProtectedRoute>} />
            <Route path="/admin/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/automations" element={<ProtectedRoute><AdminAutomations /></ProtectedRoute>} />
            <Route path="/admin/weekly-review" element={<ProtectedRoute><WeeklyReview /></ProtectedRoute>} />
            <Route path="/admin/labor-payroll" element={<ProtectedRoute><LaborPayroll /></ProtectedRoute>} />
            <Route path="/admin/crews" element={<ProtectedRoute><CrewsVans /></ProtectedRoute>} />
            <Route path="/admin/fleet" element={<ProtectedRoute><Fleet /></ProtectedRoute>} />
            <Route path="/admin/proposals" element={<ProtectedRoute><AdminProposals /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute><ProjectsHub /></ProtectedRoute>} />
            <Route path="/admin/appointment-requests" element={<ProtectedRoute><AppointmentRequests /></ProtectedRoute>} />
            <Route path="/admin/timesheet" element={<Navigate to="/admin/crews?tab=daysheet" replace />} />
            <Route path="/admin/daysheet" element={<Navigate to="/admin/crews?tab=daysheet" replace />} />

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
              <Route path="daysheet" element={<CollaboratorTimesheet />} />
              <Route path="timesheet" element={<Navigate to="/collaborator/daysheet" replace />} />
              <Route path="project/:projectId" element={<CollaboratorProjectDetail />} />
            </Route>

            {/* Partner Portal */}
            <Route path="/partner/welcome" element={<PartnerWelcome />} />
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route path="/partner" element={<Navigate to="/partner/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
