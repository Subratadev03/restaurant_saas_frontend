import api from './api.service.js';

export const tableService = {
  getTables:          (params)    => api.get('/tables', { params }),
  getTable:           (id)        => api.get(`/tables/${id}`),
  createTable:        (data)      => api.post('/tables', data),
  updateTable:        (id, data)  => api.put(`/tables/${id}`, data),
  deleteTable:        (id)        => api.delete(`/tables/${id}`),
  updateTableStatus:  (id, status) => api.patch(`/tables/${id}/status`, { status }),

  getReservations:    (params)    => api.get('/reservations', { params }),
  createReservation:  (data)      => api.post('/reservations', data),
  updateReservation:  (id, data)  => api.put(`/reservations/${id}`, data),
  cancelReservation:  (id)        => api.post(`/reservations/${id}/cancel`),
};

export const menuService = {
  list:               (params)        => api.get('/menu-items', { params }),
  getById:            (id)            => api.get(`/menu-items/${id}`),
  create:             (data)          => api.post('/menu-items', data),
  update:             (id, data)      => api.put(`/menu-items/${id}`, data),
  delete:             (id)            => api.delete(`/menu-items/${id}`),
  toggle:             (id)            => api.patch(`/menu-items/${id}/toggle`),
  getCategories:      ()              => api.get('/menu-items/categories'),
  getRecipe:          (id)            => api.get(`/menu-items/${id}/recipe`),
  setRecipe:          (id, data)      => api.put(`/menu-items/${id}/recipe`, data),
  deleteRecipe:       (id)            => api.delete(`/menu-items/${id}/recipe`),
};

export const inventoryService = {
  listIngredients:    ()              => api.get('/ingredients'),
  createIngredient:   (data)          => api.post('/ingredients', data),
  restock:            (data)          => api.post('/stock/restock', data),
  getLowStockAlerts:  ()              => api.get('/stock/alerts'),
  getRecipe:          (menuItemId)    => api.get(`/recipes/${menuItemId}`),
  setRecipe:          (menuItemId, data) => api.put(`/recipes/${menuItemId}`, data),
};

export const posService = {
  listInvoices:     (params)        => api.get('/invoices', { params }),
  getInvoice:       (id)            => api.get(`/invoices/${id}`),
  generateInvoice:  (data)          => api.post('/invoices', data),
  listTaxes:        ()              => api.get('/taxes'),
  createTax:        (data)          => api.post('/taxes', data),
  listDiscounts:    ()              => api.get('/discounts'),
  createDiscount:   (data)          => api.post('/discounts', data),
  validateDiscount: (code, amount)  => api.get('/discounts', { params: { code, amount } }),
};

export const customerService = {
  list:          (params)          => api.get('/customers', { params }),
  getById:       (id)              => api.get(`/customers/${id}`),
  create:        (data)            => api.post('/customers', data),
  update:        (id, data)        => api.put(`/customers/${id}`, data),
  adjustPoints:  (id, data)        => api.post(`/customers/${id}/points`, data),
  redeemReward:  (id, data)        => api.post(`/customers/${id}/redeem`, data),
  listRewards:   ()                => api.get('/rewards'),
  createReward:  (data)            => api.post('/rewards', data),
};
