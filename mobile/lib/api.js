import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Same API methods as web frontend
export const storyAPI = {
  create: (data) => api.post('/stories', data),
  getAll: () => api.get('/stories'),
  getOne: (id) => api.get(`/stories/${id}`),
  generateChapter: (id) => api.post(`/stories/${id}/chapters`),
  getChapters: (id) => api.get(`/stories/${id}/chapters`),
  getChapter: (storyId, chapterNumber) => api.get(`/stories/${storyId}/chapters/${chapterNumber}`),
  toggleBookmark: (id) => api.patch(`/stories/${id}/bookmark`),
  delete: (id) => api.delete(`/stories/${id}`),
};

export const vocabularyAPI = {
  save: (data) => api.post('/vocabulary', data),
  getAll: (params) => api.get('/vocabulary', { params }),
  getReview: () => api.get('/vocabulary/review'),
  updateReview: (id, correct) => api.post(`/vocabulary/${id}/review`, { correct }),
  translate: (word, fromLang, toLang) => api.post('/vocabulary/translate', { word, fromLang, toLang }),
  delete: (id) => api.delete(`/vocabulary/${id}`),
  getStats: () => api.get('/vocabulary/stats'),
};

export const progressAPI = {
  update: (data) => api.post('/progress', data),
  getStory: (storyId) => api.get(`/progress/story/${storyId}`),
  getStats: () => api.get('/progress/stats'),
  getAnalytics: () => api.get('/progress/analytics'),
};

export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  registerDevice: (data) => api.post('/users/devices', data),
};

export const subscriptionAPI = {
  createCheckout: (planType) => api.post('/subscriptions/checkout', { planType }),
  getStatus: () => api.get('/subscriptions/status'),
  cancel: () => api.post('/subscriptions/cancel'),
};

export default api;
