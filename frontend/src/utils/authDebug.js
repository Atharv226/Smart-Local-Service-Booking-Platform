// Debug utility to check authentication status
export function checkAuthStatus() {
  const stored = localStorage.getItem('auth');
  if (!stored) {
    console.log('ℹ️ No auth data in localStorage - This is normal if you haven\'t logged in yet.');
    console.log('📝 To login:');
    console.log('   1. Go to /signup to create an account (if you don\'t have one)');
    console.log('   2. Go to /login to login with your mobile number and password');
    console.log('   3. After successful login, auth data will be stored automatically');
    return { authenticated: false, reason: 'No auth data - Please login first' };
  }

  try {
    const parsed = JSON.parse(stored);
    if (!parsed.token) {
      console.log('❌ No token in auth data');
      return { authenticated: false, reason: 'No token' };
    }

    if (!parsed.user) {
      console.log('❌ No user data in auth data');
      return { authenticated: false, reason: 'No user data' };
    }

    console.log('✅ Auth data found:', {
      hasToken: !!parsed.token,
      tokenLength: parsed.token.length,
      user: parsed.user,
      role: parsed.user.role,
    });

    return { authenticated: true, data: parsed };
  } catch (err) {
    console.error('❌ Error parsing auth data:', err);
    return { authenticated: false, reason: 'Parse error' };
  }
}

// Call this in browser console to debug
if (typeof window !== 'undefined') {
  window.checkAuth = checkAuthStatus;
}

