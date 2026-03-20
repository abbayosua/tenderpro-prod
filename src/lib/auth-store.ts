import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'OWNER' | 'CONTRACTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      
      login: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            set({ 
              user: data.user, 
              token: data.token, 
              isLoading: false 
            });
            return { success: true };
          }
          
          set({ isLoading: false });
          return { 
            success: false, 
            message: data.message || 'Login gagal' 
          };
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return { 
            success: false, 
            message: 'Terjadi kesalahan jaringan' 
          };
        }
      },
      
      logout: async () => {
        try {
          // Call logout API to clear HTTP-only cookie
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('Logout API error:', error);
        }
        // Clear local state
        set({ user: null, token: null });
      },
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      
      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null, token: null });
          return false;
        }
        
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          const data = await response.json();
          
          if (data.success && data.authenticated) {
            return true;
          } else {
            set({ user: null, token: null });
            return false;
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, token: null });
          return false;
        }
      },
    }),
    {
      name: 'tender-pro-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Helper hook for auth status
export function useAuth() {
  const { user, token, isLoading, _hasHydrated } = useAuthStore();
  
  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isHydrated: _hasHydrated,
  };
}
