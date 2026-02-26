import { http } from '@/lib/api/http';
import type { AuthTokens, UserProfile } from '@/types/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse extends AuthTokens {
  user: UserProfile;
}

const tenantHeader = (): Record<string, string> | null => {
  const tenantId = import.meta.env.VITE_TENANT_ID;
  return tenantId ? { 'x-tenant-id': tenantId } : null;
};

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const headers = tenantHeader();
    const config = headers ? { headers } : undefined;
    const { data } = await http.post<LoginResponse>('/auth/login', payload, config);
    return data;
  },
};
