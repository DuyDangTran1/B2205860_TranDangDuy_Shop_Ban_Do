<script>
import orderService from "@/services/order.service";
import Loading from "@/components/Loading.vue";

export default {
  components: {
    Loading,
  },
  data() {
    return {
      isSuccess: false,
      orderId: "",
      amount: 0,
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

      try {
        //TRƯỜNG HỢP VNPAY
        if (queryParams.vnp_ResponseCode) {
          if (queryParams.vnp_ResponseCode === "00") {
            const response = await orderService.resultReturn(queryParams);
            this.isSuccess = response.success;
            this.orderId = queryParams.vnp_TxnRef;
            this.amount = queryParams.vnp_Amount / 100;
          }
        }
        //TRƯỜNG HỢP MOMO
        else if (queryParams.resultCode) {
          if (queryParams.resultCode === "0") {
            const response = await orderService.resultReturnMomo(queryParams);
            this.isSuccess = response.success;
            this.orderId = queryParams.orderId;
            this.amount = queryParams.amount;
          }
        }
      } catch (error) {
        console.error("Lỗi xác nhận thanh toán:", error);
        this.isSuccess = false;
      } finally {
        this.isLoading = false;
      }
    },
  },

  mounted() {
    this.result();
  },
};
</script>

<template>
  <loading :isLoading="isLoading"></loading>
  <div v-if="!isLoading">
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
