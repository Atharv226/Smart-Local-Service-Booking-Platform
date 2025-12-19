import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token && parsed.user) {
          setUser(parsed.user);
          setToken(parsed.token);
          setProfile(parsed.profile || null);
          console.log('✅ Auth restored from localStorage:', {
            userId: parsed.user?.id,
            role: parsed.user?.role,
            hasToken: !!parsed.token,
          });
        } else {
          console.warn('⚠️ Invalid auth data in localStorage, clearing...');
          localStorage.removeItem('auth');
        }
      } catch (err) {
        console.error('❌ Error parsing auth data:', err);
        localStorage.removeItem('auth');
      }
    } else {
      console.log('ℹ️ No auth data in localStorage - This is normal. Please login or signup to continue.');
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    // Store in localStorage first (synchronous)
    localStorage.setItem('auth', JSON.stringify(data));
    
    // Then update state (this triggers re-render)
    setUser(data.user);
    setToken(data.token);
    setProfile(data.profile || null);
    
    console.log('✅ Login function called - Auth state updated:', {
      userId: data.user?.id,
      role: data.user?.role,
      hasToken: !!data.token,
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setProfile(null);
    localStorage.removeItem('auth');
  };

  const value = {
    user,
    token,
    profile,
    setProfile,
    login,
    logout,
    loading,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}


