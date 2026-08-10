import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    name: sessionStorage.getItem("name") || "",
    role: sessionStorage.getItem("role") || "",
    permissions: JSON.parse(sessionStorage.getItem("permissions")) || [],
    isAuthenticated: false,
  }),
  actions: {
    setUser(userData) {
      this.name = userData.name;
      this.role = userData.role;
      this.permissions = userData.permissions || [];
      this.isAuthenticated = true;
    },

    // Hàm cập nhật riêng mỗi permissions khi refresh token
    setPermissions(newPermissions) {
      this.permissions = newPermissions;
      sessionStorage.setItem("permissions", JSON.stringify(newPermissions));
    },
  },

  getters: {
    hasPermission: (state) => (permissionCode) => {
      if (state.role === "Quản trị viên") return true;
      return state.permissions.includes(permissionCode);
    },
  },
});
