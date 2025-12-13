import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Policies from "./pages/Policies";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
