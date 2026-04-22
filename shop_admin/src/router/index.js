import { createRouter, createWebHistory } from "vue-router";
import { jwtDecode } from "jwt-decode";
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
      {
        path: "categories",
        name: "Category",
        component: () => import("@/Views/Category.vue"),
      },
      {
        path: "collections",
        name: "Collection",
        component: () => import("@/Views/Collection.vue"),
      },
      {
        path: "collections/:id",
        name: "CollectionDetail",
        component: () => import("@/Views/CollectionProduct.vue"),
      },

      {
        path: "vouchers",
        name: "Voucher",
        component: () => import("@/Views/VoucherManager.vue"),
      },
      {
        path: "products",
        name: "Products",
        component: () => import("@/Views/ProductManager.vue"),
      },
      {
        path: "products/add",
        name: "add",
        component: () => import("@/Views/CreateProduct.vue"),
      },
      {
        path: "suppliers",
        name: "Suppliers",
        component: () => import("@/Views/SupplierManager.vue"),
      },
      {
        path: "products/detail/:id",
        name: "product_detail",
        component: () => import("@/Views/ProductDetail.vue"),
      },
      {
        path: "products/edit/:id",
        name: "product_edit",
        component: () => import("@/Views/EditProduct.vue"),
      },
      {
        path: "users",
        name: "Users",
        component: () => import("@/Views/UserManager.vue"),
      },

      {
        path: "warehouse",
        name: "WareHouse",
        component: () => import("@/Views/WareHouseManager.vue"),
      },
      {
        path: "review",
        name: "Review",
        component: () => import("@/Views/ReviewManager.vue"),
      },
      {
        path: "statistical",
        name: "Statistical",
        component: () => import("@/Views/Statistical.vue"),
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/Views/Profile.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const accessToken = sessionStorage.getItem("accessToken");
  if (to.path !== "/login" && !accessToken) {
    return next("/login");
  }

  if (accessToken) {
    try {
      const decoded = jwtDecode(accessToken);
      const userRole = decoded.role;

      console.log(decoded);

      // Nếu đã Login mà cố vào lại trang Login -> Đẩy vào Dashboard
      if (to.path === "/login") {
        return next({ name: "Dashboard" });
      }

      // CHẶN QUYỀN: Nếu không phải Admin hoặc Staff thì không cho vào
      if (userRole !== "Quản trị viên" && userRole !== "Nhân viên") {
        alert("Tài khoản của bạn không có quyền truy cập vùng này!");

        sessionStorage.removeItem("accessToken");
        return next("/login");
      }
    } catch (error) {
      // Nếu token lỗi hoặc hết hạn
      sessionStorage.removeItem("accessToken");
      return next("/login");
    }
  }

  next();
});

export default router;
