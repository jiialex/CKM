import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import AuthHeader from './components/layout/AuthHeader';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/login';
import Signup from './pages/Signup';
import KeyManagement from './pages/dashboard/KeyManagement';
import CSRManagement from './pages/dashboard/CSRTable';
import CSRDetail from './components/layout/CSRDetailView'; 
import DashboardHome from './pages/dashboard/Home';
import UserManagement from './pages/dashboard/Users';
import CertificateManagementDashboard from './pages/dashboard/CertificateManagementDashboard';

import AdminNotifications from './pages/dashboard/AdminNotifications';

import CertificateManagement from './pages/dashboard/CertificateManagement';
import AuditLogs from './pages/dashboard/AuditLogs';
import SecurityThreats from './pages/dashboard/SecurityThreats';
import Approvals from './pages/dashboard/Approvals';
import SettingsPage from './pages/dashboard/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
const Layout = ({ children }) => (
  <div className="app-shell min-h-screen transition-colors duration-300">
    <div className="app-grid-backdrop fixed inset-0 -z-10 bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 dark:opacity-20" />
    {children}
  </div>
);

const DashboardWrapper = ({ title, subtitle, children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-shell flex min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="min-w-0 flex-1">
        <AuthHeader title={title} subtitle={subtitle} />
        <main className="px-4 pb-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<><Navbar /><main className="pt-20"><Home /></main><Footer /></>} />
      
        <Route path="/about" element={<><Navbar /><main className="pt-20"><About /></main><Footer /></>} />
        <Route path="/contact" element={<><Navbar /><main className="pt-20"><Contact /></main><Footer /></>} />
        <Route path="/login" element={<><Navbar /><main className="pt-20"><Login /></main><Footer /></>} />
        <Route path="/signup" element={<><Navbar /><main className="pt-20"><Signup /></main><Footer /></>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/keys" element={
          <ProtectedRoute>
          
              <KeyManagement />
         
          </ProtectedRoute>
        } />
<Route path="/dashboard/csr" element={
  <ProtectedRoute>
    <DashboardWrapper
      title="CSR Workspace"
      subtitle="Track certificate signing requests, imports, exports, and approval flow."
    >
      <CSRManagement />
    </DashboardWrapper>
  </ProtectedRoute>
} />

<Route path="/dashboard/csr/:id" element={
  <ProtectedRoute>
    <DashboardWrapper
      title="CSR Details"
      subtitle="Inspect the selected certificate signing request and related metadata."
    >
      <CSRDetail />
    </DashboardWrapper>
  </ProtectedRoute>
} />
        {/* --- 2. PROTECTED DASHBOARD ROUTES --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Operations Overview"
              subtitle="Unified visibility into certificates, audits, approvals, identities, and threat activity."
            >
              <DashboardHome />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/users" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Identity Registry"
              subtitle="Manage users, roles, approval state, and account activity across the platform."
            >
              <UserManagement />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
          <Route path="/dashboard/CertificateManagementDashboard" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Certificate Authority"
              subtitle="Monitor issued certificates, revocations, lifecycle status, and certificate operations."
            >
              <CertificateManagementDashboard />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/pki" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Certificate Authority"
              subtitle="Monitor issued certificates, revocations, lifecycle status, and certificate operations."
            >
              <CertificateManagement />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
         <Route path="/dashboard/AdminNotifications" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="AdminNotifications"
              subtitle="A Notification System for Certificate And CSR"
            >
              <AdminNotifications />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/logs" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Audit Monitoring"
              subtitle="Review security events, failed actions, revocation history, and correlation traces."
            >
              <AuditLogs />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
         
        <Route path="/dashboard/threats" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Threat Intelligence"
              subtitle="Watch live alerts, severity trends, and containment actions from the security layer."
            >
              <SecurityThreats />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
        <Route path="/dashboard/approvals" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Access Approvals"
              subtitle="Authorize or reject pending identities that need access to the PKI environment."
            >
              <Approvals />
            </DashboardWrapper>
          </ProtectedRoute>
        } />
      
        <Route path="/dashboard/settings" element={
          <ProtectedRoute>
            <DashboardWrapper
              title="Settings"
              subtitle="Configure your theme, profile display, notifications, and security preferences."
            >
              <SettingsPage />
            </DashboardWrapper>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
