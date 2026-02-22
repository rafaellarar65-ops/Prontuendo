import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth-api';
import { useAuthStore } from '@/lib/stores/auth-store';

export const useLoginMutation = () => {
  const signIn = useAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ accessToken, refreshToken, user }) => {
      signIn({ accessToken, refreshToken }, user);
    },
  });
};
