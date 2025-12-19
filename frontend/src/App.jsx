import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/Toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RoleSelectPage from './pages/RoleSelectPage';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import './utils/authDebug'; // Load debug utility

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, token } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Wait for auth to finish loading
  useEffect(() => {
    if (!loading) {
      // Give a small delay to ensure state is updated
      const timer = setTimeout(() => {
        setCheckingAuth(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-sm text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Check localStorage as fallback (in case state hasn't updated yet)
  const stored = localStorage.getItem('auth');
  let hasAuth = !!user && !!token;
  let authUser = user;
  
  if (!hasAuth && stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.token && parsed.user) {
        hasAuth = true;
        authUser = parsed.user;
        console.log('✅ Found auth in localStorage, using it:', {
          userId: parsed.user?.id,
          role: parsed.user?.role,
        });
      }
    } catch (err) {
      console.error('Error parsing stored auth:', err);
    }
  }

  // Redirect to login if not authenticated
  if (!hasAuth) {
    console.log('❌ No auth found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Redirect to role select if wrong role
  if (allowedRoles && authUser && !allowedRoles.includes(authUser.role)) {
    console.log('❌ Wrong role, redirecting to role-select. User role:', authUser.role, 'Allowed:', allowedRoles);
    return <Navigate to="/role-select" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted', {
    userId: authUser?.id,
    role: authUser?.role,
    allowedRoles,
  });

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/role-select" element={<RoleSelectPage />} />

                <Route
                  path="/provider/*"
                  element={
                    <ProtectedRoute allowedRoles={['provider']}>
                      <ProviderDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/customer/*"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

