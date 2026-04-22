<script>
import productService from "@/services/product.service";
import categoryService from "@/services/category.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";

export default {
  components: { Loading },
  data() {
    return {
      products: [],
      categories: [],
      selectedCategory: "",
      searchQuery: "",
      isLoading: false,
      showDiscountModal: false,
      // Form dùng để set giảm giá
      discountForm: {
        id: "",
        discount: 0,
        discount_start: this.getToday(),
        discount_end: this.getToday(),
      },
    };
  },
  computed: {
    subCategories() {
      return this.categories.filter(
        (cat) => cat.parent_name !== null && cat.parent_name !== "",
      );
    },
    filteredProducts() {
      return this.products.filter((p) => {
        const matchName = p.product_name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
        const matchCategory =
          this.selectedCategory === "" ||
          p.category_id === this.selectedCategory;
        return matchName && matchCategory;
      });
    },
  },
  methods: {
    async initData() {
      this.isLoading = true;
      try {
        const [prodRes, catRes] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getAllCategory(),
        ]);
        this.products = prodRes.products || [];
        this.categories = catRes.categories || [];
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        console.error("Lỗi tải dữ liệu:", err);
        Swal.fire({
          icon: "error",
          title: "Lỗi tải dữ liệu",
          text: "Không thể kết nối với máy chủ",
          confirmButtonColor: "#533422",
        });
      } finally {
        this.isLoading = false;
      }
    },
    getToday() {
      return new Date().toISOString().split("T")[0];
    },
    formatPrice(val) {
      return new Intl.NumberFormat("vi-VN").format(val);
    },
    // 1. Hàm mở Modal Set Giảm Giá chung
    openGeneralDiscountModal() {
      this.discountForm = {
        id: "", // Trống để Admin tự chọn
        discount: 0,
        discount_start: this.getToday(),
        discount_end: this.getToday(),
      };
      this.showDiscountModal = true;
    },
    // 2. Hàm xử lý lưu giảm giá
    async confirmSetDiscount() {
      if (!this.discountForm.id) {
        return Swal.fire("Lỗi", "Vui lòng chọn sản phẩm!", "error");
      }
      this.isLoading = true;
      try {
        await productService.setDiscount(this.discountForm.id, {
          discount: Number(this.discountForm.discount),
          discount_start: this.discountForm.discount_start,
          discount_end: this.discountForm.discount_end,
        });

        Swal.fire("Thành công", "Đã cập nhật giảm giá sản phẩm", "success");
        this.showDiscountModal = false;
        this.initData(); // Load lại bảng để thấy giá mới
      } catch (err) {
        Swal.fire("Lỗi", "Không thể cập nhật giảm giá", "error");
      } finally {
        this.isLoading = false;
      }
    },
    // Các hàm điều hướng và xóa khác
    goToAdd() {
      this.$router.push("products/add");
    },
    viewDetail(id) {
      this.$router.push(`products/detail/${id}`);
    },
    async deleteProduct(id) {
      const result = await Swal.fire({
        title: "Xác nhận xóa?",
        text: "Hành động này không thể hoàn tác!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa ngay",
        cancelButtonText: "Hủy",
      });
      if (result.isConfirmed) {
        try {
          await productService.deleteProduct(id);
          Swal.fire("Đã xóa!", "Sản phẩm đã xóa thành công", "success");
          this.initData();
        } catch (err) {
          Swal.fire("Lỗi", "Xóa thất bại", "error");
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
  <div class="product-manager p-4">
    <Loading :isLoading="isLoading" />

    <div v-if="!isLoading">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="fw-bold text-brown m-0 text-uppercase">Kho Sản Phẩm</h4>
        <button
          class="btn btn-brown px-4 py-2 shadow-sm fw-bold rounded-pill"
          @click="goToAdd"
        >
          <i class="fas fa-plus me-2"></i> THÊM MỚI
        </button>
      </div>

      <div
        class="row g-2 mb-4 align-items-center bg-white p-2 rounded-3 shadow-sm mx-0 border"
      >
        <div class="col-md-4">
          <div class="position-relative">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control ps-5 border-0 bg-light rounded-pill"
              placeholder="Tìm tên sản phẩm..."
            />
            <i
              class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"
            ></i>
          </div>
        </div>

        <div class="col-md-auto ms-auto border-start ps-3">
          <button
            class="btn btn-outline-danger px-3 rounded-pill fw-bold btn-sm"
            @click="openGeneralDiscountModal"
          >
            <i class="fas fa-percentage me-1"></i> SET GIẢM GIÁ
          </button>
        </div>

        <div class="col-md-3 border-start ps-3">
          <select
            v-model="selectedCategory"
            class="form-select border-0 bg-light rounded-pill px-4 btn-sm fw-medium"
          >
            <option value="">Lọc theo loại hàng</option>
            <option
              v-for="cat in subCategories"
              :key="cat._id"
              :value="cat._id"
            >
              {{ cat.category_name }}
            </option>
          </select>
        </div>

        <div class="col-auto">
          <button
            @click="initData"
            class="btn btn-light btn-sm rounded-circle border shadow-sm"
          >
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-3 overflow-hidden border">
        <div class="card-body p-0">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3 small fw-bold text-uppercase">Sản phẩm</th>
                <th class="py-3 small fw-bold text-uppercase text-center">
                  Giá cơ bản
                </th>
                <th class="py-3 small fw-bold text-uppercase text-center">
                  Giảm giá
                </th>
                <th class="py-3 small fw-bold text-uppercase text-end pe-4">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="prod in filteredProducts"
                :key="prod._id"
                class="border-bottom"
              >
                <td class="ps-4 py-3">
                  <div class="d-flex align-items-center gap-3">
                    <img
                      :src="`http://localhost:3000/${prod.image_url}`"
                      class="rounded-3 border object-fit-cover"
                      style="width: 50px; height: 50px"
                    />
                    <div>
                      <div class="fw-bold text-dark">
                        {{ prod.product_name }}
                      </div>
                      <div class="text-secondary small">
                        ID: {{ prod._id.substring(18) }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <span class="fw-bold text-brown"
                    >{{ formatPrice(prod.base_price) }}đ</span
                  >
                </td>
                <td class="text-center">
                  <span
                    v-if="prod.discount > 0"
                    class="badge bg-danger-subtle text-danger px-3 py-2 rounded-pill"
                    >-{{ prod.discount }}%</span
                  >
                  <span v-else class="text-muted small">0%</span>
                </td>
                <td class="pe-4 text-end">
                  <div class="btn-group shadow-sm">
                    <button
                      @click="viewDetail(prod._id)"
                      class="btn btn-white text-primary border-end"
                      title="Xem chi tiết"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      @click="deleteProduct(prod._id)"
                      class="btn btn-white text-danger"
                      title="Xóa"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showDiscountModal" class="modal-overlay">
      <div
        class="modal-content p-4 shadow-lg rounded-4 border-0"
        style="max-width: 500px"
      >
        <h5 class="fw-bold text-brown mb-4 text-uppercase border-bottom pb-2">
          Thiết lập giảm giá
        </h5>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary text-uppercase"
            >Chọn sản phẩm</label
          >
          <select
            v-model="discountForm.id"
            class="form-select border-0 bg-light rounded-3"
          >
            <option value="" disabled>-- Chọn sản phẩm cần giảm --</option>
            <option v-for="p in products" :key="p._id" :value="p._id">
              {{ p.product_name }} ({{ formatPrice(p.base_price) }}đ)
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary text-uppercase"
            >Mức giảm (%)</label
          >
          <input
            v-model="discountForm.discount"
            type="number"
            class="form-control rounded-3 border-0 bg-light"
            placeholder="Nhập số %"
          />
        </div>

        <div class="row g-2 mb-4">
          <div class="col-6">
            <label
              class="form-label small fw-bold text-secondary text-uppercase"
              >Bắt đầu</label
            >
            <input
              v-model="discountForm.discount_start"
              type="date"
              class="form-control rounded-3 border-0 bg-light"
            />
          </div>
          <div class="col-6">
            <label
              class="form-label small fw-bold text-secondary text-uppercase"
              >Kết thúc</label
            >
            <input
              v-model="discountForm.discount_end"
              type="date"
              class="form-control rounded-3 border-0 bg-light"
            />
          </div>
        </div>

        <div class="d-flex gap-2">
          <button
            @click="showDiscountModal = false"
            class="btn btn-outline-secondary w-100 rounded-pill fw-bold"
          >
            HỦY
          </button>
          <button
            @click="confirmSetDiscount"
            class="btn btn-brown w-100 rounded-pill fw-bold text-white"
          >
            XÁC NHẬN
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-brown {
  color: #533422;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
  transition: 0.3s;
}
.btn-brown:hover {
  background-color: #3e2719;
  transform: translateY(-2px);
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
  width: 90%;
}
.bg-danger-subtle {
  background-color: #fce8e8;
}
.btn-white {
  background: white;
  border: 1px solid #eee;
}
</style>
