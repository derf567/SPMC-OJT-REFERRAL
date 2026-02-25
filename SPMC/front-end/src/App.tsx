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
import ReferrerDashboard from "./pages/ReferrerDashboard";
import ActiveReferrals from "./pages/ActiveReferrals";
import Outpatient from "./pages/Outpatient";
import Patients from "./pages/Patients";
import Facilities from "./pages/Facilities";
import Reports from "./pages/Reports";
import Approval from "./pages/Approval";
import IncomingReferrals from "./pages/IncomingReferrals";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountApproval from "./pages/admin/AccountApproval";
import HeadsUp from "./pages/admin/HeadsUp";
import HeadsUpDragDrop from "./pages/admin/HeadsUpDragDrop";

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
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute>
                <AccountApproval />
              </ProtectedRoute>
            } />
            <Route path="/admin/headsup" element={
              <ProtectedRoute>
                <HeadsUp />
              </ProtectedRoute>
            } />
            <Route path="/admin/headsup/assign" element={
              <ProtectedRoute>
                <HeadsUpDragDrop />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute>
                <Reports />
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
            <Route path="/facilities" element={
              <ProtectedRoute>
                <Facilities />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
