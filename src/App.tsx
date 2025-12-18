import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Policies from "./pages/Policies";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";
import NotFound from "./pages/NotFound";
import RenewalDetail from "./pages/RenewalDetail";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
      <Route path="/renewal/:renewalId" element={<ProtectedRoute><RenewalDetail /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  // Initialize dark mode by default
  useEffect(() => {
    const stored = localStorage.getItem('quantara-theme') || localStorage.getItem('theme');
    if (!stored) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('quantara-theme', 'dark');
    } else {
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(stored);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
