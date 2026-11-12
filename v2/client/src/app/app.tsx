import '@/styles/globals.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CheckEmailPage } from '@/app/pages/(auth)/(email)/check-email/page';
import { VerifyEmailPage } from '@/app/pages/(auth)/(email)/verify-email/page';
import { ForgotPasswordPage } from '@/app/pages/(auth)/(password)/forgot-password/page';
import { ResetPasswordPage } from '@/app/pages/(auth)/(password)/reset-password/page';
import { AuthLayout } from '@/app/pages/(auth)/layout';
import { LoginForm } from '@/app/pages/(auth)/login/page';
import { OAuthConsentPage } from '@/app/pages/(auth)/oauth-consent/page';
import { RequireAuth } from '@/app/pages/(auth)/shared/components/require-auth';
import { SignupForm } from '@/app/pages/(auth)/signup/page';

import { AcceptInvitation } from '@/app/pages/(organisation)/accept-invitation/page';
import { MembersPage } from '@/app/pages/(organisation)/members/page';
import { OrganisationSetupPage } from '@/app/pages/(organisation)/setup/page';
import { RequireOrganisation } from '@/app/pages/(organisation)/shared/components/require-organisation';
import { RequirePermission } from '@/app/pages/(organisation)/shared/components/require-permission';

import { Layout } from '@/app/layout';
import { DashboardPage } from '@/app/pages/dashboards/page';
import { DeviceDetailPage } from '@/app/pages/devices/detail/page';
import { DevicesListPage } from '@/app/pages/devices/list/page';
import { IntegrationsPage } from '@/app/pages/integrations/page';
import { LocationDetailPage } from '@/app/pages/locations/detail/page';
import { LocationsTreePage } from '@/app/pages/locations/list/page';
import { NotFound } from '@/app/pages/not-found/page';
import { TemplateDetailPage } from '@/app/pages/templates/detail/page';
import { TemplatesListPage } from '@/app/pages/templates/list/page';

import { Toaster } from '@/app/shared/components/ui/toaster';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="login" element={<LoginForm />} />
              <Route path="signup" element={<SignupForm />} />
              <Route path="accept-invitation" element={<AcceptInvitation />} />
              <Route path="check-email" element={<CheckEmailPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Authenticated routes */}
            <Route element={<RequireAuth />}>
              {/* OAuth and organisation onboarding */}
              <Route path="oauth/consent" element={<OAuthConsentPage />} />
              <Route path="organisation/setup" element={<OrganisationSetupPage />} />

              {/* Organisation-scoped application */}
              <Route element={<RequireOrganisation />}>
                <Route element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* Dashboard */}
                  <Route
                    path="dashboard"
                    element={<RequirePermission permissions={{ dashboard: ['read'] }} />}
                  >
                    <Route index element={<DashboardPage />} />
                  </Route>

                  {/* Devices */}
                  <Route path="devices" element={<RequirePermission permissions={{ device: ['read'] }} />}>
                    <Route index element={<DevicesListPage />} />
                    <Route path=":deviceId" element={<DeviceDetailPage />} />
                  </Route>

                  {/* Locations */}
                  <Route
                    path="locations"
                    element={<RequirePermission permissions={{ location: ['read'] }} />}
                  >
                    <Route index element={<LocationsTreePage />} />
                    <Route path=":locationId" element={<LocationDetailPage />} />
                  </Route>

                  {/* Templates */}
                  <Route
                    path="templates"
                    element={<RequirePermission permissions={{ template: ['read'] }} />}
                  >
                    <Route index element={<TemplatesListPage />} />
                    <Route path=":templateId" element={<TemplateDetailPage />} />
                  </Route>

                  {/* Organisation */}
                  <Route path="members" element={<MembersPage />} />
                  <Route path="integrations" element={<IntegrationsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
