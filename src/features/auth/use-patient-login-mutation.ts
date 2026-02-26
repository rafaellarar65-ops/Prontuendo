import { useMutation } from '@tanstack/react-query';
import { patientAuthApi } from '@/lib/api/patient-auth-api';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

export const usePatientLoginMutation = () => {
  const signIn = usePatientAuthStore((state) => state.signIn);

  return useMutation({
    mutationFn: patientAuthApi.login,
    onSuccess: ({ accessToken, refreshToken, user }) => {
      signIn({ accessToken, refreshToken }, { ...user, patientId: user.patientId ?? user.id });
    },
  });
};
