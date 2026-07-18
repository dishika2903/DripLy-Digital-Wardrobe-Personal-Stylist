import api from './api';

export const updateTheme = async (theme) => (await api.patch('/settings/theme', { theme: theme.toUpperCase() })).data;
