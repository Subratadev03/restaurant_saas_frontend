import { create } from 'zustand';

export const useOrderStore = create((set, get) => ({
  cart: [],
  tableNumber: '',
  tableId: null,
  orderType: 'dine_in',
  customerId: null,

  setTableNumber: (tableNumber) => set({ tableNumber }),
  setTableId: (tableId) => set({ tableId }),
  setOrderType: (orderType) => set({ orderType }),
  setCustomerId: (customerId) => set({ customerId }),

  addItem: (item) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      set({ cart: cart.map((i) => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i) });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (menuItemId) =>
    set({ cart: get().cart.filter((i) => i.menuItemId !== menuItemId) }),

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) return get().removeItem(menuItemId);
    set({ cart: get().cart.map((i) => i.menuItemId === menuItemId ? { ...i, quantity } : i) });
  },

  clearCart: () => set({ cart: [], tableNumber: '', tableId: null, customerId: null }),

  total: () => get().cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
}));
