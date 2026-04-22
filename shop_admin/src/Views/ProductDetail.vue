<template>
  <div class="product-detail p-4" v-if="product">
    <Loading :isLoading="isLoading" />

    <div class="d-flex align-items-center mb-4">
      <button
        @click="$router.back()"
        class="btn btn-light rounded-circle me-3 shadow-sm border"
      >
        <i class="fas fa-arrow-left"></i>
      </button>
      <h4 class="fw-bold text-brown m-0 text-uppercase">Chi tiết sản phẩm</h4>
    </div>

    <div class="row g-4">
      <div class="col-lg-4">
        <div
          class="card border-0 shadow-sm rounded-3 mb-4 sticky-top"
          style="top: 20px"
        >
          <img
            :src="`http://localhost:3000/${product.image_url}`"
            class="card-img-top rounded-top-3 object-fit-cover"
            style="height: 350px"
          />
          <div class="card-body p-4">
            <div class="card-body p-4 text-center">
              <div
                class="d-flex align-items-center justify-content-center mb-2"
              >
                <h5 class="fw-bold text-brown m-0">
                  {{ product.product_name }}
                </h5>
                <button
                  @click="
                    $router.push({
                      name: 'product_edit',
                      params: { id: product._id },
                    })
                  "
                  class="btn btn-sm text-warning ms-2 shadow-none"
                  title="Chỉnh sửa thông tin sản phẩm"
                >
                  <i class="fas fa-pen"></i>
                </button>
              </div>

              <p class="text-muted small mb-3">ID: {{ product._id }}</p>
            </div>

            <div class="row g-3 mt-2">
              <div class="col-6 border-end">
                <div class="small text-secondary fw-bold text-uppercase">
                  Giá gốc
                </div>
                <div class="text-brown fw-bold fs-5">
                  {{ formatPrice(product.base_price) }}đ
                </div>
              </div>
              <div class="col-6 ps-3">
                <div class="small text-secondary fw-bold text-uppercase">
                  Khuyến mãi
                </div>
                <div
                  :class="product.discount > 0 ? 'text-danger' : 'text-muted'"
                  class="fw-bold fs-5"
                >
                  {{
                    product.discount > 0 ? `-${product.discount}%` : "Không có"
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h5 class="fw-bold m-0 text-brown">DANH SÁCH BIẾN THỂ</h5>
              <button
                class="btn btn-brown btn-sm px-4 shadow-sm fw-bold rounded-pill"
                @click="openAddVariantModal"
              >
                <i class="fas fa-plus me-2"></i> THÊM BIẾN THỂ
              </button>
            </div>

            <div class="table-responsive">
              <table
                class="table table-hover align-middle text-center border-top"
              >
                <thead class="bg-light">
                  <tr>
                    <th class="py-3">Ảnh</th>
                    <th class="py-3">Màu sắc</th>
                    <th class="py-3">Kích thước</th>
                    <th class="py-3">Số lượng</th>
                    <th class="py-3 text-end pe-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="v in variants" :key="v._id">
                    <td class="py-3">
                      <img
                        :src="`http://localhost:3000/${v.image_url}`"
                        class="rounded-3 border shadow-sm"
                        style="width: 50px; height: 50px; object-fit: cover"
                      />
                    </td>
                    <td class="fw-bold text-dark">{{ v.color_name }}</td>
                    <td>
                      <span class="badge bg-secondary px-3 py-2 rounded-pill">{{
                        v.size_name
                      }}</span>
                    </td>
                    <td>
                      <span
                        :class="v.quantity > 0 ? 'text-success' : 'text-danger'"
                        class="fw-bold"
                      >
                        {{ v.quantity }}
                      </span>
                    </td>
                    <td class="pe-4 text-end">
                      <div class="btn-group shadow-sm">
                        <button
                          class="btn btn-white text-warning border-end"
                          @click="openEditVariantModal(v)"
                          title="Sửa"
                        >
                          <i class="fas fa-edit"></i>
                        </button>
                        <button
                          class="btn btn-white text-danger"
                          @click="handleDeleteVariant(v._id)"
                          title="Xóa"
                        >
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="variants.length === 0">
                    <td colspan="5" class="py-5 text-muted small italic">
                      <i
                        class="fas fa-box-open fa-2x mb-2 d-block opacity-25"
                      ></i>
                      Chưa có biến thể cho sản phẩm này.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="custom-modal-overlay">
      <div
        class="custom-modal-content p-4 shadow-lg rounded-4 animate__animated animate__fadeInUp animate__faster"
      >
        <div
          class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2"
        >
          <h5 class="fw-bold m-0 text-brown">
            {{ isEdit ? "CẬP NHẬT BIẾN THỂ" : "THÊM BIẾN THỂ MỚI" }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="showModal = false"
          ></button>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary"
            >MÀU SẮC *</label
          >
          <input
            v-model="variantForm.color_name"
            type="text"
            class="form-control border-2 modern-input"
            placeholder="Ví dụ: Đen, Trắng..."
          />
        </div>
        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary"
            >KÍCH THƯỚC *</label
          >
          <input
            v-model="variantForm.size_name"
            type="text"
            class="form-control border-2 modern-input"
            placeholder="Ví dụ: M, L, XL..."
          />
        </div>
        <div class="mb-4">
          <label class="form-label small fw-bold text-secondary"
            >ẢNH BIẾN THỂ *</label
          >
          <input
            type="file"
            @change="onFileChange"
            class="form-control border-2 modern-input"
            accept="image/*"
          />
          <div v-if="isEdit" class="mt-2 small text-muted italic">
            (Để trống nếu không muốn đổi ảnh cũ)
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button
            class="btn btn-light px-4 border shadow-sm fw-bold"
            @click="showModal = false"
          >
            HỦY
          </button>
          <button
            class="btn btn-brown px-4 shadow fw-bold"
            @click="saveVariant"
          >
            LƯU LẠI
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from "@/components/Loading.vue";
import productService from "@/services/product.service";
import variantService from "@/services/product_variant.service";
import Swal from "sweetalert2";

export default {
  components: { Loading },
  data() {
    return {
      product: null,
      variants: [],
      isLoading: false,
      showModal: false,
      isEdit: false,
      selectedFile: null,
      variantForm: { _id: null, color_name: "", size_name: "" },
    };
  },
  methods: {
    async init() {
      this.isLoading = true;
      const id = this.$route.params.id;
      try {
        const res = await productService.getProductById(id);
        if (res) {
          this.product = res.product;
          this.variants = res.product.variant || [];
        }
      } catch (err) {
        console.error("Lỗi:", err);
        Swal.fire("Lỗi", "Không load được data!", "error");
      } finally {
        this.isLoading = false;
      }
    },
    formatPrice(v) {
      if (!v) return "0";
      return new Intl.NumberFormat("vi-VN").format(v);
    },
    onFileChange(e) {
      this.selectedFile = e.target.files[0];
    },
    openAddVariantModal() {
      this.isEdit = false;
      this.selectedFile = null;
      this.variantForm = { color_name: "", size_name: "" };
      this.showModal = true;
    },
    openEditVariantModal(v) {
      this.isEdit = true;
      this.selectedFile = null;
      this.variantForm = { ...v };
      this.showModal = true;
    },
    async saveVariant() {
      if (!this.variantForm.color_name || !this.variantForm.size_name) {
        return Swal.fire("Cảnh báo", "Vui lòng nhập đủ thông tin!", "warning");
      }

      const data = new FormData();
      data.append("product_id", this.product._id);
      data.append("color_name", this.variantForm.color_name);
      data.append("size_name", this.variantForm.size_name);
      if (this.selectedFile) data.append("image", this.selectedFile);

      try {
        if (this.isEdit) {
          await variantService.updateVariant(this.variantForm._id, data);
          Swal.fire("Thành công", "Đã cập nhật biến thể!", "success");
        } else {
          await variantService.createVariant(data);
          Swal.fire("Thành công", "Đã thêm biến thể mới!", "success");
        }
        this.showModal = false;
        await this.init();
      } catch (err) {
        Swal.fire("Lỗi", "Không lưu được dữ liệu biến thể!", "error");
      }
    },
    async handleDeleteVariant(id) {
      const res = await Swal.fire({
        title: "Thông báo",
        text: "Xác nhận xóa biến thể",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#533422",
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
      });
      if (res.isConfirmed) {
        try {
          await variantService.deleteVariant(id);
          await this.init();
          Swal.fire("Thành công", "Đã xóa biến thể!", "success");
        } catch (err) {
          Swal.fire("Lỗi", "Không xóa được rồi!", "error");
        }
      }
    },
  },
  mounted() {
    this.init();
  },
};
</script>

<style scoped>
.text-brown {
  color: #533422;
}
.bg-light-brown {
  background-color: #fcf8f6;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
}
.btn-brown:hover {
  background-color: #3e2719;
}
.btn-white {
  background: #fff;
  border: 1px solid #eee;
}
.border-brown {
  border-color: #533422 !important;
}

.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.custom-modal-content {
  background: white;
  width: 100%;
  max-width: 480px;
}
.modern-input:focus {
  border-color: #533422;
  box-shadow: 0 0 0 0.25rem rgba(83, 52, 34, 0.1);
}
</style>
