import api from './api';

export const createClothingItem = async (formData) => {
  const res = await api.post('/wardrobe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const updateClothingItem = async (id, formData) => {
  const res = await api.put(`/wardrobe/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteClothingItem = async (id) => {
  const res = await api.delete(`/wardrobe/${id}`);
  return res.data;
};

export const getClothingItem = async (id) => {
  const res = await api.get(`/wardrobe/${id}`);
  return res.data;
};

export const getWardrobe = async (params = {}) => {
  const res = await api.get('/wardrobe', { params });
  return res.data;
};

export const classifyClothing = async (file) => {
  const formData = new FormData(); formData.append('image', file);
  return (await api.post('/ai/classify', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
