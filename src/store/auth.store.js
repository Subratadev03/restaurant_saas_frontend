import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      restaurant: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, restaurant: user?.restaurant }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setRestaurant: (restaurant) => set({ restaurant }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null, restaurant: null }),

      isAuthenticated: () => !!get().accessToken,
      isOwner: () => ['restaurant_owner', 'super_admin'].includes(get().user?.role),
      isManager: () => ['restaurant_owner', 'manager', 'super_admin'].includes(get().user?.role),
      isSuperAdmin: () => get().user?.role === 'super_admin',
    }),
    {
      name: 'restaurant-saas-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        restaurant: state.restaurant,
      }),
    }
  )
);
