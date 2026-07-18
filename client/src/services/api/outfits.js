import api from './api';

export const getOutfitSuggestions = async (params = {}) => (await api.get('/outfits/generate', { params })).data;
