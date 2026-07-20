import api from './api';

export const getOutfitSuggestions = async (params = {}) => (await api.get('/outfits/generate', { params })).data;
export const getAiOutfitSuggestions = async (payload) => (await api.post('/outfits/suggest', payload)).data;

export const saveOutfit = async (outfit) => (await api.post('/outfits', outfit)).data;
export const getSavedOutfits = async (params = {}) => (await api.get('/outfits', { params })).data;
export const toggleOutfitFavorite = async (id, isFavorite) => (await api.patch(`/outfits/${id}/favorite`, { isFavorite })).data;
export const deleteOutfit = async (id) => (await api.delete(`/outfits/${id}`)).data;
export const rateOutfit = async (id, rating) => (await api.patch(`/outfits/${id}/rate`, { rating })).data;
