<template>
  <div class="warehouse-container">
    <div class="warehouse-header">
      <div>
        <h1>Quản Lý Kho Hàng</h1>
        <p>Theo dõi nhập hàng và điều chỉnh tồn kho chi tiết.</p>
      </div>
      <div class="button-group d-flex gap-3">
        <button
          @click="openModal('Phiếu nhập kho')"
          class="btn btn-import shadow-sm"
        >
          <i class="fas fa-plus-circle me-2"></i> NHẬP HÀNG MỚI
        </button>
        <button
          @click="openModal('Phiếu điều chỉnh')"
          class="btn btn-adjust shadow-sm"
        >
          <i class="fas fa-sync-alt me-2"></i> KIỂM KHO / ĐIỀU CHỈNH
        </button>
      </div>
    </div>

    <div
      class="filter-section d-flex gap-3 align-items-end mt-4 p-3 shadow-sm rounded-4 bg-white"
    >
      <div class="filter-item flex-grow-1">
        <label class="label-small">TÌM KIẾM PHIẾU</label>
        <div class="search-input-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            v-model="filter.search"
            type="text"
            class="input-brown ps-5"
            placeholder="Tìm theo mã phiếu hoặc ghi chú..."
          />
        </div>
      </div>

      <div class="filter-item" style="width: 200px">
        <label class="label-small">LOẠI PHIẾU</label>
        <select v-model="filter.type" class="input-brown">
          <option value="">Tất cả loại</option>
          <option value="Phiếu nhập kho">Phiếu nhập kho</option>
          <option value="Phiếu xuất kho">Phiếu xuất hàng</option>
          <option value="Phiếu điều chỉnh">Phiếu điều chỉnh</option>
        </select>
      </div>

      <div class="filter-item">
        <label class="label-small">TỪ NGÀY</label>
        <input v-model="filter.startDate" type="date" class="input-brown" />
      </div>

      <div class="filter-item">
        <label class="label-small">ĐẾN NGÀY</label>
        <input v-model="filter.endDate" type="date" class="input-brown" />
      </div>

      <button
        @click="resetFilter"
        class="btn btn-cancel-light"
        title="Xóa bộ lọc"
      >
        <i class="fas fa-undo"></i>
      </button>
    </div>

    <Loading :isLoading="loading"></Loading>

    <div v-if="!loading" class="table-wrapper mt-4">
      <table>
        <thead>
          <tr>
            <th style="width: 20%">Ngày lập phiếu</th>
            <th style="width: 20%">Loại phiếu</th>
            <th style="width: 30%">Ghi chú / Lý do</th>
            <th style="width: 20%" class="text-center">Người lập</th>
            <th style="width: 10%" class="text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="bill in filteredBills"
            :key="bill._id"
            class="clickable-row"
          >
            <td>
              <div class="date-text">{{ formatDate(bill.created).date }}</div>
              <div class="time-text">{{ formatDate(bill.created).time }}</div>
            </td>
            <td>
              <span :class="['badge', getTypeClass(bill.type)]">{{
                bill.type
              }}</span>
            </td>
            <td class="reason-cell text-truncate" style="max-width: 300px">
              {{ bill.reason || "Nhập hàng định kỳ" }}
            </td>
            <td class="text-center">
              <span class="admin-badge">{{
                bill.employee_name || "Hệ thống"
              }}</span>
            </td>
            <td class="text-center">
              <button
                @click.stop="viewDetail(bill)"
                class="btn-action"
                title="Xem chi tiết"
              >
                <i class="fas fa-eye text-brown"></i>
              </button>
            </td>
          </tr>
          <tr v-if="bills.length === 0">
            <td colspan="5" class="text-center py-5 text-muted">
              Chưa có hoạt động nhập xuất kho nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content large-modal">
        <div class="modal-header border-0 pb-0">
          <h2 class="fw-bold text-brown">{{ modalType }}</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <div v-if="modalType === 'Phiếu nhập kho'" class="form-group mb-4">
            <label class="label-small">NHÀ CUNG CẤP ĐỐI TÁC</label>
            <select v-model="selectedSupplierId" class="input-brown">
              <option value="">-- Chọn đơn vị cung cấp --</option>
              <option v-for="s in suppliers" :key="s._id" :value="s._id">
                {{ s.supplier_name }}
              </option>
            </select>
          </div>

          <div class="add-item-box shadow-sm">
            <p class="box-title">Thêm sản phẩm vào danh sách</p>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="label-small">Tên sản phẩm</label>
                <select
                  v-model="selectedProductId"
                  @change="onProductChange"
                  class="input-brown"
                >
                  <option value="">-- Tìm mẫu sản phẩm --</option>
                  <option v-for="p in products" :key="p._id" :value="p._id">
                    {{ p.product_name }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="label-small">Màu sắc & Kích thước</label>
                <select
                  v-model="tempItem.variant_id"
                  class="input-brown"
                  :disabled="!currentVariants.length"
                >
                  <option value="">-- Chọn phân loại hàng --</option>
                  <option
                    v-for="v in currentVariants"
                    :key="v._id"
                    :value="v._id"
                  >
                    {{ v.color_name }} - {{ v.size_name }} (Kho còn:
                    {{ v.quantity }})
                  </option>
                </select>
              </div>
            </div>

            <div class="row g-3 mt-1 align-items-end">
              <div class="col-md-4">
                <label class="label-small">
                  {{
                    modalType === "Phiếu nhập kho"
                      ? "Số lượng nhập (+)"
                      : "Số lượng (+/-)"
                  }}
                </label>
                <input
                  type="number"
                  v-model.number="tempItem.quantity"
                  class="input-brown"
                  :min="modalType === 'Phiếu nhập kho' ? 1 : ''"
                />
              </div>
              <div class="col-md-4" v-if="modalType === 'Phiếu nhập kho'">
                <label class="label-small">Giá nhập mỗi món (VNĐ)</label>
                <input
                  type="number"
                  v-model.number="tempItem.price"
                  class="input-brown"
                />
              </div>
              <div class="col-md-4">
                <button
                  @click="addItemToQueue"
                  class="btn btn-brown-fill w-100"
                >
                  <i class="fas fa-plus me-2"></i> THÊM VÀO PHIẾU
                </button>
              </div>
            </div>
          </div>

          <div class="queue-container mt-4" v-if="checkedItems.length > 0">
            <label class="label-small mb-2 d-block text-brown"
              >DANH SÁCH HÀNG ĐÃ CHỌN:</label
            >
            <div class="table-responsive rounded-3 border">
              <table class="table-mini m-0 w-100">
                <thead>
                  <tr>
                    <th class="ps-3">Sản phẩm (Phân loại)</th>
                    <th class="text-center">Số lượng</th>
                    <th
                      class="text-right"
                      v-if="modalType === 'Phiếu nhập kho'"
                    >
                      Giá nhập
                    </th>
                    <th class="text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in checkedItems" :key="index">
                    <td class="ps-3">{{ item.display_name }}</td>
                    <td class="text-center font-bold">{{ item.quantity }}</td>
                    <td
                      class="text-right"
                      v-if="modalType === 'Phiếu nhập kho'"
                    >
                      {{ formatPrice(item.price) }}
                    </td>
                    <td class="text-center">
                      <button
                        @click="checkedItems.splice(index, 1)"
                        class="btn-remove-item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="form-group mt-4">
            <label class="label-small">GHI CHÚ PHIẾU</label>
            <textarea
              v-model="reason"
              class="input-brown"
              rows="2"
              placeholder="Ví dụ: Nhập hàng hè, Điều chỉnh do kiểm kho dư..."
            ></textarea>
          </div>
        </div>

        <div
          class="modal-footer border-0 d-flex justify-content-end gap-3 pt-0"
        >
          <button @click="closeModal" class="btn btn-cancel-light px-4">
            HỦY BỎ
          </button>
          <button @click="submitBill" class="btn btn-brown-fill px-4 shadow">
            HOÀN TẤT
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="showDetailModal = false"
    >
      <div class="modal-content large-modal shadow-lg border-0">
        <div class="modal-header border-0 pb-0">
          <div>
            <h2
              class="fw-bold text-brown mb-1"
              style="text-transform: capitalize"
            >
              Chi Tiết {{ selectedBill.type }}
            </h2>
            <p class="small text-muted mb-0">
              Mã phiếu: {{ selectedBill._id }}
            </p>
          </div>
          <button @click="showDetailModal = false" class="close-btn">
            &times;
          </button>
        </div>

        <div class="modal-body py-4">
          <div class="row mb-4 g-3">
            <div class="col-md-4">
              <label class="label-small">NGƯỜI LẬP PHIẾU</label>
              <div class="p-2 border-bottom fw-bold text-brown">
                {{ selectedBill.employee_name || "Hệ thống" }}
              </div>
            </div>
            <div class="col-md-4">
              <label class="label-small">THỜI GIAN</label>
              <div class="p-2 border-bottom fw-bold">
                {{ formatDate(selectedBill.created).date }} -
                {{ formatDate(selectedBill.created).time }}
              </div>
            </div>
            <div class="col-md-4" v-if="selectedBill.type === 'Phiếu nhập kho'">
              <label class="label-small">TỔNG GIÁ TRỊ</label>
              <div class="p-2 border-bottom text-danger fw-bold">
                {{ formatPrice(selectedBill.total_price) }}
              </div>
            </div>
          </div>

          <label class="label-small mb-2 text-brown">DANH SÁCH MẶT HÀNG:</label>
          <div class="table-responsive rounded-3 border">
            <table class="table-mini m-0 w-100">
              <thead>
                <tr>
                  <th class="ps-3">Tên sản phẩm & Phân loại</th>
                  <th class="text-center">Số lượng</th>
                  <th
                    class="text-right"
                    v-if="selectedBill.type === 'Phiếu nhập kho'"
                  >
                    Đơn giá nhập
                  </th>
                  <th
                    class="text-right"
                    v-if="selectedBill.type === 'Phiếu nhập kho'"
                  >
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in selectedBill.items" :key="index">
                  <td class="ps-3">
                    <div class="fw-bold text-dark">{{ item.product_name }}</div>
                    <div class="small text-muted">
                      {{ item.color_name }} - {{ item.size_name }}
                    </div>
                  </td>
                  <td
                    class="text-center font-bold text-brown"
                    style="font-size: 1.1rem"
                  >
                    {{ item.quantity }}
                  </td>
                  <td
                    class="text-right"
                    v-if="selectedBill.type === 'Phiếu nhập kho'"
                  >
                    {{ formatPrice(item.price) }}
                  </td>
                  <td
                    class="text-right fw-bold text-danger"
                    v-if="selectedBill.type === 'Phiếu nhập kho'"
                  >
                    {{ formatPrice(item.price * item.quantity) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4" v-if="selectedBill.reason">
            <label class="label-small">GHI CHÚ / LÝ DO</label>
            <div
              class="p-3 bg-light rounded-3 italic text-muted border-start border-4 border-brown"
            >
              "{{ selectedBill.reason }}"
            </div>
          </div>
        </div>

        <div class="modal-footer border-0">
          <button
            @click="showDetailModal = false"
            class="btn btn-brown-fill px-5 shadow-sm"
          >
            ĐÓNG PHIẾU
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WarehouseService from "@/services/warehouse.service";
import ProductService from "@/services/product.service";
import SupplierService from "@/services/supplier.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";
export default {
  components: { Loading },
  data() {
    return {
      loading: true,
      bills: [],
      products: [],
      suppliers: [],
      currentVariants: [],
      showModal: false,
      modalType: "",
      selectedSupplierId: "",
      selectedProductId: "",
      checkedItems: [],
      tempItem: { variant_id: "", quantity: 1, price: 0 },
      reason: "",
      showDetailModal: false,
      selectedBill: {
        items: [],
      },
      filter: {
        search: "",
        type: "",
        startDate: "",
        endDate: "",
      },
    };
  },
  computed: {
    filteredBills() {
      return this.bills.filter((bill) => {
        //Lọc theo Search
        const matchesSearch =
          bill._id.toLowerCase().includes(this.filter.search.toLowerCase()) ||
          (bill.reason &&
            bill.reason
              .toLowerCase()
              .includes(this.filter.search.toLowerCase()));

        //Lọc theo Loại phiếu
        const matchesType =
          this.filter.type === "" || bill.type === this.filter.type;

        //Lọc theo Thời gian
        const billDate = new Date(bill.created).setHours(0, 0, 0, 0);
        const start = this.filter.startDate
          ? new Date(this.filter.startDate).setHours(0, 0, 0, 0)
          : null;
        const end = this.filter.endDate
          ? new Date(this.filter.endDate).setHours(0, 0, 0, 0)
          : null;

        let matchesDate = true;
        if (start && billDate < start) matchesDate = false;
        if (end && billDate > end) matchesDate = false;

        return matchesSearch && matchesType && matchesDate;
      });
    },
  },
  methods: {
    async loadInitialData() {
      this.loading = true;
      try {
        const [pRes, sRes, bRes] = await Promise.all([
          ProductService.getAllProducts(),
          SupplierService.getAllSupplier(),
          WarehouseService.getAllBill(),
        ]);
        this.products = pRes.products || [];
        this.suppliers = sRes.suppliers || [];
        this.bills = bRes.bills || [];
      } catch (err) {
        console.error("Lỗi khởi tạo:", err);
      } finally {
        setTimeout(() => {
          this.loading = false;
        }, 300);
      }
    },
    async onProductChange() {
      this.currentVariants = [];
      this.tempItem.variant_id = "";
      if (!this.selectedProductId) return;
      try {
        const response = await ProductService.getProductById(
          this.selectedProductId,
        );
        this.currentVariants = response.product.variant || [];
      } catch (err) {
        console.error("Lỗi lấy biến thể:", err);
      }
    },
    resetFilter() {
      this.filter = { search: "", type: "", startDate: "", endDate: "" };
    },
    addItemToQueue() {
      if (!this.tempItem.variant_id) {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin",
          text: "Bạn chưa chọn màu hoặc size",
          confirmButtonColor: "#533422",
        });
      }
      const qty = this.tempItem.quantity;

      // Check cứng theo loại phiếu
      if (this.modalType === "Phiếu nhập kho") {
        if (qty <= 0) {
          return Swal.fire({
            icon: "error",
            text: "Số lượng nhập kho phải lớn hơn 0",
            confirmButtonColor: "#533422",
          });
        }
      } else {
        if (qty === 0) {
          return Swal.fire({
            icon: "warning",
            text: "Điều chỉnh hoặc Xuất hàng thì số lượng phải khác 0",
            confirmButtonColor: "#533422",
          });
        }
      }

      const v = this.currentVariants.find(
        (x) => x._id === this.tempItem.variant_id,
      );
      const p = this.products.find((x) => x._id === this.selectedProductId);

      this.checkedItems.push({
        variant_id: this.tempItem.variant_id,
        quantity: qty,
        price: this.tempItem.price,
        display_name: `${p.product_name} (${v.color_name} - ${v.size_name})`,
      });

      this.tempItem.variant_id = "";
      this.tempItem.quantity = 1;
    },
    async submitBill() {
      if (this.checkedItems.length === 0) {
        return Swal.fire({
          icon: "warning",
          text: "Không có sản phẩm nào nằm trong phiếu",
          confirmButtonColor: "#533422",
        });
      }

      const result = await Swal.fire({
        title: "Xác nhận tạo phiếu?",
        text: `Bạn có chắc muốn lưu ${this.modalType} này không?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#533422",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Đồng ý lưu",
        cancelButtonText: "Kiểm tra lại",
      });

      if (result.isConfirmed) {
        this.loading = true;
        const payload = {
          type: this.modalType,
          supplier_id: this.selectedSupplierId,
          items: this.checkedItems,
          reason: this.reason,
        };
        try {
          await WarehouseService.createBill(payload);
          await Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Phiếu kho đã được tạo và cập nhật số lượng tồn.",
            confirmButtonColor: "#533422",
            timer: 2000,
            showConfirmButton: false,
          });
          this.closeModal();
          this.loadInitialData();
        } catch (err) {
          this.loading = false;
          Swal.fire({
            icon: "error",
            text: err.response?.data?.message || err.message,
            confirmButtonColor: "#533422",
          });
        }
      }
    },
    openModal(type) {
      this.modalType = type;
      this.showModal = true;
      this.checkedItems = [];
      this.selectedProductId = "";
      this.reason = "";
    },
    closeModal() {
      this.showModal = false;
    },
    formatPrice(p) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(p);
    },
    viewDetail(bill) {
      this.selectedBill = bill;
      this.showDetailModal = true;
    },
    getTypeClass(t) {
      if (!t) return "";
      return t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    },
    formatDate(d) {
      const dt = new Date(d);
      return {
        date: dt.toLocaleDateString("vi-VN"),
        time: dt.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    },
  },
  mounted() {
    this.loadInitialData();
  },
};
</script>

<style scoped>
.warehouse-container {
  padding: 2rem;
  background-color: #faf9f8;
  min-height: 100vh;
  font-family: "Segoe UI", sans-serif;
}
.warehouse-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}
.warehouse-header h1 {
  color: #3e2723;
  font-weight: 800;
  font-size: 1.8rem;
  margin: 0;
}
.warehouse-header p {
  color: #8d6e63;
  margin-top: 5px;
}

.phieu-xuat-hang {
  background: #fff1f0 !important;
  color: #cf1322 !important;
  border: 1px solid #ffa39e;
}

.filter-section {
  border: 1px solid #efebe9;
}
.search-input-wrapper {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #a1887f;
}
.input-brown[type="date"] {
  cursor: pointer;
}

.btn-cancel-light {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.table-wrapper {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  background-color: #efebe9;
  padding: 1.2rem 1rem;
  font-size: 0.7rem;
  color: #8d6e63;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
}
td {
  padding: 1.2rem 1rem;
  border-bottom: 1px solid #f8f5f2;
  color: #4e342e;
  font-size: 0.9rem;
}

/* Nút thao tác */
.btn-action {
  background: #fdfaf9;
  border: 1px solid #efebe9;
  border-radius: 8px;
  padding: 5px 10px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-action:hover {
  background: #efebe9;
  transform: scale(1.1);
}
.text-brown {
  color: #5d4037;
}

/* Badge & Text */
.badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 800;
}

.phieu-nhap-kho {
  background: #f1f8e9 !important;
  color: #33691e !important;
  border: 1px solid #dcedc8;
}

.phieu-dieu-chinh {
  background: #fffbe6 !important;
  color: #d48806 !important;
  border: 1px solid #ffe58f;
}

.date-text {
  font-weight: 700;
  color: #3e2723;
}
.time-text {
  font-size: 0.75rem;
  color: #a1887f;
}
.admin-badge {
  background: #efebe9;
  color: #5d4037;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Buttons */
.btn {
  padding: 0.7rem 1.4rem;
  border-radius: 10px;
  font-weight: 700;
  border: none;
  transition: 0.3s;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn-import {
  background-color: #5d4037;
  color: white;
}
.btn-adjust {
  background-color: #a1887f;
  color: white;
}
.btn-brown-fill {
  background-color: #5d4037;
  color: white;
}
.btn-cancel-light {
  background-color: #f5f5f5;
  color: #5d4037;
  border: 1px solid #d7ccc8;
}

.large-modal {
  width: 850px !important;
  max-width: 95%;
  border-radius: 20px;
  background: white;
  padding: 2rem;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: thin;
}
.queue-container .table-responsive {
  max-height: 250px;
  overflow-y: auto;
  border: 2px solid #efebe9;
  scrollbar-width: thin;
  scrollbar-color: #5d4037 #fdfaf9;
}

.table-mini thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f8f5f2;
}

.large-modal::-webkit-scrollbar,
.queue-container .table-responsive::-webkit-scrollbar {
  width: 6px;
}
.large-modal::-webkit-scrollbar-thumb,
.queue-container .table-responsive::-webkit-scrollbar-thumb {
  background-color: #5d4037;
  border-radius: 10px;
}
.large-modal::-webkit-scrollbar-track,
.queue-container .table-responsive::-webkit-scrollbar-track {
  background: #fdfaf9;
}
.add-item-box {
  background: #fdfaf9;
  padding: 20px;
  border-radius: 15px;
  border: 1px dashed #d7ccc8;
  margin-bottom: 20px;
}
.box-title {
  font-size: 0.8rem;
  font-weight: 800;
  color: #8d6e63;
  text-transform: uppercase;
  margin-bottom: 15px;
  letter-spacing: 1px;
}
.label-small {
  font-size: 0.7rem;
  font-weight: 800;
  color: #a1887f;
  margin-bottom: 5px;
  display: block;
}
.input-brown {
  border: 2px solid #efebe9;
  padding: 10px;
  border-radius: 10px;
  width: 100%;
  transition: 0.3s;
  font-size: 0.9rem;
}
.input-brown:focus {
  border-color: #5d4037;
  outline: none;
  background: white;
}

.table-mini th {
  background-color: #f8f5f2;
  padding: 10px;
  font-size: 0.75rem;
  color: #5d4037;
}
.table-mini td {
  padding: 10px;
  font-size: 0.85rem;
  border-bottom: 1px solid #f1f1f1;
}
.btn-remove-item {
  color: #d32f2f;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(248, 246, 245, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #8d6e63;
  cursor: pointer;
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}
</style>
