import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardRedirect from "@/components/auth/DashboardRedirect";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ExternalReferral from "./pages/ExternalReferral";
import { ReferralView } from "./pages/ReferralView";
import { ReferralEdit } from "./pages/ReferralEdit";
import Register from "./pages/Register";
import DoctorRegister from "./pages/DoctorRegister";
import ReferrerDashboard from "./pages/ReferrerDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import ActiveReferrals from "./pages/ActiveReferrals";
import TriageReferrals from "./pages/TriageReferrals";
import EndorsementAndTransit from "./pages/EndorsementAndTransit";
import Outpatient from "./pages/Outpatient";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import Approval from "./pages/Approval";
import IncomingReferrals from "./pages/IncomingReferrals";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountApproval from "./pages/admin/AccountApproval";
import DepartmentSettings from "./pages/admin/DepartmentSettings";
import UserManagement from "./pages/admin/UserManagement";
import FraudMonitor from "./pages/FraudMonitor";
import DepartmentArchive from "./pages/DepartmentArchive";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/doctor" element={<DoctorRegister />} />
            <Route path="/referral" element={<ExternalReferral />} />
            <Route path="/referral/edit/:id" element={
              <ProtectedRoute>
                <ReferralEdit />
              </ProtectedRoute>
            } />
            <Route path="/referral/view/:id" element={
              <ProtectedRoute>
                <ReferralView />
              </ProtectedRoute>
            } />
            
            {/* Dashboard redirect route - determines which dashboard to show based on user role */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute requireAdmin>
                <AccountApproval />
              </ProtectedRoute>
            } />
            <Route path="/admin/departments" element={
              <ProtectedRoute requireAdmin>
                <DepartmentSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requireAdmin>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <UserManagement />
              </ProtectedRoute>
            } />
            
            {/* Referrer Dashboard and Sub-routes */}
            <Route path="/referrer" element={
              <ProtectedRoute>
                <ReferrerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/referrer/referred" element={
              <ProtectedRoute>
                <ReferrerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/referrer/archived" element={
              <ProtectedRoute>
                <ReferrerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/referrer/reports" element={
              <ProtectedRoute>
                <ReferrerDashboard />
              </ProtectedRoute>
            } />
            
            {/* Doctor Dashboard and Sub-routes */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute>
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/department/archive" element={
              <ProtectedRoute>
                <DepartmentArchive />
              </ProtectedRoute>
            } />
            
            {/* SPMC Internal Dashboard and Pages */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/referrals" element={
              <ProtectedRoute>
                <ActiveReferrals />
              </ProtectedRoute>
            } />
            <Route path="/triage" element={
              <ProtectedRoute>
                <TriageReferrals />
              </ProtectedRoute>
            } />
            <Route path="/endorsement-transit" element={
              <ProtectedRoute>
                <EndorsementAndTransit />
              </ProtectedRoute>
            } />
            <Route path="/outpatient" element={
              <ProtectedRoute>
                <Outpatient />
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/approval" element={
              <ProtectedRoute>
                <Approval />
              </ProtectedRoute>
            } />
            <Route path="/incoming" element={
              <ProtectedRoute>
                <IncomingReferrals />
              </ProtectedRoute>
            } />
            <Route path="/fraud-monitor" element={
              <ProtectedRoute>
                <FraudMonitor />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
