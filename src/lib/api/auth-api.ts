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

const tenantHeader = (): Record<string, string> | null => {
  const tenantId = import.meta.env.VITE_TENANT_ID;
  return tenantId ? { 'x-tenant-id': tenantId } : null;
};

export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const headers = tenantHeader();
    const { data } = await http.post<any>(
      '/auth/login',
      payload,
      headers ? { headers } : undefined,
    );
    // Normaliza campos do backend (fullName → name, roles[] → role)
    return {
      ...data,
      user: {
        ...data.user,
        name: data.user.fullName ?? data.user.name,
        role: (data.user.roles?.[0] ?? data.user.role) as UserProfile['role'],
      },
    };
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    const headers = tenantHeader();
    await http.put('/auth/password', payload, headers ? { headers } : undefined);
  },
};
