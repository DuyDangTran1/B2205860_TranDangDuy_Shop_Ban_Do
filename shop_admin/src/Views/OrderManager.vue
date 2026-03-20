<script>
import Loading from "@/components/Loading.vue";
import orderService from "@/services/order.service";

export default {
  components: { Loading },
  data() {
    return {
      loading: true,
      orders: [],
      searchQuery: "",
      statusFilter: "",
      showShippingModal: false,
      selectedOrder: null,
      isConnecting: false,
      shippingCarrier: "GHN",
      payMethodFilter: "",
      startDate: "",
      endDate: "",
    };
  },
  computed: {
    filteredOrders() {
      if (!this.orders) return [];
      return this.orders.filter((o) => {
        const query = this.searchQuery.toLowerCase();

        // 1. Lọc theo mã đơn, tên, sđt (Đã có)
        const matchSearch =
          o._id.toLowerCase().includes(query) ||
          o.recipient_name.toLowerCase().includes(query) ||
          o.phone.includes(query);

        // 2. Lọc theo trạng thái đơn hàng (Đã có)
        const matchStatus =
          this.statusFilter === "" || o.order_status === this.statusFilter;

        // 3. Lọc theo phương thức thanh toán (MỚI)
        const matchPayMethod =
          this.payMethodFilter === "" || o.pay_method === this.payMethodFilter;

        let matchDate = true;
        if (this.startDate || this.endDate) {
          const orderDate = new Date(o.created_at);
          if (this.startDate) {
            const start = new Date(this.startDate);
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) matchDate = false;
          }
          if (this.endDate) {
            const end = new Date(this.endDate);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) matchDate = false;
          }
        }

        return matchSearch && matchStatus && matchPayMethod && matchDate;
      });
    },
  },
  methods: {
    openShippingModal(order) {
      this.selectedOrder = order;
      this.showShippingModal = true;
    },
    async loadOrders() {
      this.loading = true;
      try {
        const data = await orderService.getAllOrders();
        this.orders = data.orders || [];
      } catch (error) {
        console.error("Lỗi lấy đơn hàng:", error);
      } finally {
        this.loading = false;
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    },
    async processOrder(order, newStatus) {
      const confirmMsg = `Xác nhận chuyển đơn hàng #...${order._id.slice(-4)} sang: ${newStatus}?`;
      if (!confirm(confirmMsg)) return;

      try {
        const currentPayStatus = order.pay_status;
        console.log(order._id);
        // Gọi hàm Service
        await orderService.updateStatus(order._id, {
          pay_status: currentPayStatus,
          status: newStatus,
        });

        alert("Cập nhật trạng thái thành công!");
        await this.loadOrders();
      } catch (error) {
        console.error(error);
        alert("Lỗi cập nhật ");
      }
    },
    async confirmShipping() {
      this.isConnecting = true;

      // Giả lập đợi API bên vận chuyển phản hồi mất 2 giây
      setTimeout(async () => {
        try {
          const mockTrackingCode =
            this.shippingCarrier + Math.floor(Math.random() * 100000000);

          await orderService.updateStatus(this.selectedOrder._id, {
            pay_status: this.selectedOrder.pay_status,
            status: "Đang giao",
            tracking_code: mockTrackingCode, // Lưu thêm mã vận đơn giả nếu ní muốn
          });

          alert(
            `Thành công! Đơn hàng đã được chuyển qua cho ${this.shippingCarrier}. \nMã vận đơn: ${mockTrackingCode}`,
          );

          this.showShippingModal = false;
          this.isConnecting = false;
          await this.loadOrders(); // Load lại bảng
        } catch (error) {
          alert("Lỗi kết nối bên thứ 3");
          this.isConnecting = false;
        }
      }, 2000);
    },
    resetFilters() {
      this.searchQuery = "";
      this.statusFilter = "";
      this.payMethodFilter = "";
      this.startDate = "";
      this.endDate = "";
    },
  },
  mounted() {
    this.loadOrders();
  },
};
</script>
<template>
  <div class="p-4">
    <h3 class="fw-bold text-shop mb-4">
      <i class="fas fa-file-invoice-dollar me-2"></i>Quản lý đơn hàng
    </h3>

    <div class="card border-0 shadow-sm p-4 mb-4 rounded-4 bg-white">
      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <label class="small fw-bold text-muted mb-1"
            ><i class="fas fa-search me-1"></i> Tìm kiếm nhanh</label
          >
          <input
            v-model="searchQuery"
            type="text"
            class="form-control border-0 bg-light rounded-3"
            placeholder="Nhập mã đơn, tên khách hoặc số điện thoại..."
          />
        </div>
        <div class="col-md-3">
          <label class="small fw-bold text-muted mb-1"
            ><i class="fas fa-filter me-1"></i> Trạng thái đơn</label
          >
          <select
            v-model="statusFilter"
            class="form-select border-0 bg-light rounded-3"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang chờ xác nhận">Đang chờ xác nhận</option>
            <option value="Đã xác nhận">Đã xác nhận</option>
            <option value="Đang giao">Đang giao</option>
            <option value="Đã giao">Đã giao</option>
            <option value="Đã hủy">Đã hủy</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="small fw-bold text-muted mb-1"
            ><i class="fas fa-credit-card me-1"></i> Phương thức</label
          >
          <select
            v-model="payMethodFilter"
            class="form-select border-0 bg-light rounded-3"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="momo">Ví MoMo</option>
            <option value="vnpay">Cổng VNPAY</option>
          </select>
        </div>
      </div>

      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label class="small fw-bold text-muted mb-1"
            ><i class="fas fa-calendar-alt me-1"></i> Khoảng thời gian (Từ ngày
            - Đến ngày)</label
          >
          <div class="input-group">
            <input
              v-model="startDate"
              type="date"
              class="form-control border-0 bg-light rounded-start-3"
            />
            <span class="input-group-text border-0 bg-light"
              ><i class="fas fa-arrow-right text-muted"></i
            ></span>
            <input
              v-model="endDate"
              type="date"
              class="form-control border-0 bg-light rounded-end-3"
            />
          </div>
        </div>

        <div class="col-md-2 ms-auto">
          <button
            class="btn btn-outline-secondary w-100 rounded-3 shadow-sm border-0 bg-light text-dark"
            @click="resetFilters"
            title="Xóa tất cả bộ lọc"
          >
            <i class="fas fa-sync-alt me-2"></i>Làm mới
          </button>
        </div>
      </div>
    </div>
    <Loading v-if="loading" />

    <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <table
        v-if="filteredOrders.length > 0"
        class="table table-hover align-middle mb-0"
      >
        <thead class="bg-light">
          <tr>
            <th class="ps-4">Mã đơn</th>
            <th>Khách hàng</th>
            <th>Tổng tiền</th>
            <th>Phương thức</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
            <th class="text-center pe-4">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order._id">
            <td class="ps-4 fw-bold">
              #{{ order._id.slice(-6).toUpperCase() }}
            </td>
            <td>
              <div>{{ order.recipient_name }}</div>
              <small class="text-muted">{{ order.phone }}</small>
            </td>
            <td class="text-danger fw-bold">
              {{ formatPrice(order.total_price) }}
            </td>
            <td>
              <div class="d-flex align-items-center">
                <span class="text-uppercase small fw-bold">
                  {{ order.pay_method }}
                </span>
              </div>
            </td>
            <td>
              <span
                :class="
                  order.pay_status === 'Đã thanh toán'
                    ? 'badge bg-success-subtle text-success'
                    : 'badge bg-warning-subtle text-warning'
                "
              >
                {{ order.pay_status }}
              </span>
            </td>
            <td>
              <span class="badge bg-info-subtle text-info">{{
                order.order_status || "Chờ xác nhận"
              }}</span>
            </td>
            <td class="text-center pe-4">
              <div class="btn-group">
                <button
                  class="btn btn-sm btn-outline-shop me-2"
                  title="Xem chi tiết"
                >
                  <i class="fas fa-eye"></i>
                </button>

                <button
                  v-if="
                    order.order_status === 'Đang chờ xác nhận' ||
                    !order.order_status
                  "
                  class="btn btn-sm btn-shop me-2"
                  @click="processOrder(order, 'Đã xác nhận')"
                >
                  <i class="fas fa-check"></i> Xác nhận
                </button>

                <button
                  v-if="
                    order.order_status === 'Đang chờ xác nhận' ||
                    !order.order_status
                  "
                  class="btn btn-sm btn-outline-danger me-2"
                  @click="processOrder(order, 'Đã hủy')"
                >
                  <i class="fas fa-times"></i> Hủy
                </button>

                <button
                  v-if="order.order_status === 'Đã xác nhận'"
                  class="btn btn-sm btn-primary me-2"
                  @click="openShippingModal(order)"
                >
                  <i class="fas fa-truck"></i> Giao hàng
                </button>

                <button
                  v-if="order.order_status === 'Đang giao'"
                  class="btn btn-sm btn-success"
                  @click="processOrder(order, 'Đã giao')"
                >
                  <i class="fas fa-box-open"></i> Hoàn tất
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="filteredOrders.length === 0" class="text-center">
      <span>Không có đơn hàng được tìm thấy</span>
    </div>
  </div>
  <div v-if="showShippingModal" class="modal-overlay">
    <div class="modal-content rounded-4 p-4 shadow">
      <h4 class="fw-bold text-shop mb-3">Đơn vị vận chuyển</h4>
      <p>
        Đơn hàng: <b>#{{ selectedOrder._id.slice(-6).toUpperCase() }}</b>
      </p>

      <div class="mb-3">
        <label class="form-label">Chọn nhà vận chuyển:</label>
        <select
          v-model="shippingCarrier"
          class="form-select"
          :disabled="isConnecting"
        >
          <option value="GHN">Giao Hàng Nhanh (GHN)</option>
          <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
          <option value="ViettelPost">Viettel Post</option>
        </select>
      </div>

      <div v-if="isConnecting" class="text-center my-3">
        <div class="spinner-border text-shop" role="status"></div>
        <p class="mt-2 text-muted">
          Đang tạo vận đơn trên hệ thống {{ shippingCarrier }}...
        </p>
      </div>

      <div class="d-flex justify-content-end gap-2" v-else>
        <button class="btn btn-light" @click="showShippingModal = false">
          Hủy
        </button>
        <button class="btn btn-shop" @click="confirmShipping">
          Gửi đơn ngay
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-shop {
  color: #a0522d;
}
.btn-shop {
  background-color: #a0522d;
  color: white;
  border: none;
}
.btn-outline-shop {
  border-color: #a0522d;
  color: #a0522d;
}
.badge {
  padding: 0.6em 1em;
  border-radius: 8px;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: white;
  width: 400px;
}
.spinner-border.text-shop {
  color: #a0522d;
}
</style>
