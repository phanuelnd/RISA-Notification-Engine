import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '../types';
import { AuthAPI } from '../api/auth';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
}

/**
 * Authentication store using Zustand with persistence
 * Manages user authentication state, login/logout functionality
 * In production, this would integrate with Keycloak/OAuth2
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      accessToken: null,

      /**
       *  login function using backend API
       * @param email - User email
       * @param password - User password
       * @returns Promise<boolean> - Success status
       */
      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthAPI.login(email, password);
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Store tokens securely (in production, consider using httpOnly cookies)
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('accessToken', tokens.access);
            
            set({
              user: {
                id: user.id || email,
                email: user.email || email,
                name: user.name || user.email || email,
                role: user.role || 'user',
                avatar: user.avatar,
                lastLogin: new Date().toISOString(),
                isActive: true
              },
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken: tokens.access
            });
            return true;
          }

          set({
            isLoading: false,
            error: 'Invalid email or password'
          });
          return false;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return false;
        }
      },

      /**
       * Logout function - clears user data and authentication state
       */
      logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          try {
            await AuthAPI.logout(refreshToken);
          } catch (error) {
            console.warn('Logout API call failed:', error);
          }
        }
        
        // Clear local storage
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessToken');
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          accessToken: null
        });
      },

      /**
       * Refresh access token using refresh token
       * @returns Promise<boolean> - Success status
       */
      refreshToken: async (): Promise<boolean> => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          return false;
        }

        try {
          const response = await AuthAPI.refreshToken(refreshToken);
          
          if (response.success && response.data) {
            const { tokens } = response.data;
            
            set({
              accessToken: tokens.access,
              isAuthenticated: true
            });
            
            // Update tokens in localStorage
            localStorage.setItem('refreshToken', tokens.refresh);
            localStorage.setItem('accessToken', tokens.access);
            return true;
          }
          
          return false;
        } catch (error) {
          console.warn('Token refresh failed:', error);
          return false;
        }
      },

      /**
       * Set loading state
       * @param loading - Loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Set error message
       * @param error - Error message
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken
      })
    }
  )
);