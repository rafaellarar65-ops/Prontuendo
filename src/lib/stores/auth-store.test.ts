import { useAuthStore } from '@/lib/stores/auth-store';

describe('authStore', () => {
  afterEach(() => {
    useAuthStore.getState().signOut();
  });

  it('should sign in and sign out user', () => {
    useAuthStore.getState().signIn(
      { accessToken: 'access', refreshToken: 'refresh' },
      { id: '1', name: 'Camila', email: 'camila@teste.com', role: 'MEDICO' },
    );

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().tokens?.accessToken).toBe('access');

    useAuthStore.getState().signOut();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().tokens).toBeNull();
  });
});
