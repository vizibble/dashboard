import { useEffect, useState } from 'react';

import axios from 'axios';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/store/auth-store';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

/**
 * On mount, if no access token is in the store, attempts a silent refresh
 * using the HttpOnly refresh token cookie. On success, stores the new access
 * token and renders children. On failure, redirects to /login.
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { accessToken, setAccessToken } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauth'>(
    accessToken ? 'ok' : 'loading'
  );

  useEffect(() => {
    if (accessToken) return;

    const controller = new AbortController();

    axios
      .post(
        `${BACKEND_URL}/api/auth/refresh`,
        {},
        { withCredentials: true, signal: controller.signal }
      )
      .then((res) => {
        const { accessToken: newToken } = res.data as { accessToken: string };
        setAccessToken(newToken);
        setStatus('ok');
      })
      .catch((err) => {
        if (axios.isCancel(err)) return; // component unmounted — ignore
        setStatus('unauth');
      });

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauth') return <Navigate to="/login" replace />;

  return <>{children}</>;
};
