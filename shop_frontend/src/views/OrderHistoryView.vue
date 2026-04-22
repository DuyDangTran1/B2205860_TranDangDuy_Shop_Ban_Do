<script>
import MyHeader from "@/components/header.vue";
import MyFooter from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
import orderService from "@/services/order.service";
import reviewService from "@/services/review.service";
import Swal from "sweetalert2";
export default {
  components: { MyHeader, MyFooter, Loading },
  data() {
    return {
      isLoading: true,
      orders: [],
      activeTab: "all",
      showReviewModal: false,
      isSubmitting: false,
      selectedItem: null,
      selectedOrder: null,
      previews: [],
      selectedFiles: [],
      reviewData: {
        rating_score: 5,
        comment: "",
        is_anonymous: false,
      },
      showDetailModal: false,
      detailOrder: {},
    };
  },
  computed: {
    filteredOrders() {
      if (!this.orders) return [];
      if (this.activeTab === "all") return this.orders;

      const tabMap = {
        pending: "Đang chờ xác nhận",
        confirmed: "Đã xác nhận",
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
        const response = await orderService.getAllOrdersByUser();
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
    openReviewModal(order, item) {
      this.selectedOrder = order;
      this.selectedItem = item;
      this.showReviewModal = true;
    },
    closeReviewModal() {
      this.showReviewModal = false;
      this.previews = [];
      this.selectedFiles = [];
      this.reviewData = { rating_score: 5, comment: "", is_anonymous: false };
    },
    getRatingText(score) {
      const texts = [
        "",
        "Tệ",
        "Không hài lòng",
        "Bình thường",
        "Hài lòng",
        "Tuyệt vời",
      ];
      return texts[score];
    },
    handleFileChange(e) {
      const files = Array.from(e.target.files);
      if (this.selectedFiles.length + files.length > 10) {
        return alert("Chỉ được chọn tối đa 10 file thôi nhé!");
      }
      files.forEach((file) => {
        this.selectedFiles.push(file);
        this.previews.push(URL.createObjectURL(file));
      });
    },
    removeFile(index) {
      this.selectedFiles.splice(index, 1);
      this.previews.splice(index, 1);
    },
    async submitReview() {
      if (!this.reviewData.comment.trim()) {
        return Swal.fire({
          text: "Vui lòng nhập bình luận trải nghiệm của bạn!",
          icon: "warning",
          confirmButtonColor: "#533422",
        });
      }
      this.isSubmitting = true;
      try {
        const formData = new FormData();
        formData.append("order_id", this.selectedOrder._id);
        formData.append("variant_id", this.selectedItem.variant_id);
        formData.append("rating_score", this.reviewData.rating_score);
        formData.append("comment", this.reviewData.comment);
        formData.append("is_anonymous", this.reviewData.is_anonymous);

        this.selectedFiles.forEach((file) => {
          formData.append("images", file);
        });

        await reviewService.createReview(formData);

        Swal.fire({
          text: "Đánh giá của bạn đã được gửi thành công.",
          icon: "success",
          confirmButtonColor: "#533422",
        });
        this.closeReviewModal();
        await this.LoadData();
      } catch (error) {
        Swal.fire({
          text: error.response?.data?.message || "Gửi đánh giá thất bại rồi!",
          icon: "error",
        });
      } finally {
        this.isSubmitting = false;
      }
    },

    async confirmReceived(orderId) {
      const result = await Swal.fire({
        text: "Bạn chắc chắn đã nhận được kiện hàng này chứ?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#533422",
        cancelButtonColor: "#d33",
        confirmButtonText: "Đã nhận được",
        cancelButtonText: "Chưa",
      });
      if (!result.isConfirmed) return;
      try {
        await orderService.receiveConfirm(orderId);
        Swal.fire({
          text: "Cảm ơn bạn đã mua sắm tại SHOPDD.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        await this.LoadData();
      } catch (error) {
        Swal.fire({
          text: "Không thể cập nhật trạng thái, Vui lòng thử lại sau.",
          icon: "error",
        });
      }
    },
    openDetailModal(order) {
      this.detailOrder = order;
      this.showDetailModal = true;
    },
    closeDetailModal() {
      this.showDetailModal = false;
      this.detailOrder = {};
    },

    async cancelOrder(order) {
      // 1. Định nghĩa danh sách các phương thức cần hoàn tiền qua STK
      const onlineMethods = ["momo", "vnpay"];
      const isOnline = onlineMethods.includes(order.pay_method);

      let htmlContent = `
    <div class="text-start">
      <p class="small text-muted mb-2">Đơn hàng: #<b>${order._id.slice(-6).toUpperCase()}</b></p>
      <label class="form-label small fw-bold">Lý do hủy đơn:</label>
      <select id="cancel-reason" class="form-select mb-3 shadow-none">
        <option value="Thay đổi địa chỉ nhận hàng">Thay đổi địa chỉ nhận hàng</option>
        <option value="Muốn thay đổi sản phẩm">Muốn thay đổi sản phẩm</option>
        <option value="Tìm thấy giá tốt hơn">Tìm thấy giá tốt hơn</option>
        <option value="Đổi ý, không muốn mua nữa">Đổi ý, không muốn mua nữa</option>
        <option value="Khác">Lý do khác...</option>
      </select>
  `;

      // Nếu là momo/vnpay thì hiện
      if (isOnline) {
        htmlContent += `
      <div class="alert alert-danger small p-2 mb-3" style="font-size: 0.8rem">
        <i class="fas fa-university me-1"></i> Đơn hàng <b>${order.pay_method.toUpperCase()}</b> cần thông tin STK để hoàn tiền bạn nhé!
      </div>
      <div class="row g-2">
        <div class="col-12">
          <label class="form-label small fw-bold mb-1">Ngân hàng:</label>
          <input id="refund-bank" class="form-control form-control-sm mb-2" placeholder="Ví dụ: Vietcombank, MB...">
        </div>
        <div class="col-12">
          <label class="form-label small fw-bold mb-1">Số tài khoản:</label>
          <input id="refund-account" class="form-control form-control-sm mb-2" placeholder="Nhập số tài khoản">
        </div>
        <div class="col-12">
          <label class="form-label small fw-bold mb-1">Tên chủ thẻ:</label>
          <input id="refund-name" class="form-control form-control-sm mb-2" placeholder="TEN CHU THE KHONG DAU">
        </div>
        <div class="col-12">
          <label class="form-label small fw-bold mb-1">SĐT liên hệ hoàn tiền:</label>
          <input id="refund-phone" class="form-control form-control-sm mb-2" placeholder="Nhập SĐT để shop gọi khi cần">
        </div>
      </div>
    `;
      }
      htmlContent += `</div>`;

      const { value: formValues } = await Swal.fire({
        title: "Xác nhận hủy đơn",
        html: htmlContent,
        showCancelButton: true,
        confirmButtonColor: "#ac7657",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xác nhận hủy",
        cancelButtonText: "Quay lại",
        preConfirm: () => {
          const reason = document.getElementById("cancel-reason").value;
          if (isOnline) {
            const bank = document.getElementById("refund-bank").value;
            const account = document.getElementById("refund-account").value;
            const name = document.getElementById("refund-name").value;
            const phone = document.getElementById("refund-phone").value;
            if (!bank || !account || !name || !phone) {
              Swal.showValidationMessage(
                "Bạn cần điền đầy đủ thông tin để hủy đơn hàng và hoàn tiền lại.",
              );
              return false;
            }
            return { reason, refund_info: { bank, account, name, phone } };
          }
          return { reason };
        },
      });

      if (formValues) {
        this.isLoading = true;
        try {
          const res = await orderService.cancelOrder(order._id, formValues);
          Swal.fire("Thành công", res.message, "success");
          await this.LoadData(); // Reload để thấy trạng thái "Chờ hoàn tiền" hoặc "Đã hủy"
        } catch (error) {
          Swal.fire(
            "Lỗi",
            error.response?.data?.message || "Không thể hủy",
            "error",
          );
        } finally {
          this.isLoading = false;
        }
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
          { id: 'confirmed', label: 'Đã xác nhận' },
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
              <div v-if="order.order_status === 'Đã giao'" class="mt-2">
                <button
                  v-if="!item.is_reviewed"
                  class="btn btn-sm btn-outline-shop rounded-pill px-3"
                  @click="openReviewModal(order, item)"
                >
                  <i class="far fa-star me-1"></i> Viết đánh giá
                </button>

                <button
                  v-else
                  class="btn btn-sm btn-light rounded-pill px-3 text-muted"
                  disabled
                >
                  <i class="fas fa-check-circle me-1"></i> Đã đánh giá
                </button>
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
              @click="cancelOrder(order)"
            >
              Hủy đơn hàng
            </button>
            <button
              v-else
              class="btn btn-light border px-4 rounded-3 text-muted"
              @click="openDetailModal(order)"
            >
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

    <div v-if="showReviewModal" class="modal-overlay">
      <div class="modal-content review-modal rounded-4 p-4 shadow border-0">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold text-dark-brown mb-0">Đánh giá sản phẩm</h5>
          <button
            class="btn-close shadow-none"
            @click="closeReviewModal"
          ></button>
        </div>

        <div
          class="product-mini-info d-flex align-items-center p-2 bg-light rounded mb-3 border"
        >
          <img
            :src="'http://localhost:3000/' + selectedItem.image"
            class="rounded me-2"
            width="50"
            height="50"
            style="object-fit: cover"
          />
          <div class="small flex-grow-1 overflow-hidden">
            <div class="fw-bold text-truncate">
              {{ selectedItem.product_name }}
            </div>
            <div class="text-muted">
              Phân loại: {{ selectedItem.color }}, {{ selectedItem.size }}
            </div>
          </div>
        </div>

        <form @submit.prevent="submitReview">
          <div class="text-center mb-4">
            <div class="rating-stars d-flex justify-content-center gap-2">
              <i
                v-for="star in 5"
                :key="star"
                class="fa-star fs-2 cursor-pointer transition-all"
                :class="
                  star <= reviewData.rating_score
                    ? 'fa-solid text-warning'
                    : 'fa-regular text-muted'
                "
                @click="reviewData.rating_score = star"
              ></i>
            </div>
            <div class="mt-2 text-warning fw-bold small text-uppercase">
              {{ getRatingText(reviewData.rating_score) }}
            </div>
          </div>

          <textarea
            v-model="reviewData.comment"
            class="form-control border bg-light mb-3 rounded-3 shadow-none p-3"
            rows="4"
            placeholder="Sản phẩm tuyệt vời, tui rất hài lòng..."
          ></textarea>

          <div class="mb-3">
            <label
              class="btn btn-outline-secondary w-100 py-2 border-dashed small"
            >
              <i class="fas fa-camera me-2"></i> Thêm Hình ảnh / Video (Tối đa
              10)
              <input
                type="file"
                multiple
                class="d-none"
                @change="handleFileChange"
                accept="image/*,video/*"
              />
            </label>

            <div class="d-flex flex-wrap gap-2 mt-2" v-if="previews.length">
              <div
                v-for="(p, index) in previews"
                :key="index"
                class="position-relative"
              >
                <img
                  :src="p"
                  class="rounded border shadow-sm"
                  width="65"
                  height="65"
                  style="object-fit: cover"
                />
                <span
                  class="remove-btn position-absolute"
                  @click="removeFile(index)"
                  >×</span
                >
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center mb-4">
            <input
              type="checkbox"
              id="anon"
              v-model="reviewData.is_anonymous"
              class="me-2 custom-check"
            />
            <label for="anon" class="small text-muted cursor-pointer"
              >Đánh giá ẩn danh</label
            >
          </div>

          <button
            type="submit"
            class="btn btn-shop w-100 py-3 fw-bold shadow-sm"
            :disabled="isSubmitting"
          >
            <span v-if="!isSubmitting">HOÀN TẤT ĐÁNH GIÁ</span>
            <span v-else
              ><i class="fa-solid fa-spinner fa-spin me-2"></i>ĐANG XỬ
              LÝ...</span
            >
          </button>
        </form>
      </div>
    </div>

    <div v-if="showDetailModal && detailOrder._id" class="modal-overlay">
      <div
        class="modal-content review-modal rounded-4 p-4 shadow border-0"
        style="width: 550px"
      >
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h5 class="fw-bold text-dark-brown mb-0">
            Chi tiết đơn hàng #{{ detailOrder._id.slice(-6).toUpperCase() }}
          </h5>
          <button
            class="btn-close shadow-none"
            @click="closeDetailModal"
          ></button>
        </div>

        <div class="order-detail-info small">
          <div class="mb-4">
            <div
              class="fw-bold mb-2 text-shop text-uppercase"
              style="font-size: 0.7rem"
            >
              Sản phẩm đã mua
            </div>
            <div
              v-for="item in detailOrder.items"
              :key="item.variant_id"
              class="d-flex align-items-center py-2 border-bottom"
            >
              <img
                :src="'http://localhost:3000/' + item.image"
                width="45"
                height="45"
                class="rounded me-2 border"
              />
              <div class="flex-grow-1">
                <div class="fw-bold text-truncate" style="max-width: 250px">
                  {{ item.product_name }}
                </div>
                <div class="text-muted" style="font-size: 0.75rem">
                  {{ item.color }}, {{ item.size }} x {{ item.quantity }}
                </div>
              </div>
              <div class="fw-bold">
                {{ formatPrice(item.price_at_purchase) }}
              </div>
            </div>
          </div>

          <div class="row mb-4">
            <div class="col-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div
                  class="fw-bold mb-2 text-shop text-uppercase"
                  style="font-size: 0.7rem"
                >
                  Nhận hàng
                </div>
                <div>
                  <strong>{{ detailOrder.recipient_name }}</strong>
                </div>
                <div class="text-muted">{{ detailOrder.phone }}</div>
                <div class="text-muted text-truncate">
                  {{ detailOrder.address }}
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div
                  class="fw-bold mb-2 text-shop text-uppercase"
                  style="font-size: 0.7rem"
                >
                  Xử lý bởi
                </div>
                <div v-if="detailOrder.handler_name">
                  Nhân viên:
                  {{ detailOrder.handler_name }}
                </div>
                <div v-else class="text-muted">Đang chờ xử lý...</div>
                <div
                  class="mt-2 fw-bold"
                  :class="
                    detailOrder.pay_status === 'Đã thanh toán'
                      ? 'text-success'
                      : 'text-danger'
                  "
                >
                  Thanh toán: {{ detailOrder.pay_status }}
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 bg-white rounded-3 border">
            <div class="d-flex justify-content-between mb-2">
              <span>Tiền hàng:</span>
              <span>{{ formatPrice(detailOrder.sub_total || 0) }}</span>
            </div>
            <div
              v-if="detailOrder.applied_voucher"
              class="d-flex justify-content-between mb-2 text-primary"
            >
              <span
                >Voucher:
                <small class="badge bg-primary ms-1">{{
                  detailOrder.applied_voucher
                }}</small></span
              >
              <span>-{{ formatPrice(detailOrder.discount_amount || 0) }}</span>
            </div>
            <hr />
            <div
              class="d-flex justify-content-between fw-bold fs-5 text-dark-brown"
            >
              <span>Tổng cộng:</span>
              <span class="text-danger">{{
                formatPrice(detailOrder.total_price || 0)
              }}</span>
            </div>
          </div>
        </div>

        <button
          class="btn btn-shop w-100 py-3 mt-4 fw-bold shadow-sm"
          @click="closeDetailModal"
        >
          ĐÓNG
        </button>
      </div>
    </div>
  </div>
  <MyFooter />
</template>

<style scoped>
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
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 20px;
  background-color: #eee;
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

.status-badge.Đã\ xác\ nhận {
  background-color: #cfe2ff;
  color: #084298;
}

/* Tabs */
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

.item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
}
.order-card {
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}
.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.review-modal {
  background: white;
  width: 450px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}
.cursor-pointer {
  cursor: pointer;
}
.border-dashed {
  border-style: dashed !important;
}
.custom-check {
  accent-color: #533422;
  width: 18px;
  height: 18px;
}
.transition-all {
  transition: 0.2s;
}
.fa-star:hover {
  transform: scale(1.2);
}

.remove-btn {
  top: -8px;
  right: -8px;
  background: #ff4d4f;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  border: 2px solid white;
}

.btn-shop {
  background-color: #ac7657;
  color: white;
  border: none;
  transition: 0.3s;
}
.btn-shop:hover {
  background-color: #533422;
}
.btn-outline-shop {
  border: 1px solid #ac7657;
  color: #ac7657;
}
.btn-outline-shop:hover {
  background: #ac7657;
  color: white;
}
</style>
