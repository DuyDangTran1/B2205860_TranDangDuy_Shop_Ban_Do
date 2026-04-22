<template>
  <div class="category-manager p-4">
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
    >
      <div>
        <h4 class="fw-bold text-brown m-0 text-uppercase">Quản lý Thể loại</h4>
      </div>

      <div class="d-flex gap-2">
        <button
          class="btn btn-brown px-4 shadow-sm fw-bold"
          @click="openAddModal"
        >
          <i class="fas fa-plus me-2"></i> THÊM MỚI
        </button>
      </div>
    </div>
    <div class="mb-4">
      <div class="position-relative w-100" style="max-width: 500px">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control ps-5 shadow-sm border-0 py-2"
          placeholder="Tìm tên thể loại, mô tả..."
        />
        <i
          class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
        ></i>
      </div>
    </div>
    <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div class="card-body p-0">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th
                class="ps-4 py-3 text-dark fw-bold small text-uppercase"
                style="width: 50%"
              >
                Tên thể loại
              </th>
              <th
                class="py-3 text-dark fw-bold small text-uppercase"
                style="width: 30%"
              >
                Danh mục cha
              </th>
              <th
                class="pe-4 py-3 text-dark fw-bold small text-uppercase text-end"
              >
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="cat in filteredCategories"
              :key="cat._id"
              class="border-bottom"
            >
              <td class="ps-4 py-3">
                <div class="fw-bold text-dark fs-5 mb-1">
                  {{ cat.category_name }}
                </div>
                <div class="text-secondary small italic">
                  {{
                    cat.description || "Chưa có mô tả chi tiết cho danh mục này"
                  }}
                </div>
              </td>
              <td>
                <span v-if="cat.parent_name" class="text-dark fw-medium">
                  {{ cat.parent_name }}
                </span>
                <span v-else class="text-secondary opacity-50"
                  >Danh mục gốc</span
                >
              </td>
              <td class="pe-4 text-end">
                <div class="btn-group shadow-sm">
                  <button
                    @click="openEditModal(cat)"
                    class="btn btn-white text-warning border-end"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="deleteCategory(cat._id)"
                    class="btn btn-white text-danger"
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

    <div v-if="showModal" class="custom-modal-overlay">
      <div
        class="custom-modal-content p-4 shadow-lg rounded-4 animate__animated animate__fadeInDown"
      >
        <div
          class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2"
        >
          <h5 class="fw-bold m-0 text-brown">
            {{ isEdit ? "CẬP NHẬT" : "THÊM MỚI" }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="showModal = false"
          ></button>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary"
            >TÊN THỂ LOẠI *</label
          >
          <input
            v-model="formData.category_name"
            type="text"
            class="form-control form-control-lg border-2"
            placeholder="Nhập tên..."
          />
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary"
            >DANH MỤC CHA</label
          >
          <select v-model="formData.parent_name" class="form-select border-2">
            <option :value="null">Gốc (Không có cha)</option>
            <option
              v-for="item in categories"
              :key="item._id"
              :value="item.category_name"
              :disabled="item.category_name === formData.category_name"
            >
              {{ item.category_name }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label small fw-bold text-secondary text-uppercase">
            Gợi ý phối đồ (cách nhau bằng dấu phẩy)
          </label>
          <input
            v-model="formData.suggested_outfits"
            type="text"
            class="form-control border-2"
            placeholder="Ví dụ: Quần tây, Thắt lưng da, Giày tây..."
          />
          <div class="form-text small italic">
            * AI sẽ dựa vào đây để gợi ý sản phẩm phù hợp cho khách hàng.
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label small fw-bold text-secondary">MÔ TẢ</label>
          <textarea
            v-model="formData.description"
            class="form-control border-2"
            rows="3"
            placeholder="Nhập mô tả ngắn..."
          ></textarea>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button
            class="btn btn-light px-4 border shadow-sm"
            @click="showModal = false"
          >
            HỦY
          </button>
          <button class="btn btn-brown px-4 shadow" @click="handleSave">
            LƯU LẠI
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import categoryService from "@/services/category.service";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      showModal: false,
      isEdit: false,
      searchQuery: "",
      categories: [],
      formData: {
        _id: null,
        category_name: "",
        parent_name: null,
        description: "",
        suggested_outfits: "",
      },
    };
  },
  computed: {
    filteredCategories() {
      if (!Array.isArray(this.categories)) return [];
      return this.categories.filter((c) =>
        c.category_name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
    },
  },
  methods: {
    async fetchCategories() {
      try {
        const res = await categoryService.getAllCategory();
        this.categories = res.categories || [];
      } catch (err) {
        console.error(err);
      }
    },
    openAddModal() {
      this.isEdit = false;
      this.formData = {
        category_name: "",
        parent_name: null,
        description: "",
        suggested_outfits: "",
      };
      this.showModal = true;
    },
    openEditModal(cat) {
      this.isEdit = true;
      this.formData = { ...cat };
      this.showModal = true;
    },
    async handleSave() {
      if (!this.formData.category_name)
        return Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin",
          text: "Vui lòng nhập tên thể loại!",
          confirmButtonColor: "#533422",
        });
      try {
        if (this.isEdit) {
          await categoryService.updateCategory(
            this.formData._id,
            this.formData,
          );
        } else {
          await categoryService.createCategory(this.formData);
        }
        this.showModal = false;
        Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: this.isEdit ? "Đã cập nhật thể loại." : "Đã thêm thể loại mới.",
          confirmButtonColor: "#533422",
          timer: 1500,
          showConfirmButton: false,
        });
        await this.fetchCategories();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể lưu dữ liệu, vui lòng thử lại!",
          confirmButtonColor: "#533422",
        });
      }
    },
    async deleteCategory(id) {
      const result = await Swal.fire({
        title: "Xác nhận xóa?",
        text: "Bạn có chắc chắn muốn xóa thể loại này không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#533422",
        confirmButtonText: "Đồng ý xóa",
        cancelButtonText: "Hủy bỏ",
      });
      if (result.isConfirmed) {
        try {
          await categoryService.deleteCategory(id);
          Swal.fire({
            icon: "success",
            title: "Đã xóa!",
            text: "Thể loại đã được loại bỏ khỏi hệ thống.",
            confirmButtonColor: "#533422",
            timer: 1500,
            showConfirmButton: false,
          });
          await this.fetchCategories();
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Lỗi khi xóa",
            text: "Có lỗi xảy ra, vui lòng kiểm tra lại!",
            confirmButtonColor: "#533422",
          });
        }
      }
    },
  },
  mounted() {
    this.fetchCategories();
  },
};
</script>

<style scoped>
.text-brown {
  color: #533422;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
}
.btn-brown:hover {
  background-color: #3e2719;
  color: white;
  transform: translateY(-1px);
}
.fs-5 {
  font-size: 1.15rem !important;
}
.btn-white {
  background: #fff;
  border: 1px solid #eee;
}
.btn-white:hover {
  background: #f8f9fa;
}

.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.custom-modal-content {
  background: white;
  width: 480px;
}
.form-control:focus,
.form-select:focus {
  border-color: #533422;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(83, 52, 34, 0.1);
}
</style>
