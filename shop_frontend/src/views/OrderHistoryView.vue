<script>
import MyHeader from "@/components/header.vue";
import MyFooter from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
import orderService from "@/services/order.service";

export default {
  components: { MyHeader, MyFooter, Loading },
  data() {
    return {
      isLoading: true,
      orders: [],
      activeTab: "all",
      accessToken: sessionStorage.getItem("accessToken") || null,
    };
  },
  computed: {
    filteredOrders() {
      if (!this.orders) return [];
      if (this.activeTab === "all") return this.orders;

      const tabMap = {
        pending: "Đang chờ xác nhận",
        shipping: "Đang giao",
        completed: "Đã giao",
        cancelled: "Đã hủy",
      };
      return this.orders.filter(
        (o) => o.order_status === tabMap[this.activeTab],
      );
    },
  },
  methods: {
    async LoadData() {
      this.isLoading = true;
      try {
        const response = await orderService.getAllOrdersByUser(
          this.accessToken,
        );
        this.orders = response.orders || [];
      } catch (error) {
        console.error("Lỗi lấy lịch sử đơn hàng:", error);
      } finally {
        this.isLoading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    },
    async confirmReceived(orderId) {
      if (!confirm("Bạn xác nhận đã nhận được kiện hàng này?")) return;
      try {
        await orderService.receiveConfirm(orderId, this.accessToken);
        await this.LoadData();
      } catch (error) {
        console.log(error);
        alert("Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    },
  },
  mounted() {
    this.LoadData();
  },
};
</script>

<template>
  <MyHeader />
  <div class="container py-5 min-vh-100">
    <h2 class="fw-bold mb-4 text-dark-brown">
      <i class="fas fa-history me-2"></i>Lịch sử mua hàng
    </h2>

    <div
      class="tab-wrapper mb-4 shadow-sm rounded-3 overflow-hidden bg-white d-flex"
    >
      <button
        v-for="tab in [
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: 'Chờ duyệt' },
          { id: 'shipping', label: 'Đang giao' },
          { id: 'completed', label: 'Hoàn tất' },
          { id: 'cancelled', label: 'Đã hủy' },
        ]"
        :key="tab.id"
        class="tab-item flex-grow-1 border-0 py-3 fw-bold transition-all"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <Loading :isLoading="isLoading" />

    <div v-if="!isLoading">
      <div
        v-for="order in filteredOrders"
        :key="order._id"
        class="order-card mb-4 bg-white shadow-sm rounded-3 overflow-hidden"
      >
        <div
          class="order-header d-flex justify-content-between align-items-center p-3 border-bottom bg-light"
        >
          <div class="fw-bold text-dark-brown">
            <i class="fas fa-receipt me-2"></i>Mã đơn: #{{
              order._id.slice(-6).toUpperCase()
            }}
          </div>
          <div class="status-badge" :class="order.order_status">
            Trạng thái:
            {{ order.order_status || "Đang chờ xác nhận" }}
          </div>
        </div>

        <div class="order-body p-3">
          <div
            v-for="item in order.items"
            :key="item.variant_id"
            class="product-row d-flex align-items-center py-3"
          >
            <img
              :src="'http://localhost:3000/' + item.image"
              class="rounded border shadow-sm item-img"
            />
            <div class="ms-3 flex-grow-1">
              <h6 class="fw-bold mb-1">{{ item.product_name }}</h6>
              <div class="text-muted small">
                Phân loại: {{ item.color }}, {{ item.size }} | Số lượng: x{{
                  item.quantity
                }}
              </div>
            </div>
            <div class="text-end fw-bold text-shop">
              {{ formatPrice(item.price_at_purchase) }}
            </div>
          </div>
        </div>

        <div
          class="order-footer p-3 bg-light border-top d-flex justify-content-between align-items-center"
        >
          <div>
            <span class="text-muted small">Tổng tiền: </span>
            <span class="fs-5 fw-bold text-danger">{{
              formatPrice(order.total_price)
            }}</span>
          </div>

          <div class="action-buttons">
            <button
              v-if="order.order_status === 'Đang giao'"
              class="btn btn-shop px-4 rounded-3 shadow-sm"
              @click="confirmReceived(order._id)"
            >
              Đã nhận được hàng
            </button>
            <button
              v-else-if="order.order_status === 'Đang chờ xác nhận'"
              class="btn btn-outline-danger px-4 rounded-3"
              @click="cancelOrder(order._id)"
            >
              Hủy đơn hàng
            </button>
            <button
              v-else-if="order.order_status === 'Đã giao'"
              class="btn btn-outline-shop px-4 rounded-3"
            >
              Đánh giá ngay
            </button>
            <button v-else class="btn btn-light border px-4 rounded-3">
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="filteredOrders.length === 0"
        class="empty-state text-center py-5"
      >
        <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
        <p class="text-muted">Không tìm thấy đơn hàng nào trong mục này.</p>
      </div>
    </div>
  </div>
  <MyFooter />
</template>

<style scoped>
/* Màu sắc chủ đạo từ Admin */
.text-dark-brown {
  color: #533422;
}
.text-shop {
  color: #ac7657;
}
.bg-light {
  background-color: #fcfaf9 !important;
}

.status-badge {
  color: #000 !important;
  background-color: #d1a68e !important;
}

.btn-shop {
  background-color: #ac7657;
  color: white;
  border: none;
  transition: 0.3s;
}
.btn-shop:hover {
  background-color: #533422;
  transform: translateY(-2px);
}

.btn-outline-shop {
  border: 1px solid #ac7657;
  color: #ac7657;
  background: transparent;
}
.btn-outline-shop:hover {
  background: #fcfaf9;
  color: #533422;
}

/* Tab Navigation kiểu Admin */
.tab-wrapper {
  border: 1px solid #eee;
}
.tab-item {
  background: white;
  color: #888;
  border-bottom: 3px solid transparent !important;
}
.tab-item.active {
  color: #ac7657;
  border-bottom: 3px solid #ac7657 !important;
  background-color: #fcfaf9;
}

/* Badge trạng thái */
.status-badge {
  font-size: 0.8rem;
  font-weight: bold;
  padding: 5px 12px;
  border-radius: 20px;
  background-color: #eee;
  color: #666;
}
.status-badge.Đã\ giao {
  background-color: #d1e7dd;
  color: #0f5132;
}
.status-badge.Đang\ giao {
  background-color: #fff3cd;
  color: #856404;
}
.status-badge.Đã\ hủy {
  background-color: #f8d7da;
  color: #842029;
}

/* Hình ảnh sản phẩm */
.item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
}

.order-card {
  transition: transform 0.2s;
  border: 1px solid #f0f0f0;
}
.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08) !important;
}

.product-row:not(:last-child) {
  border-bottom: 1px dashed #eee;
}

.transition-all {
  transition: all 0.3s ease;
}
</style>
