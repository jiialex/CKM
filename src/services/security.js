import api from '../api/axios';

export const getSecurityAlerts = async () => {
  const response = await api.get('/security/alerts');
  return Array.isArray(response.data) ? response.data : [];
};

export const getSecurityStats = async () => {
  const response = await api.get('/security/stats');
  return response.data ?? {};
};

export const revokeSecurityThreatById = async (id) => {
  return api.delete(`/security/revoke/${id}`);
};
