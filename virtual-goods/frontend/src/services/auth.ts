import request from '@/utils/request';

interface LoginParams {
  username: string;
  password: string;
}

interface RegisterParams {
  username: string;
  password: string;
  email: string;
  confirmPassword: string;
}

interface LoginResult {
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      role: string;
      email: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

interface RegisterResult {
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
  };
}

export async function login(params: LoginParams): Promise<LoginResult> {
  return request.post('/api/v1/auth/login', params);
}

export async function register(params: RegisterParams): Promise<RegisterResult> {
  return request.post('/api/v1/auth/register', params);
}

export async function logout(): Promise<void> {
  return request.post('/api/v1/auth/logout');
}

export async function refreshToken(refreshToken: string): Promise<LoginResult> {
  return request.post('/api/v1/auth/refresh-token', { refreshToken });
} 