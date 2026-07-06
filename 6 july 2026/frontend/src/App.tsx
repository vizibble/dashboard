import 'react-toastify/dist/ReactToastify.css';

import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { AppSidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';
import { ProtectedRoute } from '@/components/protected-route';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AlertsPage } from '@/pages/alerts/Index';
import { HomePage } from '@/pages/home/Index';
import { LoginPage } from '@/pages/login/Index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SettingsPage } from '@/pages/settings/Index';
import { RecordsPage } from '@/pages/records/index';

import EmailBuilderPage from "@/pages/email-builder/EmailBuilderPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer autoClose={3000} position="top-center" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              //<ProtectedRoute>
                <TooltipProvider>
                  <SidebarProvider defaultOpen={false}>
                    <AppSidebar />
                    <div className="flex-1 flex flex-col min-w-0 w-full h-screen overflow-hidden">
                      <Navbar />
                      <div className="flex-1 overflow-auto">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/alerts" element={<AlertsPage />} />
                          <Route path="/email-builder" element={<EmailBuilderPage />}/>
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/records" element={<RecordsPage />} />
                        </Routes>
                      </div>
                    </div>
                  </SidebarProvider>
                </TooltipProvider>
              //</ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
