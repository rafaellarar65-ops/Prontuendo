import { http } from '@/lib/api/http';
import type { AuthTokens, UserProfile } from '@/types/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse extends AuthTokens {
  user: UserProfile;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await http.put('/auth/password', payload);
  },
};
