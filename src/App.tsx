import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { Toaster } from "@/components/ui/sonner";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AcceptInvite from "@/pages/AcceptInvite";

import AppShell from "@/layouts/AppShell";
import Dashboard from "@/pages/app/Dashboard";
import Jobs from "@/pages/app/Jobs";
import NewJob from "@/pages/app/NewJob";
import JobPipeline from "@/pages/app/JobPipeline";
import JobCandidates from "@/pages/app/JobCandidates";
import JobSettings from "@/pages/app/JobSettings";
import Candidates from "@/pages/app/Candidates";
import CandidateDetail from "@/pages/app/CandidateDetail";
import Interviews from "@/pages/app/Interviews";
import Offers from "@/pages/app/Offers";
import Workspace from "@/pages/app/settings/Workspace";
import Theme from "@/pages/app/settings/Theme";
import Pipeline from "@/pages/app/settings/Pipeline";
import EmailTemplates from "@/pages/app/settings/EmailTemplates";
import Members from "@/pages/app/settings/Members";

import JobBoard from "@/pages/public/JobBoard";
import JobDetail from "@/pages/public/JobDetail";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />

          <Route path="/jobs/:slug" element={<JobBoard />} />
          <Route path="/jobs/:slug/:jobId" element={<JobDetail />} />

          <Route
            path="/app"
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/new" element={<NewJob />} />
            <Route path="jobs/:id/pipeline" element={<JobPipeline />} />
            <Route path="jobs/:id/candidates" element={<JobCandidates />} />
            <Route path="jobs/:id/settings" element={<JobSettings />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="candidates/:id" element={<CandidateDetail />} />
            <Route path="interviews" element={<Interviews />} />
            <Route path="offers" element={<Offers />} />
            <Route path="settings/workspace" element={<Workspace />} />
            <Route path="settings/theme" element={<Theme />} />
            <Route path="settings/pipeline" element={<Pipeline />} />
            <Route path="settings/email-templates" element={<EmailTemplates />} />
            <Route path="settings/members" element={<Members />} />
          </Route>

          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
