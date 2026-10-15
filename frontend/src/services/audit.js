import api from '../api/axios';

export const getAuditLogs = async ({ page = 0, size = 25 } = {}) => {
  const response = await api.get(`/audit/logs?page=${page}&size=${size}`);
  return response.data;
};

export const getAuditStats = async () => {
  const response = await api.get('/audit/stats');
  return response.data;
};

export const getHighRiskLogs = async () => {
  const response = await api.get('/audit/high-risk');
  return Array.isArray(response.data) ? response.data : [];
};
export const getAuditAnalytics = async () => {
  const res = await fetch('/api/audit/analytics');
  return res.json();
};
export const getAuditCorrelation = async (id) => {
  const response = await api.get(`/audit/correlation/${id}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const exportAuditCsv = async () => {
  const response = await api.post('/audit/export/csv', {}, { responseType: 'blob' });
  return response.data;
};

export const exportAuditPdf = async () => {
  const response = await api.get('/audit/export/pdf', { responseType: 'blob' });
  return response.data;
};
