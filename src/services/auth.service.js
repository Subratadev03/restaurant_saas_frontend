import api from './api.service.js';

export const authService = {
  login:   (credentials) => api.post('/auth/login', credentials),
  register:(data)        => api.post('/auth/register', data),
  logout:  ()            => api.post('/auth/logout'),
  refresh: (refreshToken)=> api.post('/auth/refresh', { refreshToken }),
  getRoles:()            => api.get('/auth/roles'),
};

export const restaurantService = {
  list:           (params)          => api.get('/restaurants', { params }),
  getById:        (id)              => api.get(`/restaurants/${id}`),
  update:         (id, data)        => api.put(`/restaurants/${id}`, data),
  updateSettings: (id, settings)    => api.put(`/restaurants/${id}/settings`, settings),
  getStaff:       (id)              => api.get(`/restaurants/${id}/staff`),
  createStaff:    (restaurantId, data) => api.post(`/restaurants/${restaurantId}/staff`, data),
};
