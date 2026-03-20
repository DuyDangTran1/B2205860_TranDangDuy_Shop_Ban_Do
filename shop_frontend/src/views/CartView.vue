<script>
import MyHeader from "@/components/header.vue";
import MyFooter from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
import cartService from "@/services/cart.service";

export default {
  components: {
    MyHeader,
    MyFooter,
    Loading,
  },

  data() {
    return {
      isLoading: true,
      cart: null,
      accessToken: sessionStorage.getItem("accessToken")
        ? sessionStorage.getItem("accessToken")
        : null,
    };
  },

  computed: {
    isAllSelected() {
      if (!this.cart || this.cart.length === 0) return false;
      return this.cart.every((item) => item.selected);
    },

    selectCount() {
      return this.cart?.filter((item) => item.selected).length || 0;
    },

    totalPrice() {
      return (
        this.cart?.reduce((total, item) => {
          return item.selected
            ? (total +=
                item.quantityInCart * item.price -
                item.quantityInCart * item.price * (item.discount / 100))
            : total;
        }, 0) || 0
      );
    },
  },

  methods: {
    async LoadData() {
      try {
        const response = await cartService.getCart(this.accessToken);
        this.cart = response.cart || [];
      } catch (error) {
        console.log(error);
      } finally {
        this.isLoading = false;
      }
    },

    toggleSelectAll(event) {
      const status = event.target.checked;
      this.cart.forEach((item) => {
        item.selected = status;
      });
    },

    async handleDecrease(item) {
      if (!item.old_quantity) item.old_quantity = item.quantityInCart;
      item.quantityInCart -= 1;
      await this.update(item);
    },

    async handleIncrease(item) {
      if (!item.old_quantity) item.old_quantity = item.quantityInCart;
      item.quantityInCart += 1;
      await this.update(item);
    },

    handleFocus(item) {
      if (item.old_quantity) item.old_quantity = item.quantityInCart;
    },

    async handleQtyChange(item) {
      if (item.quantityInCart < 1) item.quantityInCart = 1;
      if (item.quantityInCart > item.quantityInStock)
        item.quantityInCart = item.quantityInStock;
      await this.update(item);
    },
    async removeItem(item) {
      this.isLoading = true;
      try {
        await cartService.deleteCart(item.variant_id, this.accessToken);
        await this.LoadData();
      } catch (error) {
        console.log(error);
      } finally {
        this.isLoading = false;
      }
    },

    async update(item) {
      this.isLoading = true;
      try {
        await cartService.update(
          {
            variant_id: item.variant_id,
            quantity: item.quantityInCart,
          },
          this.accessToken,
        );
        item.old_quantity = item.quantityInCart;
      } catch (error) {
        item.quantityInCart = item.old_quantity;
        alert("Không thể cập nhật số lượng!");
      } finally {
        this.isLoading = false;
      }
    },

    async deleteAll() {
      try {
        const oldCart = this.cart;
        this.cart = [];

        await cartService.deleteAll(this.accessToken);
      } catch (error) {
        this.cart = oldCart;
        alert("Lỗi server. Vui lòng thử lại");
        console.log(error);
      }
    },
  },

  mounted() {
    this.LoadData();
  },
};
</script>

<template>
  <MyHeader></MyHeader>
  <div class="container">
    <h1 class="mt-5 mb-4">Giỏ Hàng</h1>
    <Loading :isLoading="isLoading" />
    <div v-if="!isLoading">
      <div class="cart_wrapper">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  :disabled="cart?.length === 0"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th scope="col" class="product">Sản phẩm</th>
              <th scope="col">Phân loại</th>
              <th scope="col">Số lượng</th>
              <th scope="col">Đơn giá</th>
              <th scope="col">Số tiền</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in cart" :key="index" class="cart-item">
              <td>
                <input type="checkbox" v-model="item.selected" />
              </td>
              <td>
                <div class="product_display">
                  <img
                    class="image rounded border"
                    :src="'http://localhost:3000/' + item.image"
                  />
                  <div class="ms-3 product-info">
                    <p class="product-name">
                      {{ item.product_name || "Sản phẩm " + (index + 1) }}
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <div class="variant-text">
                  {{ item.color_name }}, {{ item.size_name }}
                </div>
              </td>
              <td>
                <div class="quantity-group d-flex">
                  <button
                    :disabled="item.quantityInCart === 1"
                    class="btn-qty"
                    @click="handleDecrease(item)"
                  >
                    -
                  </button>
                  <input
                    class="input-qty"
                    type="number"
                    v-model.number="item.quantityInCart"
                    @focus="handleFocus(item)"
                    @change="handleQtyChange(item)"
                  />
                  <button
                    :disabled="item.quantityInCart === item.quantityInStock"
                    class="btn-qty"
                    @click="handleIncrease(item)"
                  >
                    +
                  </button>
                </div>
              </td>

              <td class="text-center">
                <div class="fw-medium">{{ item.price.toLocaleString() }}đ</div>
              </td>
              <td class="text-center fw-bold text-danger">
                {{ (item.price * item.quantityInCart).toLocaleString() }}đ
              </td>
              <td>
                <button
                  class="btn btn-sm btn-outline-danger border-0"
                  @click="removeItem(item)"
                >
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="wrap_select_pay">
          <div class="pay d-flex justify-content-between">
            <div class="wrap_select">
              <div class="wrap_input_select_all d-inline-block">
                <input
                  type="checkbox"
                  id="select_all"
                  :disabled="cart?.length === 0"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
              </div>
              <label for="select_all" class="select_all"
                >Chọn tất cả ({{ cart?.length }})</label
              >

              <button class="delete_all" v-on:click="deleteAll">
                Xóa tất cả
              </button>

              <button class="favorite_save">Lưu vào mục đã thích</button>
            </div>
            <div>
              <div class="total d-inline-flex me-2">
                Tổng cộng({{ selectCount }} sản phẩm):
                <div class="total_price fw-bold">
                  {{ totalPrice.toLocaleString() }}đ
                </div>
              </div>

              <button class="buy_merchandise">Mua hàng</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <MyFooter></MyFooter>
</template>

<style scoped>
.container {
  min-height: 510px;
}

.cart_wrapper {
  position: relative;
  overflow: visible;
}

.table {
  margin-bottom: 0;
  vertical-align: middle;
  border-collapse: separate;
  border-spacing: 0 15px;
  background-color: #f5f5f5;
}

.table thead th {
  border: none;
  padding: 15px;
  background-color: white !important;
  color: #888;
  font-weight: 400;
  text-transform: capitalize;
}

.cart-item {
  background-color: white;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.cart-item td {
  padding: 20px 15px;
  border-top: 1px solid #f2f2f2;
  border-bottom: 1px solid #f2f2f2;
}

table input[type="checkbox"] {
  accent-color: #533422;
  cursor: pointer;
}

.product-name {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.2rem;
}

.variant-text {
  color: rgba(0, 0, 0, 0.54);
  font-size: 0.85rem;
}

.btn-qty:hover {
  background-color: #f8f8f8;
}

thead tr th {
  background-color: #ac7657 !important;
  color: white;
  font-size: 1rem;
}

table input {
  width: 20px;
  height: 20px;
}

.product {
  width: 500px;
}

.product_display {
  display: flex;
  align-items: center;
  width: 100%;
}

.product_display p {
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  margin-bottom: 0;
}

.image {
  width: 90px;
  height: 90px;
  object-fit: cover;
}

.input-qty::-webkit-outer-spin-button,
.input-qty::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-qty {
  -moz-appearance: textfield;
  width: 50px;
  height: 32px;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.09);
  border-left: none;
  border-right: none;
  outline: none;
}

.btn-qty {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 0, 0, 0.09);
  background: white;
  cursor: pointer;
}

.wrap_select_pay {
  /* display: flex;
  align-items: center; */
  width: 100%;
  height: 150px;
  background-color: #f5f5f5;
}

.pay {
  position: sticky;
  align-items: center;
  font-size: 1.2rem;
  height: 133px;
  width: 100%;
  background-color: #fff;
}

.wrap_select {
  margin-left: 15px;
}

.select_all,
.total {
  padding: 20px 15px;
}

#select_all {
  width: 20px;
  height: 20px;
  transform: translateY(20%);
}

.delete_all {
  border: none;
  background-color: #fff;
  padding: 0 15px;
}

.favorite_save {
  border: none;
  background-color: #fff;
  color: #533422;
}

.total_price {
  color: #dc3545;
}

.buy_merchandise {
  margin-right: 15px;
  padding: 10px 80px;
  color: #fff;
  background-color: #ac7657;
  border: none;
  transition: all 0.3s ease;
}

.buy_merchandise:hover {
  background-color: #533422;
}
</style>
