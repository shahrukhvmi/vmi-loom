import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("auth_token", token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem("auth_token");
        set({ user: null, token: null });
      },
    }),
    {
      name: "recrd-auth",
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
