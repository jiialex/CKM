import api from '../api/axios';

export const getCertificates = async () => {
  const response = await api.get('/certificates/ca-list');
  return Array.isArray(response.data) ? response.data : [];
};

export const getRevokedCertificates = async () => {
  const response = await api.get('/crl/revoked');
  return Array.isArray(response.data) ? response.data : [];
};

export const getMyRevokedCertificates = async () => {
  const response = await api.get('/crl/my-revoked');
  return Array.isArray(response.data) ? response.data : [];
};

export const verifyCertificateById = async (id) => {
  const response = await api.get(`/certificates/${id}/verify`);
  return response.data;
};

export const getCertificatePemById = async (id) => {
  const response = await api.get(`/certificates/${id}/pem`);
  return response.data;
};

export const revokeCertificateById = async (id, reason) => {
  return api.post(`/certificates/${id}/revoke?reason=${encodeURIComponent(reason)}`);
};

export const deleteCertificateById = async (id) => {
  return api.post(`/certificates/${id}/archive`);
};

export const generateCrlFile = async (caAlias, pin) => {
  const response = await api.post(
    `/crl/generate/${encodeURIComponent(caAlias)}?pin=${encodeURIComponent(pin)}`,
    {},
    { responseType: 'blob' },
  );
  return response.data;
};
