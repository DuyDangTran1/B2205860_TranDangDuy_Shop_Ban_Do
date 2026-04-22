<script>
import Loading from "@/components/Loading.vue";
import orderService from "@/services/order.service";
import Swal from "sweetalert2";
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
      // MỚI THÊM
      showDetailModal: false,
      showRefundModal: false,
      detailOrder: {},
      refundInfo: null,
    };
  },
  computed: {
    filteredOrders() {
      if (!this.orders) return [];
      return this.orders.filter((o) => {
        const query = this.searchQuery.toLowerCase();
        const matchSearch =
          o._id.toLowerCase().includes(query) ||
          o.recipient_name.toLowerCase().includes(query) ||
          o.phone.includes(query);
        const matchStatus =
          this.statusFilter === "" || o.order_status === this.statusFilter;
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
    // MODAL METHODS
    openOrderDetail(order) {
      this.detailOrder = order;
      this.showDetailModal = true;
    },

    openRefundInfo(order) {
      this.detailOrder = order;
      this.refundInfo = order.refund_info || null;
      this.showRefundModal = true;
    },
    closeAllModals() {
      this.showDetailModal = false;
      this.showRefundModal = false;
      this.showShippingModal = false;
      this.detailOrder = {};
    },
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
      const result = await Swal.fire({
        text: `Xác nhận chuyển đơn hàng #...${order._id.slice(-4)} sang trạng thái: ${newStatus}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#a0522d",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
      });

      if (!result.isConfirmed) return;

      this.loading = true;
      try {
        const payload = {
          status: newStatus,
          pay_status: order.pay_status,
        };

        if (order.pay_method === "cod") {
          await orderService.updateStatusCOD(order._id, payload);
        } else {
          await orderService.updateStatusOnline(order._id, payload);
        }

        Swal.fire({
          icon: "success",
          text: "Đã cập nhật trạng thái đơn hàng.",
          confirmButtonColor: "#a0522d",
          timer: 1500,
        });
        await this.loadOrders();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi rồi Duy ơi!",
          text: error.response?.data?.message || "Lỗi cập nhật trạng thái",
          confirmButtonColor: "#a0522d",
        });
      } finally {
        this.loading = false;
      }
    },
    async confirmShipping() {
      Swal.fire({
        title: "Đang kết nối đơn vị vận chuyển...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.isConnecting = true;
      setTimeout(async () => {
        try {
          const mockTrackingCode =
            this.shippingCarrier + Math.floor(Math.random() * 100000000);
          await orderService.updateStatusOnline(this.selectedOrder._id, {
            pay_status: this.selectedOrder.pay_status,
            status: "Đang giao",
            tracking_code: mockTrackingCode,
          });
          await Swal.fire({
            icon: "success",
            text: `Mã vận đơn mới: ${mockTrackingCode}`,
            confirmButtonColor: "#a0522d",
          });
          this.closeAllModals();
          await this.loadOrders();
        } catch (error) {
          Swal.fire({
            icon: "error",
            text: "Không thể lấy mã vận đơn từ đơn vị vận chuyển!",
            confirmButtonColor: "#a0522d",
          });
        } finally {
          this.isConnecting = false;
          Swal.close();
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
    async confirmRefunded(order) {
      const result = await Swal.fire({
        text: `Xác nhận đã thực hiện chuyển khoản trả lại tiền cho đơn hàng #${order._id.slice(-6).toUpperCase()}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#a0522d",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Đã chuyển tiền",
        cancelButtonText: "Cần kiểm tra lại",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        this.loading = true;
        try {
          const response = await orderService.confirmRefund(order._id);
          await Swal.fire({
            text:
              response.message ||
              "Đơn hàng đã được cập nhật trạng thái Đã hủy.",
            icon: "success",
            confirmButtonColor: "#a0522d",
          });

          this.closeAllModals();
          await this.loadOrders();
        } catch (error) {
          console.error(error);
          Swal.fire({
            text:
              error.response?.data?.message ||
              "Không thể cập nhật trạng thái hoàn tiền.",
            icon: "error",
          });
        } finally {
          this.loading = false;
        }
      }
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
            placeholder="Mã đơn, tên khách, SĐT..."
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
            <option value="Chờ hoàn tiền">Chờ hoàn tiền</option>
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
            <option value="cod">Tiền mặt (COD)</option>
            <option value="momo">Ví MoMo</option>
            <option value="vnpay">Cổng VNPAY</option>
          </select>
        </div>
      </div>

      <div class="row g-3 align-items-end">
        <div class="col-md-4">
          <label class="small fw-bold text-muted mb-1"
            ><i class="fas fa-calendar-alt me-1"></i> Khoảng thời gian</label
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
              <span class="text-uppercase small fw-bold">{{
                order.pay_method
              }}</span>
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
              <span
                class="badge"
                :class="{
                  'bg-info-subtle text-info':
                    order.order_status === 'Đang chờ xác nhận',
                  'bg-primary-subtle text-primary':
                    order.order_status === 'Đã xác nhận',
                  'bg-warning-subtle text-warning':
                    order.order_status === 'Đang giao',
                  'bg-success-subtle text-success':
                    order.order_status === 'Đã giao',
                  'bg-danger-subtle text-danger':
                    order.order_status === 'Đã hủy',
                  'bg-secondary-subtle text-dark':
                    order.order_status === 'Chờ hoàn tiền',
                }"
              >
                {{ order.order_status || "Chờ xác nhận" }}
              </span>
            </td>
            <td class="text-center pe-4">
              <div class="btn-group">
                <button
                  class="btn btn-sm btn-outline-shop me-2"
                  title="Xem chi tiết"
                  @click="openOrderDetail(order)"
                >
                  <i class="fas fa-eye"></i>
                </button>

                <button
                  v-if="order.pay_method !== 'cod' && order.refund_info"
                  class="btn btn-sm btn-warning me-2"
                  title="Thông tin hoàn tiền"
                  @click="openRefundInfo(order)"
                >
                  <i class="fas fa-hand-holding-usd"></i>
                </button>

                <button
                  v-if="
                    order.order_status === 'Đang chờ xác nhận' ||
                    !order.order_status
                  "
                  class="btn btn-sm btn-shop me-2"
                  @click="processOrder(order, 'Đã xác nhận')"
                >
                  <i class="fas fa-check"></i>
                </button>

                <button
                  v-if="
                    order.order_status === 'Đang chờ xác nhận' ||
                    !order.order_status
                  "
                  class="btn btn-sm btn-outline-danger me-2"
                  @click="processOrder(order, 'Đã hủy')"
                >
                  <i class="fas fa-times"></i>
                </button>

                <button
                  v-if="order.order_status === 'Đã xác nhận'"
                  class="btn btn-sm btn-primary me-2"
                  @click="openShippingModal(order)"
                >
                  <i class="fas fa-truck"></i>
                </button>

                <button
                  v-if="order.order_status === 'Đang giao'"
                  class="btn btn-sm btn-success"
                  @click="processOrder(order, 'Đã giao')"
                >
                  <i class="fas fa-box-open"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="showDetailModal" class="modal-overlay">
    <div class="modal-content rounded-4 p-4 shadow" style="width: 600px">
      <div
        class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2"
      >
        <h4 class="fw-bold text-shop mb-0">
          Chi tiết đơn #{{ detailOrder._id.slice(-6).toUpperCase() }}
        </h4>
        <button class="btn-close" @click="closeAllModals"></button>
      </div>
      <div class="mb-1">
        <p class="mb-1">
          <strong>Khách hàng:</strong> {{ detailOrder.recipient_name }} -
          {{ detailOrder.phone }}
        </p>
        <p class="mb-0"><strong>Địa chỉ:</strong> {{ detailOrder.address }}</p>
      </div>
      <div class="mb-0" v-if="detailOrder.handler_name">
        <p class="mb-0">
          <strong>Nhân viên xử lý:</strong>
          <span class="text-success fw-bold">{{
            detailOrder.handler_name
          }}</span>
        </p>
      </div>

      <div
        class="mb-3"
        v-else-if="detailOrder.order_status === 'Đang chờ xác nhận'"
      >
        <p class="mb-0 text-muted italic">
          <i class="fas fa-clock me-1"></i> Đang chờ duyệt
        </p>
      </div>
      <table class="table table-sm">
        <thead class="table-light">
          <tr>
            <th>Sản phẩm</th>
            <th class="text-center">SL</th>
            <th class="text-end">Giá mua</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in detailOrder.items" :key="item.variant_id">
            <td>
              {{ item.product_name }}<br /><small class="text-muted"
                >{{ item.color }}, {{ item.size }}</small
              >
            </td>
            <td class="text-center">x{{ item.quantity }}</td>
            <td class="text-end">{{ formatPrice(item.price_at_purchase) }}</td>
          </tr>
        </tbody>
      </table>
      <div class="text-end pt-2">
        <p v-if="detailOrder.discount_amount" class="text-primary mb-1">
          Voucher: -{{ formatPrice(detailOrder.discount_amount) }}
        </p>
        <h5 class="fw-bold text-danger">
          Tổng: {{ formatPrice(detailOrder.total_price) }}
        </h5>
      </div>
      <button class="btn btn-shop w-100 mt-3" @click="closeAllModals">
        Đóng
      </button>
    </div>
  </div>

  <div v-if="showRefundModal" class="modal-overlay">
    <div class="modal-content rounded-4 p-4 shadow" style="width: 400px">
      <h4 class="fw-bold text-warning mb-3">
        <i class="fas fa-university me-2"></i>Thông tin hoàn tiền
      </h4>
      <div class="p-3 border rounded-3 bg-light" v-if="refundInfo">
        <p class="mb-2"><strong>Ngân hàng:</strong> {{ refundInfo.bank }}</p>
        <p class="mb-2">
          <strong>Số tài khoản:</strong> {{ refundInfo.account }}
        </p>
        <p class="mb-2">
          <strong>Chủ tài khoản:</strong> {{ refundInfo.name }}
        </p>
        <p class="mb-0"><strong>SĐT liên hệ:</strong> {{ refundInfo.phone }}</p>
      </div>

      <div class="mt-4 d-flex gap-2">
        <button
          v-if="detailOrder.pay_status !== 'Đã hoàn tiền'"
          class="btn btn-confirm flex-grow-1"
          @click="confirmRefunded(detailOrder)"
        >
          XÁC NHẬN ĐÃ HOÀN TIỀN
        </button>
        <button class="btn btn-light flex-grow-1" @click="closeAllModals">
          QUAY LẠI
        </button>
      </div>
    </div>
  </div>

  <div v-if="showShippingModal" class="modal-overlay">
    <div class="modal-content rounded-4 p-4 shadow" style="width: 400px">
      <h4 class="fw-bold text-shop mb-3">Đơn vị vận chuyển</h4>
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
        <div class="spinner-border text-shop"></div>
        <p class="mt-2 text-muted">Đang tạo vận đơn...</p>
      </div>
      <div class="d-flex justify-content-end gap-2" v-else>
        <button class="btn btn-light" @click="closeAllModals">Hủy</button>
        <button class="btn btn-shop" @click="confirmShipping">Gửi đơn</button>
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
  z-index: 1050;
}
.modal-content {
  background: white;
  border: none;
}

.btn-confirm {
  background-color: #a0522d;
}

.btn-confirm:hover {
  color: #fff;
  background-color: #533422;
}
</style>
