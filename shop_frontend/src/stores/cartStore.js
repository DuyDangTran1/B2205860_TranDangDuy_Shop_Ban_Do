import { defineStore } from "pinia";
import cartService from "@/services/cart.service";
export const useCartStore = defineStore("cart", {
  state: () => ({
    count: 0,
  }),
  actions: {
    async fetchCount() {
      try {
        const res = await cartService.getCart();
        const items = res.cart || [];
        this.count = items.reduce(
          (total, item) => total + item.quantityInCart,
          0,
        );
      } catch (error) {
        this.count = 0;
        // console.log("Chưa đăng nhập hoặc lỗi giỏ hàng");
      }
    },

    updateTotalCount(cartItems) {
      this.count = cartItems.reduce(
        (total, item) => total + item.quantityInCart,
        0,
      );
    },
  },
});
