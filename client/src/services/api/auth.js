import api, { setAccessToken } from './api';

export const signup = async (data) => {
  const res = await api.post('/auth/signup', data);
  if (res.data?.success && res.data?.data?.accessToken) {
    setAccessToken(res.data.data.accessToken);
  }
  return res.data;
};

export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  if (res.data?.success && res.data?.data?.accessToken) {
    setAccessToken(res.data.data.accessToken);
  }
  return res.data;
};

export const refreshSession = async () => {
  const res = await api.post('/auth/refresh');
  if (res.data?.success && res.data?.data?.accessToken) {
    setAccessToken(res.data.data.accessToken);
  }
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  setAccessToken(null);
  return res.data;
};

export const logoutAll = async () => {
  const res = await api.post('/auth/logout-all');
  setAccessToken(null);
  return res.data;
};

export const forgotPassword = async (data) => {
  const res = await api.post('/auth/forgot-password', data);
  return res.data;
};

export const resetPassword = async (data) => {
  const res = await api.post('/auth/reset-password', data);
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.patch('/auth/me', data);
  return res.data;
};

export const uploadAvatar = async (formData) => (await api.patch('/auth/avatar', formData, { headers: { 'Content-Type': undefined } })).data;
export const changePassword = async (data) => (await api.patch('/auth/change-password', data)).data;
export const getAccountSummary = async () => (await api.get('/auth/account-summary')).data;
export const deleteAccount = async (data) => (await api.delete('/auth/me', { data })).data;
