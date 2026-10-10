import { request } from './client';

export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
};

export const taskApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v)
    ).toString();
    return request(`/tasks${params ? `?${params}` : ''}`);
  },
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: changes }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
