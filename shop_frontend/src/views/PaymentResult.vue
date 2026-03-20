<script>
import orderService from "@/services/order.service";
export default {
  data() {
    return {
      // VNPAY trả về ResponseCode = "00" là thành công
      isSuccess: false,
      orderId: this.$route.query.vnp_TxnRef,
      amount: this.$route.query.vnp_Amount / 100, // Chia 100 vì VNPAY nhân 100
      accessToken: sessionStorage.getItem("accessToken")
        ? sessionStorage.getItem("accessToken")
        : null,
      isLoading: true,
    };
  },
  methods: {
    formatPrice(value) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    },

    async result() {
      const queryParams = this.$route.query;

      // 1. TRƯỜNG HỢP VNPAY
      if (queryParams.vnp_ResponseCode) {
        if (queryParams.vnp_ResponseCode === "00") {
          try {
            const response = await orderService.resultReturn(
              queryParams,
              this.accessToken,
            );
            this.isSuccess = response.success;
            // Cập nhật lại orderId và amount để hiển thị cho VNPAY
            this.orderId = queryParams.vnp_TxnRef;
            this.amount = queryParams.vnp_Amount / 100;
          } catch (error) {
            this.isSuccess = false;
          }
        } else {
          this.isSuccess = false;
        }
      }

      // Trường hợp đối với momo
      else if (queryParams.resultCode) {
        if (queryParams.resultCode === "0") {
          try {
            // Gọi service MoMo
            const response = await orderService.resultReturnMomo(
              queryParams,
              this.accessToken,
            );
            this.isSuccess = response.success;
            this.orderId = queryParams.orderId;
            this.amount = queryParams.amount;
          } catch (error) {
            this.isSuccess = false;
          }
        } else {
          this.isSuccess = false;
        }
      }
    },
  },

  mounted() {
    this.result();
  },
};
</script>

<template>
  <div class="container py-5 text-center">
    <div
      v-if="isSuccess"
      class="result-card p-5 border border-dark-2 shadow rounded-4 bg-white"
    >
      <i class="fa-solid fa-circle-check text-success display-1 mb-4"></i>
      <h2 class="fw-bold text-success">Thanh toán thành công!</h2>
      <p class="text-muted">
        Đơn hàng <strong>#{{ orderId }}</strong> của bạn đã được xác nhận.
      </p>
      <p class="small text-muted">Số tiền: {{ formatPrice(amount) }}</p>
      <router-link to="/" class="btn btn-brown mt-3 px-4"
        >Tiếp tục mua sắm</router-link
      >
    </div>

    <div v-else class="result-card p-5 shadow rounded-4 bg-white">
      <i class="fa-solid fa-circle-xmark text-danger display-1 mb-4"></i>
      <h2 class="fw-bold text-danger">Thanh toán thất bại</h2>
      <p class="text-muted">Giao dịch không thành công hoặc đã bị hủy.</p>
      <router-link to="/checkout" class="btn btn-outline-brown mt-3"
        >Thử lại</router-link
      >
    </div>
  </div>
</template>
<style scoped>
.result-card {
  max-width: 600px;
  margin: 0 auto;
}

.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
  transition: all 0.3s ease;
}

.btn-brown:hover {
  background-color: #3d2619 !important;
  color: #ffffff !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.text-success {
  color: #28a745 !important;
}
</style>
