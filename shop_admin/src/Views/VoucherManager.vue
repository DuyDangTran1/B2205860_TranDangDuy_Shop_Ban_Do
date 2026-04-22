<script>
import voucherService from "@/services/voucher.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";

export default {
  components: { Loading },
  data() {
    return {
      vouchers: [],
      searchQuery: "",
      isLoading: false,
      showModal: false,
      isEdit: false,
      currentId: null,
      filterRank: "",
      filterStatus: "",
      filterType: "",
      formData: {
        voucher_code: "",
        description: "",
        discount_value: 0,
        discount_type: "fixed",
        min_order_value: 0,
        max_discount: 0,
        usage_limit: 1,
        applicable_rank: "Đồng",
        is_welcome_voucher: false,
        start_date: this.getToday(),
        expiry_date: this.getToday(),
        is_active: true,
      },
    };
  },
  computed: {
    filteredVouchers() {
      return this.vouchers.filter((v) => {
        //Tìm kiếm theo mã
        const matchSearch = v.voucher_code
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());

        //Lọc theo hạng
        const matchRank =
          !this.filterRank || v.applicable_rank === this.filterRank;

        //Lọc theo loại giảm giá
        const matchType =
          !this.filterType || v.discount_type === this.filterType;

        //Lọc theo trạng thái
        let matchStatus = true;
        if (this.filterStatus) {
          const now = new Date();
          const expiry = new Date(v.expiry_date);

          if (this.filterStatus === "active") {
            matchStatus = v.is_active && now <= expiry;
          } else if (this.filterStatus === "expired") {
            matchStatus = now > expiry;
          } else if (this.filterStatus === "locked") {
            matchStatus = !v.is_active;
          }
        }

        return matchSearch && matchRank && matchType && matchStatus;
      });
    },
  },
  methods: {
    async initData() {
      this.isLoading = true;
      try {
        const res = await voucherService.getAllVoucher();
        this.vouchers = res.vouchers || [];
      } catch (err) {
        console.error("Lỗi lấy dữ liệu Voucher:", err);
      } finally {
        this.isLoading = false;
      }
    },
    formatPrice(val) {
      return new Intl.NumberFormat("vi-VN").format(val);
    },
    getToday() {
      return new Date().toISOString().split("T")[0];
    },
    openAddModal() {
      this.isEdit = false;
      this.formData = {
        voucher_code: "",
        description: "",
        discount_value: 0,
        discount_type: "fixed",
        min_order_value: 0,
        max_discount: 0,
        usage_limit: 1,
        applicable_rank: "Đồng",
        is_welcome_voucher: false,
        start_date: this.getToday(),
        expiry_date: this.getToday(),
        is_active: true,
      };
      this.showModal = true;
    },
    openEditModal(item) {
      this.isEdit = true;
      this.currentId = item._id;
      this.formData = {
        ...item,
        start_date: new Date(item.start_date).toISOString().split("T")[0],
        expiry_date: new Date(item.expiry_date).toISOString().split("T")[0],
      };
      this.showModal = true;
    },
    resetFilters() {
      this.searchQuery = "";
      this.filterRank = "";
      this.filterStatus = "";
      this.filterType = "";
    },
    async saveVoucher() {
      if (!this.formData.voucher_code || this.formData.discount_value <= 0) {
        return Swal.fire("Lỗi", "Vui lòng nhập mã và giá trị giảm!", "error");
      }

      this.isLoading = true;
      try {
        if (this.isEdit) {
          await voucherService.updateVoucher(this.currentId, this.formData);
          Swal.fire("Thành công", "Đã cập nhật mã giảm giá", "success");
        } else {
          await voucherService.createVoucher(this.formData);
          Swal.fire("Thành công", "Đã tạo mã giảm giá mới", "success");
        }
        this.showModal = false;
        this.initData();
      } catch (err) {
        Swal.fire(
          "Lỗi",
          err.response?.data?.message || "Không thể lưu voucher",
          "error",
        );
      } finally {
        this.isLoading = false;
      }
    },
    async toggleStatus(item) {
      const isLocking = item.is_active;
      const title = isLocking ? "Xác nhận khóa?" : "Xác nhận mở khóa?";
      const text = isLocking
        ? "Mã giảm giá này sẽ không thể sử dụng được nữa!"
        : "Mã giảm giá sẽ hoạt động trở lại bình thường.";

      const result = await Swal.fire({
        title: title,
        text: text,
        icon: isLocking ? "warning" : "question",
        showCancelButton: true,
        confirmButtonColor: isLocking ? "#d33" : "#198754",
        cancelButtonColor: "#6c757d",
        confirmButtonText: isLocking ? "Đồng ý khóa" : "Mở khóa ngay",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        this.isLoading = true;
        try {
          await voucherService.changeStatusVoucher(item._id);

          Swal.fire(
            isLocking ? "Đã khóa!" : "Đã mở!",
            `Voucher đã được ${isLocking ? "vô hiệu hóa" : "kích hoạt lại"}.`,
            "success",
          );
          this.initData();
        } catch (err) {
          Swal.fire("Lỗi", "Không thể thực hiện thao tác", "error");
        } finally {
          this.isLoading = false;
        }
      }
    },
  },
  mounted() {
    this.initData();
  },
};
</script>

<template>
  <div class="voucher-manager p-4">
    <Loading :isLoading="isLoading" />

    <div v-if="!isLoading">
      <div class="mb-4 d-flex justify-content-between align-items-center">
        <h4 class="fw-bold text-brown m-0 text-uppercase tracking-wider">
          Quản lý Mã Giảm Giá
        </h4>
        <button
          class="btn btn-brown px-4 py-2 shadow-sm fw-bold rounded-pill"
          @click="openAddModal"
        >
          <i class="fas fa-ticket-alt me-2"></i> TẠO VOUCHER
        </button>
      </div>

      <div class="row mb-4 g-2">
        <div class="col-md-4">
          <div
            class="position-relative shadow-sm rounded-pill overflow-hidden border"
          >
            <input
              v-model="searchQuery"
              type="text"
              class="form-control ps-5 border-0 bg-white py-2"
              placeholder="Tìm mã voucher..."
            />
            <i
              class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"
            ></i>
          </div>
        </div>

        <div class="col-md-2">
          <select
            v-model="filterRank"
            class="form-select rounded-pill shadow-sm border-0 py-2 ps-3"
          >
            <option value="">Tất cả hạng</option>
            <option value="Đồng">Hạng Đồng</option>
            <option value="Bạc">Hạng Bạc</option>
            <option value="Vàng">Hạng Vàng</option>
            <option value="Kim cương">Hạng Kim cương</option>
          </select>
        </div>

        <div class="col-md-2">
          <select
            v-model="filterType"
            class="form-select rounded-pill shadow-sm border-0 py-2 ps-3"
          >
            <option value="">Tất cả loại</option>
            <option value="fixed">Tiền mặt</option>
            <option value="percent">Phần trăm</option>
          </select>
        </div>

        <div class="col-md-2">
          <select
            v-model="filterStatus"
            class="form-select rounded-pill shadow-sm border-0 py-2 ps-3"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="expired">Đã hết hạn</option>
            <option value="locked">Đang bị khóa</option>
          </select>
        </div>

        <div class="col-md-2">
          <button
            @click="resetFilters"
            class="btn btn-outline-secondary rounded-pill w-100 py-2 border-0 shadow-sm bg-white"
          >
            <i class="fas fa-sync-alt me-1"></i> Làm mới
          </button>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 overflow-hidden border">
        <div class="card-body p-0">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3 small fw-bold text-uppercase text-brown">
                  Mã & Mô tả
                </th>
                <th class="py-3 small fw-bold text-uppercase text-brown">
                  Giảm giá
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-center"
                >
                  Lượt dùng
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-center"
                >
                  Trạng thái
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-end pe-4"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="v in filteredVouchers"
                :key="v._id"
                class="border-bottom"
              >
                <td class="ps-4 py-3">
                  <div class="d-flex align-items-center">
                    <span class="fw-bold text-brown fs-5 me-2">{{
                      v.voucher_code
                    }}</span>
                    <span
                      v-if="v.is_welcome_voucher"
                      class="badge bg-warning text-dark x-small rounded-pill"
                      >CHÀO MỪNG</span
                    >
                  </div>
                  <div class="text-secondary small">
                    {{ v.description || "Không có mô tả" }}
                  </div>
                  <div class="badge bg-light text-brown border mt-1">
                    Hạng:
                    {{ v.applicable_rank || "Đồng" }}
                  </div>
                </td>
                <td>
                  <div class="fw-bold text-dark">
                    {{
                      v.discount_type === "percent"
                        ? v.discount_value + "%"
                        : formatPrice(v.discount_value) + "đ"
                    }}
                  </div>
                  <div class="x-small text-muted">
                    Tối thiểu: {{ formatPrice(v.min_order_value) }}đ
                  </div>
                </td>
                <td class="text-center">
                  <div class="fw-bold">
                    {{ v.used_count || 0 }} / {{ v.usage_limit }}
                  </div>
                  <div
                    class="progress mt-1"
                    style="height: 5px; width: 80px; margin: 0 auto"
                  >
                    <div
                      class="progress-bar bg-brown"
                      :style="{
                        width: (v.used_count / v.usage_limit) * 100 + '%',
                      }"
                    ></div>
                  </div>
                </td>
                <td class="text-center">
                  <span v-if="!v.is_active" class="badge bg-danger rounded-pill"
                    >Bị khóa</span
                  >
                  <span
                    v-else-if="new Date() > new Date(v.expiry_date)"
                    class="badge bg-secondary rounded-pill"
                    >Hết hạn</span
                  >
                  <span v-else class="badge bg-success rounded-pill"
                    >Đang hoạt động</span
                  >
                </td>
                <td class="pe-4 text-end">
                  <div
                    class="btn-group shadow-sm border rounded-pill bg-white px-1"
                  >
                    <button
                      @click="openEditModal(v)"
                      class="btn btn-white text-warning"
                      title="Chỉnh sửa"
                    >
                      <i class="fas fa-edit"></i>
                    </button>

                    <button
                      @click="toggleStatus(v)"
                      class="btn btn-white"
                      :class="v.is_active ? 'text-danger' : 'text-success'"
                      :title="v.is_active ? 'Khóa mã' : 'Mở khóa mã'"
                    >
                      <i
                        :class="
                          v.is_active ? 'fas fa-lock' : 'fas fa-lock-open'
                        "
                      ></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content p-4 shadow-lg rounded-4 border-0">
        <h5 class="fw-bold text-brown mb-4 border-bottom pb-2 text-uppercase">
          {{ isEdit ? "CẬP NHẬT VOUCHER" : "TẠO VOUCHER MỚI" }}
        </h5>

        <div class="row g-3">
          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Mã Voucher</label
            >
            <input
              v-model="formData.voucher_code"
              type="text"
              class="form-control bg-light border-0 rounded-3"
              placeholder="TET2026"
            />
          </div>

          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Hạng áp dụng</label
            >
            <select
              v-model="formData.applicable_rank"
              class="form-select bg-light border-0 rounded-3"
            >
              <option value="Đồng">Đồng (Tất cả)</option>
              <option value="Bạc">Bạc trở lên</option>
              <option value="Vàng">Vàng trở lên</option>
              <option value="Kim cương">Chỉ Kim cương</option>
            </select>
          </div>

          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Loại giảm giá</label
            >
            <select
              v-model="formData.discount_type"
              class="form-select bg-light border-0 rounded-3"
            >
              <option value="fixed">Tiền mặt (đ)</option>
              <option value="percent">Phần trăm (%)</option>
            </select>
          </div>

          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Giá trị giảm</label
            >
            <input
              v-model="formData.discount_value"
              type="number"
              class="form-control bg-light border-0 rounded-3"
            />
          </div>

          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Đơn tối thiểu (đ)</label
            >
            <input
              v-model="formData.min_order_value"
              type="number"
              class="form-control bg-light border-0 rounded-3"
            />
          </div>

          <div class="col-md-6" v-if="formData.discount_type === 'percent'">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Giảm tối đa (đ)</label
            >
            <input
              v-model="formData.max_discount"
              type="number"
              class="form-control bg-light border-0 rounded-3"
            />
          </div>

          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Số lượng mã</label
            >
            <input
              v-model="formData.usage_limit"
              type="number"
              class="form-control bg-light border-0 rounded-3"
            />
          </div>

          <div class="col-md-6">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Ngày hết hạn</label
            >
            <input
              v-model="formData.expiry_date"
              type="date"
              class="form-control bg-light border-0 rounded-3"
            />
          </div>

          <div class="col-12">
            <div
              class="form-check form-switch p-3 border rounded-3 bg-white shadow-sm mt-2"
            >
              <input
                class="form-check-input ms-0 me-3"
                type="checkbox"
                v-model="formData.is_welcome_voucher"
                id="welcomeSwitch"
              />
              <label
                class="form-check-label fw-bold text-brown"
                for="welcomeSwitch"
              >
                Voucher chào mừng thành viên mới
              </label>
            </div>
          </div>

          <div class="col-12">
            <label
              class="form-label small fw-bold text-uppercase text-secondary"
              >Mô tả ngắn</label
            >
            <textarea
              v-model="formData.description"
              class="form-control bg-light border-0 rounded-3"
              rows="2"
              placeholder="Ưu đãi dành cho..."
            ></textarea>
          </div>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button
            @click="showModal = false"
            class="btn btn-outline-secondary w-100 rounded-pill fw-bold py-2"
          >
            HỦY
          </button>
          <button
            @click="saveVoucher"
            class="btn btn-brown w-100 rounded-pill fw-bold py-2"
          >
            LƯU LẠI
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-brown {
  background-color: #533422;
}
.text-brown {
  color: #533422;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
  transition: all 0.3s ease;
}
.btn-brown:hover {
  background-color: #3e2719;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(83, 52, 34, 0.2);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(83, 52, 34, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: white;
  width: 600px;
  max-width: 90%;
}
.btn-white {
  background: white;
  border: none;
  color: #6c757d;
}
.btn-white:hover {
  background: #f8f9fa;
  color: #333;
}
.x-small {
  font-size: 0.7rem;
}
</style>
