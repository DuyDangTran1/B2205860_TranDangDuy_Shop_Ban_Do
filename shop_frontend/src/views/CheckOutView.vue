<script>
import cartService from "@/services/cart.service";
import MyHeader from "@/components/header.vue";
import MyFooter from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
import orderService from "@/services/order.service";
import voucherService from "@/services/voucher.service";
import Swal from "sweetalert2";
export default {
  components: {
    MyFooter,
    MyHeader,
    Loading,
  },

  data() {
    return {
      loading: true,
      cartItems: [],
      orderData: {
        fullName: "",
        phone: "",
        address: "",
        paymentMethod: "vnpay",
      },
      vouchers: [],
      appliedVoucher: null,
      discountAmount: 0,
      voucherCode: "",
      error: {},
    };
  },
  computed: {
    subTotal() {
      return this.cartItems.reduce((total, item) => {
        const discountPrice = item.price * (1 - (item.discount || 0) / 100);
        return total + discountPrice * item.quantityInCart;
      }, 0);
    },
    finalTotal() {
      const total = this.subTotal - this.discountAmount;
      return total > 0 ? total : 0;
    },
  },
  methods: {
    async fetchVouchers() {
      try {
        const res = await voucherService.getVoucherUser();
        this.vouchers = res.vouchers || [];
      } catch (e) {
        console.error("Lỗi lấy voucher:", e);
      }
    },

    async selectVoucher(v) {
      if (this.appliedVoucher === v.voucher_code) {
        this.appliedVoucher = null;
        this.discountAmount = 0;
        this.voucherCode = "";
        return;
      }
      this.voucherCode = v.voucher_code;
      await this.handleApplyVoucher();
    },

    async handleApplyVoucher() {
      const code = this.voucherCode.trim();
      if (!code) return;

      try {
        const res = await voucherService.checkVoucher(
          `code=${code}&amount=${this.subTotal}`,
        );

        if (res.success) {
          this.appliedVoucher = res.voucher_code;
          this.discountAmount = res.discountAmount;
        }
      } catch (error) {
        alert(
          error.response?.data?.message ||
            "Mã không hợp lệ hoặc không đủ điều kiện",
        );
        this.appliedVoucher = null;
        this.discountAmount = 0;
      }
    },

    getItemFromCart() {
      const source = this.$route.query.from;
      let data = null;

      if (source === "quick") {
        data = sessionStorage.getItem("quickBuyItem");
      } else {
        data = sessionStorage.getItem("purchaseItems");
      }

      if (!data) {
        Swal.fire({
          icon: "warning",
          title: "Thông báo",
          text: "Không tìm thấy sản phẩm cần thanh toán",
          confirmButtonColor: "#533422",
        }).then(() => {
          this.$router.push("/");
        });
        return;
      }

      try {
        const items = JSON.parse(data);
        if (!items || items.length === 0) {
          this.$router.push("/");
          return;
        }
        this.cartItems = items;
      } catch (e) {
        this.$router.push("/");
      }
    },

    formatPrice(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    checkData() {
      let isValid = true;
      this.error = {};

      if (!this.orderData.fullName.trim()) {
        this.error.error_name = "Không được bỏ trống tên người nhận";
        isValid = false;
      }
      if (!this.orderData.phone.trim()) {
        this.error.phone = "Không được bỏ trống số điện thoại";
        isValid = false;
      } else if (!/^\d{10}$/.test(this.orderData.phone.trim())) {
        this.error.phone = "Số điện thoại không hợp lệ (10 chữ số)";
        isValid = false;
      }
      if (!this.orderData.address.trim()) {
        this.error.address = "Không được bỏ trống địa chỉ";
        isValid = false;
      }
      return isValid;
    },

    async handleCheckout() {
      if (!this.checkData()) return;

      if (this.cartItems.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Chưa có sản phẩm để thanh toán!",
          confirmButtonColor: "#533422",
        });
        this.$router.push("/");
        return;
      }

      this.loading = true;
      try {
        const isQuickBuy = this.$route.query.from === "quick";
        const data = {
          recipient_name: this.orderData.fullName,
          phone: this.orderData.phone,
          address: this.orderData.address,
          pay_method: this.orderData.paymentMethod,
          items: this.cartItems,
          applied_voucher: this.appliedVoucher,
          discount_amount: this.discountAmount,
          total_price: this.finalTotal,
          is_quick_buy: isQuickBuy,
        };

        const result = await orderService.addProduct(data);

        if (this.orderData.paymentMethod !== "cod") {
          if (result?.paymentUrl) {
            sessionStorage.removeItem(
              isQuickBuy ? "quickBuyItem" : "purchaseItems",
            );
            window.location.href = result.paymentUrl;
          } else {
            throw new Error("Không nhận được link thanh toán!");
          }
        } else {
          this.isLoading = false;
          Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Đặt hàng thành công!",
            confirmButtonColor: "#533422",
          }).then(() => {
            sessionStorage.removeItem(
              isQuickBuy ? "quickBuyItem" : "purchaseItems",
            );
            this.$router.push("/order/history");
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi tạo đơn",
          text: error.response?.data?.message || "Lỗi tạo đơn hàng!",
          confirmButtonColor: "#533422",
        });
        this.loading = false;
      }
    },
  },
  mounted() {
    this.getItemFromCart();
    this.fetchVouchers();
    this.$nextTick(() => {
      this.loading = false;
    });
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
                      src="../../public/images/avatar_default/vnpay.png"
                      height="25"
                      class="me-3"
                      style="object-fit: contain"
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
                      src="../../public/images/avatar_default/Logo-MoMo-Square.webp"
                      height="25"
                      class="me-3"
                      style="object-fit: contain"
                    />
                    <span class="small fw-bold">Ví MoMo</span>
                  </div>
                  <i class="fa-solid fa-circle-check check-icon"></i>
                </label>
                <label
                  class="payment-option mb-2"
                  :class="{ active: orderData.paymentMethod === 'cod' }"
                >
                  <input
                    type="radio"
                    v-model="orderData.paymentMethod"
                    value="cod"
                    class="d-none"
                  />
                  <div class="d-flex align-items-center">
                    <i
                      class="fa-solid fa-money-bill-1-wave fs-5 me-3 text-success"
                    ></i>
                    <span class="small fw-bold"
                      >Thanh toán khi nhận hàng (COD)</span
                    >
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
                  {{
                    formatPrice(item.price * (1 - (item.discount || 0) / 100))
                  }}
                </div>
                <div class="col-4 col-md-3 text-end fw-bold text-brown">
                  {{
                    formatPrice(
                      item.price *
                        (1 - (item.discount || 0) / 100) *
                        item.quantityInCart,
                    )
                  }}
                </div>
              </div>
            </div>

            <div
              class="summary-footer p-3 rounded-3"
              style="background-color: #fdfaf8"
            >
              <div
                class="voucher-scroll d-flex flex-column gap-2"
                style="max-height: 200px; overflow-y: auto"
              >
                <template v-if="vouchers.length > 0">
                  <div
                    v-for="v in vouchers"
                    :key="v._id"
                    class="voucher-card d-flex align-items-center p-2 border rounded-3 position-relative"
                    :class="{ 'v-active': appliedVoucher === v.voucher_code }"
                    @click="selectVoucher(v)"
                  >
                    <div class="v-left text-danger border-end px-3">
                      <i class="fa-solid fa-gift fs-4"></i>
                    </div>

                    <div class="v-right ps-3 flex-grow-1">
                      <div class="fw-bold small text-uppercase">
                        {{ v.voucher_code }}
                      </div>

                      <div class="x-small text-danger fw-bold">
                        Còn lại: {{ v.usage_limit - (v.used_count || 0) }} lượt
                        dùng
                      </div>

                      <div class="text-dark x-small">
                        Giảm:
                        {{
                          v.discount_type === "percent"
                            ? v.discount_value + "%"
                            : formatPrice(v.discount_value)
                        }}
                        <span
                          v-if="
                            v.discount_type === 'percent' && v.max_discount > 0
                          "
                          class="text-secondary"
                        >
                          (Tối đa {{ formatPrice(v.max_discount) }})
                        </span>
                      </div>
                      <div class="text-muted x-small">
                        Đơn tối thiểu: {{ formatPrice(v.min_order_value) }}
                      </div>
                    </div>

                    <i
                      v-if="appliedVoucher === v.voucher_code"
                      class="fa-solid fa-circle-check text-success ms-2"
                    ></i>
                  </div>
                </template>

                <div
                  v-else
                  class="text-center py-4 bg-light rounded-3 border border-dashed"
                >
                  <i
                    class="fa-solid fa-ticket-simple mb-2 text-muted"
                    style="font-size: 2rem; opacity: 0.3"
                  ></i>
                  <p class="text-muted small mb-0">
                    Hiện chưa có voucher phù hợp dành cho bạn.
                  </p>
                </div>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Tạm tính</span>
                <span class="fw-bold">{{ formatPrice(subTotal) }}</span>
              </div>
              <div
                v-if="discountAmount > 0"
                class="d-flex justify-content-between mb-2 text-danger"
              >
                <span class="small fw-bold"
                  >Voucher giảm giá ({{ appliedVoucher }})</span
                >
                <span class="fw-bold">- {{ formatPrice(discountAmount) }}</span>
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
                  formatPrice(finalTotal)
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
/* Giữ nguyên CSS cũ của Duy */
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
  border: none;
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
.btn-outline-brown {
  border: 1px solid #533422;
  color: #533422;
  transition: 0.3s;
  border-radius: 10px;
}
.btn-outline-brown:hover {
  background: #533422;
  color: white;
}
.voucher-card {
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  margin-bottom: 8px;
}

.voucher-card:hover {
  border-color: #ac7657;
  background-color: #fdfaf8;
}

.v-active {
  border-color: #ac7657 !important;
  background-color: #fff9f6 !important;
  border-width: 2px !important;
}

.x-small {
  font-size: 0.75rem;
}
</style>
