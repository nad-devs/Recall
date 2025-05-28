/**
 * Centralized authentication utilities for API calls
 */

/**
 * Get authentication headers for API calls
 * This function checks localStorage for user credentials and includes them in headers
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const userEmail = localStorage.getItem('userEmail');
    const userId = localStorage.getItem('userId');
    
    console.log('🔧 Auth Utils - Getting headers:', { 
      userEmail: userEmail ? 'present' : 'missing', 
      userId: userId ? 'present' : 'missing' 
    });
    
    if (userEmail && userId) {
      headers['x-user-email'] = userEmail;
      headers['x-user-id'] = userId;
    } else {
      console.warn('🔧 Auth Utils - No authentication data found in localStorage');
    }
  } else {
    console.log('🔧 Auth Utils - Server-side environment, no localStorage available');
  }
  
  return headers;
}

/**
 * Check if user is authenticated and redirect if not
 */
export function requireAuthentication(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  
  if (!userEmail || !userId) {
    console.warn('🔧 Auth Utils - User not authenticated, redirecting to landing page');
    
    // Clear any partial authentication data
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userInitials');
    
    // Redirect to landing page
    window.location.href = '/';
    return false;
  }
  
  return true;
}

/**
 * Make an authenticated API call with proper error handling
 */
export async function makeAuthenticatedRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Check authentication before making request
  if (!requireAuthentication()) {
    throw new Error('Authentication required');
  }
  
  const headers = getAuthHeaders();
  
  // Merge provided headers with auth headers
  const mergedHeaders: Record<string, string> = {
    ...headers,
    ...(options.headers as Record<string, string> || {}),
  };
  
  const requestOptions: RequestInit = {
    ...options,
    headers: mergedHeaders,
  };
  
  console.log('🔧 Auth Utils - Making request to:', endpoint);
  console.log('🔧 Auth Utils - Request options:', requestOptions);
  
  try {
    const response = await fetch(endpoint, requestOptions);
    
    console.log('🔧 Auth Utils - Response status:', response.status);
    
    // Handle common authentication errors
    if (response.status === 401) {
      console.error('🔧 Auth Utils - Authentication failed, clearing localStorage and redirecting');
      
      // Clear authentication data
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userInitials');
      
      // Redirect to landing page
      window.location.href = '/';
      
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    if (response.status === 403) {
      console.error('🔧 Auth Utils - Access forbidden');
      throw new Error('Access forbidden. You do not have permission to perform this action.');
    }
    
    if (response.status === 429) {
      console.error('🔧 Auth Utils - Rate limited');
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    return response;
  } catch (error) {
    console.error('🔧 Auth Utils - Request failed:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated by verifying localStorage data
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  
  return !!(userEmail && userId);
}

/**
 * Get current user info from localStorage
 */
export function getCurrentUser(): { email: string; id: string; name?: string } | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userEmail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  
  if (!userEmail || !userId) {
    return null;
  }
  
  return {
    email: userEmail,
    id: userId,
    name: userName || undefined,
  };
} 