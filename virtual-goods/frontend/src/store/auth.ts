import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  signature?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      user: null,
      login: (token, user) => {
        localStorage.setItem('token', token);
        set({ isAuthenticated: true, token, user });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ isAuthenticated: false, token: null, user: null });
      },
      updateUser: (user) => {
        set((state) => ({
          ...state,
          user,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
      }),
    }
  )
); 