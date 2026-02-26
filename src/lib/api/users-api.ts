import { http } from '@/lib/api/http';
import type { UserProfile } from '@/types/api';

interface BackendUserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface UpdateProfilePayload {
  fullName: string;
  email: string;
}

const toUserProfile = (user: BackendUserProfile): UserProfile => ({
  id: user.id,
  email: user.email,
  name: user.fullName,
  role: user.role as UserProfile['role'],
});

export const usersApi = {
  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const { data } = await http.put<BackendUserProfile>('/users/profile', payload);
    return toUserProfile(data);
  },
};
