import api from '../api/axios';

export const getPendingUsers = async () => {
  const response = await api.get('/admin/pending-users');
  return Array.isArray(response.data) ? response.data : [];
};

export const approvePendingUser = async (id) => {
  return api.post(`/admin/approve/${id}`);
};

export const rejectPendingUser = async (id) => {
  return api.post(`/admin/reject/${id}`);
};
