import 'react-toastify/dist/ReactToastify.css';

import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { Navbar } from '@/components/navbar';
import { ProtectedRoute } from '@/components/protected-route';
import { AlertsPage } from '@/pages/alerts/Index';
import { HomePage } from '@/pages/home/Index';
import { LoginPage } from '@/pages/login/Index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer position="top-center" autoClose={3000} />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Navbar />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                </Routes>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
