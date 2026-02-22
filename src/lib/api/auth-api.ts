import { http } from '@/lib/api/http';
import type { AuthTokens, UserProfile } from '@/types/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse extends AuthTokens {
  user: UserProfile;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>('/auth/login', payload);
    return data;
  },
};
