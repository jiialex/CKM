import api from '../api/axios';

export const getUsers = async () => {
  const response = await api.get('/users');
  return Array.isArray(response.data) ? response.data : [];
};

export const deleteUserById = async (id) => {
  return api.delete(`/users/${id}`);
};
