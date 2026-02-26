const token =
  useAuthStore.getState().tokens?.accessToken ??
  usePatientAuthStore.getState().tokens?.accessToken;
const tenantId = resolveTenantId();
