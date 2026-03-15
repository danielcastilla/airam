import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  
  getProfile: () => api.get('/auth/profile'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Applications API
export const applicationsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/applications', { params }),
  
  getById: (id: string) => api.get(`/applications/${id}`),
  
  create: (data: Record<string, unknown>) =>
    api.post('/applications', data),
  
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/applications/${id}`, data),
  
  delete: (id: string) => api.delete(`/applications/${id}`),
  
  getTechnologies: (id: string) =>
    api.get(`/applications/${id}/technologies`),
  
  addTechnology: (id: string, data: Record<string, unknown>) =>
    api.post(`/applications/${id}/technologies`, data),
  
  removeTechnology: (id: string, techId: string) =>
    api.delete(`/applications/${id}/technologies/${techId}`),
  
  getPersons: (id: string) =>
    api.get(`/applications/${id}/persons`),
};

// Technologies API
export const technologiesApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/technologies', { params }),
  
  getById: (id: string) => api.get(`/technologies/${id}`),
  
  create: (data: Record<string, unknown>) =>
    api.post('/technologies', data),
  
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/technologies/${id}`, data),
  
  delete: (id: string) => api.delete(`/technologies/${id}`),
  
  getObsolete: () => api.get('/technologies/obsolete'),
  
  getCategories: () => api.get('/technologies/categories'),
  
  getApplications: (id: string) =>
    api.get(`/technologies/${id}/applications`),
};

// Interfaces API
export const interfacesApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/interfaces', { params }),
  
  getById: (id: string) => api.get(`/interfaces/${id}`),
  
  getByApplication: (appId: string) =>
    api.get(`/interfaces/application/${appId}`),
  
  create: (data: Record<string, unknown>) =>
    api.post('/interfaces', data),
  
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/interfaces/${id}`, data),
  
  delete: (id: string) => api.delete(`/interfaces/${id}`),
};

// Persons API
export const personsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/persons', { params }),
  
  getById: (id: string) => api.get(`/persons/${id}`),
  
  create: (data: Record<string, unknown>) =>
    api.post('/persons', data),
  
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/persons/${id}`, data),
  
  delete: (id: string) => api.delete(`/persons/${id}`),
  
  getTeams: () => api.get('/persons/teams'),
  
  getDepartments: () => api.get('/persons/departments'),
  
  getApplications: (id: string) =>
    api.get(`/persons/${id}/applications`),
};

// Dependencies API
export const dependenciesApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/dependencies', { params }),
  
  getById: (id: string) => api.get(`/dependencies/${id}`),
  
  getByApplication: (appId: string) =>
    api.get(`/dependencies/application/${appId}`),
  
  create: (data: Record<string, unknown>) =>
    api.post('/dependencies', data),
  
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/dependencies/${id}`, data),
  
  delete: (id: string) => api.delete(`/dependencies/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  
  getGraph: () => api.get('/dashboard/graph'),
  
  getLegacyApplications: () => api.get('/dashboard/legacy'),
};

// Impact API
export const impactApi = {
  analyze: (appId: string) => api.get(`/impact/analyze/${appId}`),
  
  getChain: (sourceId: string, targetId: string) =>
    api.get(`/impact/chain/${sourceId}/${targetId}`),
};

// Business Applications API
export const businessApplicationsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/business-applications', { params }),
  
  getById: (id: string) => api.get(`/business-applications/${id}`),
  
  create: (data: Record<string, unknown>) =>
    api.post('/business-applications', data),
  
  update: (id: string, data: Record<string, unknown>) =>
    api.put(`/business-applications/${id}`, data),
  
  delete: (id: string) => api.delete(`/business-applications/${id}`),
  
  getDomains: () => api.get('/business-applications/domains'),
  
  getCapabilities: () => api.get('/business-applications/capabilities'),
  
  getLinkedApplications: (id: string) =>
    api.get(`/business-applications/${id}/applications`),
  
  linkApplication: (id: string, appId: string, notes?: string) =>
    api.post(`/business-applications/${id}/applications/${appId}`, { notes }),
  
  unlinkApplication: (id: string, appId: string) =>
    api.delete(`/business-applications/${id}/applications/${appId}`),
};

export default api;
