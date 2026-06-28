import api from './api.service.js';

export const orderService = {
  list:          (params)         => api.get('/orders', { params }),
  getById:       (id)             => api.get(`/orders/${id}`),
  create:        (data)           => api.post('/orders', data),
  updateStatus:  (id, status, reason) => api.patch(`/orders/${id}/status`, { status, reason }),
  recordPayment: (id, data)       => api.post(`/orders/${id}/payment`, data),
};
