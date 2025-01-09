import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logout as logoutAPI } from '@/services/auth';
import { message } from 'antd';

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
  logout: () => Promise<void>;
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
      logout: async () => {
        try {
          await logoutAPI();
          localStorage.removeItem('token');
          localStorage.removeItem('remembered_account');
          set({ isAuthenticated: false, token: null, user: null });
          message.success('已安全退出登录');
        } catch (error) {
          // 即使API调用失败，也要清理本地状态
          localStorage.removeItem('token');
          localStorage.removeItem('remembered_account');
          set({ isAuthenticated: false, token: null, user: null });
          message.error('退出登录时发生错误，但已清理本地登录状态');
        }
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