import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import RegisterView from "@/views/RegisterView.vue";
import LoginView from "@/views/LoginView.vue";
import ProductView from "@/views/ProductView.vue";
import DetailProductView from "@/views/DetailProductView.vue";
import CartView from "@/views/CartView.vue";
import AboutView from "@/views/AboutView.vue";
import CheckOutView from "@/views/CheckOutView.vue";
import PaymentResult from "@/views/PaymentResult.vue";
import OrderHistoryView from "@/views/OrderHistoryView.vue";
import Error404View from "@/views/Error404View.vue";
import Profile from "@/views/Profile.vue";
import CollectionDetail from "@/views/CollectionDetail.vue";
const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },

  {
    path: "/register",
    name: "Register",
    component: RegisterView,
  },

  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },

  {
    path: "/category/:slug",
    name: "category",
    component: ProductView,
  },

  {
    path: "/detail/:id",
    name: "Detail",
    component: DetailProductView,
  },

  {
    path: "/cart",
    name: "Cart",
    component: CartView,
  },

  {
    path: "/about",
    name: "About",
    component: AboutView,
  },

  {
    path: "/checkout",
    name: "CheckOut",
    component: CheckOutView,
  },

  {
    path: "/payment/result",
    name: "PaymentResult",
    component: PaymentResult,
  },
  {
    path: "/order/history",
    name: "OrderHistory",
    component: OrderHistoryView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: Error404View,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/collection/:id",
    name: "CollectionProducts",
    component: CollectionDetail,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const accessToken = sessionStorage.getItem("accessToken") || null;

  // Danh sách các Route yêu cầu phải có accessToken mới được vào
  const requiresAuth = ["Cart", "CheckOut", "OrderHistory"];

  // Kiểm tra xem trang sắp tới có nằm trong danh sách cấm không
  if (requiresAuth.includes(to.name) && !accessToken) {
    // Nếu trang yêu cầu login mà chưa có token về trang Login
    alert("Vui lòng đăng nhập để có thể truy cập vào trang này");
    return next({ name: "Login" });
  }

  // Nếu đã đăng nhập mà cố tình vào lại trang Login/Register -> về Home
  if (accessToken && (to.name === "Login" || to.name === "Register")) {
    return next({ name: "Home" });
  }

  next();
});

export default router;
