<script>
import cartService from "@/services/cart.service";
import MyHeader from "@/components/header.vue";
import MyFooter from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
import orderService from "@/services/order.service";
export default {
  components: {
    MyFooter,
    MyHeader,
    Loading,
  },

  data() {
    return {
      accessToken: sessionStorage.getItem("accessToken")
        ? sessionStorage.getItem("accessToken")
        : null,
      loading: true,
      cartItems: [],
      orderData: {
        fullName: "",
        phone: "",
        address: "",
        paymentMethod: "vnpay",
      },

      error: {},
    };
  },
  computed: {
    subTotal() {
      return this.cartItems.reduce((total, item) => {
        return total + item.price * item.quantityInCart;
      }, 0);
    },
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },
    async fetchCart() {
      // Gọi API lấy giỏ hàng từ CartService
      try {
        this.cartItems =
          (await cartService.getCart(this.accessToken)).cart || [];
      } catch (error) {
        console.log(error);
      } finally {
        this.loading = false;
      }
      // console.log(this.cartItems);
    },

    checkData() {
      if (!this.orderData.fullName) {
        this.error.error_name = "Không được bỏ trống tên người nhận";
      }

      if (!this.orderData.phone) {
        this.error.phone = "Không được bỏ trống số điện thoại người nhận";
      }

      if (!this.orderData.address) {
        this.error.address = "Không được bỏ trống địa chỉ nhận hàng";
      }

      if (!this.orderData.paymentMethod) {
        this.error.paymentMethod = "Phương thức thanh toán không phù hợp";
      }
    },

    async handleCheckout() {
      this.error = {};
      this.checkData();

      if (this.cartItems.length === 0) {
        confirm(
          "Hiện tại chưa có sản phẩm cần mua. Vui lòng quay lại lựa chọn hàng",
        );
        this.$router.push("/");
        return;
      }

      if (Object.keys(this.error).length === 0) {
        this.loading = true;
        try {
          // 1. Chuẩn bị dữ liệu
          const data = {
            recipient_name: this.orderData.fullName,
            phone: this.orderData.phone,
            address: this.orderData.address,
            pay_method: this.orderData.paymentMethod,
          };

          // 2. Gọi API tạo đơn và lấy link thanh toán
          const result = await orderService.addProduct(data, this.accessToken);

          if (result && result.paymentUrl) {
            // Chuyển hướng sang cổng thanh toán
            window.location.href = result.paymentUrl;
          } else {
            alert("Không nhận được link thanh toán từ server!");
            this.loading = false;
          }
        } catch (error) {
          console.error(error);
          alert("Có lỗi xảy ra trong quá trình tạo đơn hàng!");
          this.loading = false;
        }
      }
    },
  },
  mounted() {
    this.fetchCart();
  },
};
</script>
<template>
  <Loading :isLoading="loading" />
  <div v-if="!loading">
    <MyHeader></MyHeader>
    <div class="checkout-container container py-5">
      <div class="row g-4">
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm p-4 rounded-4 bg-white">
            <h4 class="mb-4 fw-bold text-brown">
              <i class="fa-solid fa-truck-fast me-2"></i>Thông tin nhận hàng
            </h4>
            <form @submit.prevent="handleCheckout">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label small fw-bold">Họ và tên</label>
                  <input
                    type="text"
                    v-model="orderData.fullName"
                    :class="{ 'is-invalid': error.error_name }"
                    class="form-control custom-input"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                  <div v-if="error.error_name" class="invalid-feedback">
                    {{ error.error_name }}
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">Số điện thoại</label>
                  <input
                    type="tel"
                    v-model="orderData.phone"
                    :class="{ 'is-invalid': error.phone }"
                    class="form-control custom-input"
                    placeholder="0901234567"
                    required
                  />
                  <div v-if="error.phone" class="invalid-feedback">
                    {{ error.phone }}
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold"
                    >Địa chỉ nhận hàng</label
                  >
                  <textarea
                    v-model="orderData.address"
                    class="form-control custom-input"
                    :class="{ 'is-invalid': error.address }"
                    rows="3"
                    placeholder="Số nhà, tên đường..."
                    required
                  ></textarea>
                  <div v-if="error.address" class="invalid-feedback">
                    {{ error.address }}
                  </div>
                </div>
              </div>

              <hr class="my-4" />

              <h4 class="mb-4 fw-bold text-brown">Thanh toán</h4>
              <div class="payment-methods">
                <label
                  class="payment-option mb-2"
                  :class="{ active: orderData.paymentMethod === 'vnpay' }"
                >
                  <input
                    type="radio"
                    v-model="orderData.paymentMethod"
                    value="vnpay"
                    class="d-none"
                  />
                  <div class="d-flex align-items-center">
                    <img
                      src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo-vnpay.png"
                      height="20"
                      class="me-3"
                    />
                    <span class="small fw-bold">VNPAY (ATM/QR)</span>
                  </div>
                  <i class="fa-solid fa-circle-check check-icon"></i>
                </label>

                <label
                  class="payment-option"
                  :class="{ active: orderData.paymentMethod === 'momo' }"
                >
                  <input
                    type="radio"
                    v-model="orderData.paymentMethod"
                    value="momo"
                    class="d-none"
                  />
                  <div class="d-flex align-items-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                      height="20"
                      class="me-3"
                    />
                    <span class="small fw-bold">Ví MoMo</span>
                  </div>
                  <i class="fa-solid fa-circle-check check-icon"></i>
                </label>
              </div>
            </form>
          </div>
        </div>

        <div class="col-lg-7">
          <div
            class="order-summary-card shadow-sm border-0 p-4 rounded-4 bg-white"
            style="top: 20px"
          >
            <h4 class="mb-4 fw-bold text-brown">Chi tiết đơn hàng</h4>

            <div class="product-list mb-4">
              <div
                class="row pb-2 border-bottom mb-2 mx-0 text-muted small fw-bold px-2 d-none d-md-flex"
              >
                <div class="col-5">Sản phẩm</div>
                <div class="col-2 text-center">Số lượng</div>
                <div class="col-2 text-center">Đơn giá</div>
                <div class="col-3 text-end">Thành tiền</div>
              </div>

              <div
                v-for="item in cartItems"
                :key="item.variant_id"
                class="row align-items-center py-3 border-bottom g-0 px-2"
              >
                <div
                  class="col-12 col-md-5 d-flex align-items-center mb-2 mb-md-0"
                >
                  <div class="product-img-mini">
                    <img
                      :src="`http://localhost:3000/${item.image}`"
                      class="rounded-2"
                      alt="product"
                    />
                  </div>
                  <div class="ms-3 overflow-hidden">
                    <p
                      class="p-name fw-bold mb-0 text-truncate"
                      style="font-size: 14px"
                    >
                      {{ item.product_name }}
                    </p>
                    <small class="text-muted"
                      >{{ item.color_name }} / {{ item.size_name }}</small
                    >
                  </div>
                </div>

                <div class="col-4 col-md-2 text-md-center">
                  <span class="d-md-none text-muted small">SL: </span>
                  <span class="fw-bold">x{{ item.quantityInCart }}</span>
                </div>

                <div class="col-4 col-md-2 text-md-center small text-muted">
                  {{ formatPrice(item.price) }}
                </div>

                <div class="col-4 col-md-3 text-end fw-bold text-brown">
                  {{ formatPrice(item.price * item.quantityInCart) }}
                </div>
              </div>
            </div>

            <div
              class="summary-footer p-3 rounded-3"
              style="background-color: #fdfaf8"
            >
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Tạm tính</span>
                <span class="fw-bold">{{ formatPrice(subTotal) }}</span>
              </div>
              <div
                class="d-flex justify-content-between mb-2 border-bottom pb-2"
              >
                <span class="text-muted">Phí vận chuyển</span>
                <span class="fw-bold" style="color: #ac7657">Miễn phí</span>
              </div>
              <div
                class="d-flex justify-content-between align-items-center pt-2"
              >
                <span class="fw-bold h5 mb-0">Tổng thanh toán</span>
                <span class="fw-bold h3 mb-0" style="color: #f00">{{
                  formatPrice(subTotal)
                }}</span>
              </div>
            </div>

            <button
              @click="handleCheckout"
              :disabled="loading"
              class="btn btn-brown w-100 py-3 mt-4 fw-bold shadow-sm"
            >
              <span v-if="!loading">XÁC NHẬN THANH TOÁN</span>
              <span v-else
                ><i class="fa-solid fa-spinner fa-spin me-2"></i>ĐANG XỬ
                LÝ...</span
              >
            </button>
          </div>
        </div>
      </div>
    </div>
    <MyFooter></MyFooter>
  </div>
</template>
<style scoped>
.text-brown {
  color: #533422;
}
.checkout-container {
  background: #fdfaf8;
  min-height: 100vh;
}

.custom-input {
  border-radius: 10px;
  border: 1px solid #eee;
  padding: 10px 15px;
}

.custom-input:focus {
  border-color: #ac7657;
  box-shadow: 0 0 0 0.2rem rgba(172, 118, 87, 0.1);
}

.order-summary-card {
  border-radius: 20px;
}

.product-img-mini {
  width: 55px;
  height: 55px;
  flex-shrink: 0;
}
.product-img-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-brown {
  background: #533422;
  color: white;
  border-radius: 12px;
  transition: all 0.3s;
}
.btn-brown:hover {
  background: #3d2619;
  color: #fff;
  transform: translateY(-2px);
}

.payment-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border: 1px solid #eee;
  border-radius: 12px;
  cursor: pointer;
}
.payment-option.active {
  border-color: #ac7657;
  background: #fdfaf8;
}

.check-icon {
  color: #ac7657;
  opacity: 0;
  transition: 0.3s;
}
.active .check-icon {
  opacity: 1;
}

.product-list {
  max-height: 500px;
  overflow-y: auto;
}
</style>
