import { createRouter, createWebHistory } from "vue-router";
import Login from "@/Views/Login.vue";
import Admin from "@/Views/Admin.vue";
const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
  },

  {
    path: "/",
    component: Admin,
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/Views/Dashboard.vue"),
      },
      {
        path: "staff",
        name: "Staff",
        component: () => import("@/Views/StaffManager.vue"),
      },

      {
        path: "orders",
        name: "Order",
        component: () => import("@/Views/OrderManager.vue"),
      },
      {
        path: "admin-chat",
        name: "Consult",
        component: () => import("@/Views/Consult.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
