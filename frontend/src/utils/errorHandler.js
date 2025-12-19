// Global error handler for API errors
let toastCallback = null;

export function setToastCallback(callback) {
  toastCallback = callback;
}

export function handleApiError(error) {
  if (error.response?.status === 401) {
    const errorMessage = error.response?.data?.message || 'Session expired. Please login again.';
    
    // Show toast notification if available
    if (toastCallback) {
      toastCallback(errorMessage, 'error');
    } else {
      // Fallback: show alert if toast is not available
      console.error('❌ Session expired:', errorMessage);
    }
    
    return true; // Error was handled
  }
  return false; // Error was not handled
}

