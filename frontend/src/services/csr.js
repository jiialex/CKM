import api from "../api/axios";
 
export const getMyCsrs = async () => {
  const res = await api.get("/csr/my");
  return Array.isArray(res.data) ? res.data : [];
};
 
export const getAllCsrs = async () => {
  const res = await api.get("/csr/list");
  return Array.isArray(res.data) ? res.data : [];
};
 
// New Filtered Infrastructure Queues
export const getPendingEndEntityCsrs = async () => {
  const res = await api.get("/csr/pending/end-entity");
  return Array.isArray(res.data) ? res.data : [];
};
// Add these to your services file alongside your other exports:
 
export const getApprovedCsrs = async () => {
  const res = await api.get("/csr/approved");
  return Array.isArray(res.data) ? res.data : [];
};
 
export const getRejectedCsrs = async () => {
  const res = await api.get("/csr/rejected");
  return Array.isArray(res.data) ? res.data : [];
};
export const getPendingIntermediateCaCsrs = async () => {
  const res = await api.get("/csr/pending/intermediate-ca");
  return Array.isArray(res.data) ? res.data : [];
};
 
export const getPendingCsrs = async () => {
  const res = await api.get("/csr/pending");
  return Array.isArray(res.data) ? res.data : [];
};
 
export const getCsrById = async (id) => {
  const res = await api.get(`/csr/${id}`);
  return res.data;
};
 
export const deleteCsrById = async (id) => {
  return api.delete(`/csr/${id}`);
};
 
export const exportCsrById = async (id) => {
  const res = await api.get(`/csr/export/${id}`, { responseType: "blob" });
  return res.data;
};
 
export const importCsr = async (alias, pem) => {
  return api.post(`/csr/import?alias=${encodeURIComponent(alias)}`, pem, {
    headers: { "Content-Type": "text/plain" },
  });
};
 
// approveCsr performs real signing on the backend, so it needs to know
// WHICH CA signs the CSR (caAlias) and that CA's HSM PIN (caPin).
export const approveCsr = async (id, caAlias, caPin) => {
  return api.post(`/csr/${id}/approve`, { caAlias, caPin });
};
 
export const rejectCsr = async (id, reason) => {
  return api.post(`/csr/${id}/reject`, { reason });
};
 
export const withdrawCsr = async (id) => {
  return api.post(`/csr/${id}/withdraw`);
};