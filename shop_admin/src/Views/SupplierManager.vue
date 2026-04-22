<template>
  <div class="supplier-manager p-4">
    <div
      class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4"
    >
      <div>
        <h4 class="fw-bold text-brown m-0 text-uppercase tracking-wider">
          Quản lý Nhà Cung Cấp
        </h4>
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

    <div class="d-flex flex-column flex-md-row gap-3 mb-4 align-items-center">
      <div class="position-relative flex-grow-1" style="max-width: 500px">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control ps-5 shadow-sm search-input py-2"
          placeholder="Tìm tên, số điện thoại, địa chỉ..."
        />
        <i
          class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
        ></i>
      </div>

      <div class="col-md-4 col-lg-3">
        <select
          v-model="statusFilter"
          class="form-select shadow-sm py-2 border-2 modern-input fw-bold text-secondary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hợp tác</option>
          <option value="inactive">Ngừng hợp tác</option>
        </select>
      </div>
    </div>

    <div class="card border-0 shadow-sm rounded-3 overflow-hidden">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th
                  class="ps-4 py-3 text-dark fw-bold small text-uppercase"
                  style="width: 25%"
                >
                  Tên nhà cung cấp
                </th>
                <th
                  class="py-3 text-dark fw-bold small text-uppercase"
                  style="width: 15%"
                >
                  Liên hệ
                </th>
                <th
                  class="py-3 text-dark fw-bold small text-uppercase"
                  style="width: 30%"
                >
                  Địa chỉ
                </th>
                <th
                  class="py-3 text-dark fw-bold small text-uppercase text-center"
                >
                  Trạng thái
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
                v-for="sup in filteredSuppliers"
                :key="sup._id"
                class="border-bottom"
              >
                <td class="ps-4 py-3">
                  <div class="fw-bold text-dark fs-6">
                    {{ sup.supplier_name }}
                  </div>
                </td>
                <td>{{ sup.supplier_phone }}</td>
                <td>
                  <span class="text-secondary small">{{
                    sup.supplier_address
                  }}</span>
                </td>
                <td class="text-center">
                  <span
                    :class="
                      sup.is_collaborating ? 'badge-active' : 'badge-inactive'
                    "
                    class="badge px-3 py-2 rounded-pill shadow-sm"
                  >
                    {{
                      sup.is_collaborating ? "Đang hợp tác" : "Ngừng hợp tác"
                    }}
                  </span>
                </td>
                <td class="pe-4 text-end">
                  <div class="btn-group shadow-sm">
                    <button
                      @click="openEditModal(sup)"
                      class="btn btn-white text-warning border-end"
                      title="Sửa"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      @click="toggleStatus(sup)"
                      class="btn btn-white"
                      :class="
                        sup.is_collaborating ? 'text-danger' : 'text-success'
                      "
                      :title="
                        sup.is_collaborating ? 'Ngừng hợp tác' : 'Tái hợp tác'
                      "
                    >
                      <i
                        class="fas"
                        :class="
                          sup.is_collaborating
                            ? 'fa-user-slash'
                            : 'fa-user-check'
                        "
                      ></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredSuppliers.length === 0">
                <td colspan="5" class="text-center py-5 text-muted">
                  Không tìm thấy nhà cung cấp nào
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="custom-modal-overlay">
      <div
        class="custom-modal-content p-4 shadow-lg rounded-4 animate__animated animate__fadeInDown animate__faster"
      >
        <div
          class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2"
        >
          <h5 class="fw-bold m-0 text-brown">
            {{ isEdit ? "CẬP NHẬT ĐỐI TÁC" : "THÊM ĐỐI TÁC MỚI" }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="showModal = false"
          ></button>
        </div>

        <div class="row g-3">
          <div class="col-12">
            <label class="form-label small fw-bold text-secondary"
              >TÊN NHÀ CUNG CẤP *</label
            >
            <input
              v-model="formData.supplier_name"
              type="text"
              class="form-control border-2 modern-input"
              placeholder="Nhập tên..."
            />
          </div>
          <div class="col-12">
            <label class="form-label small fw-bold text-secondary"
              >SỐ ĐIỆN THOẠI *</label
            >
            <input
              v-model="formData.supplier_phone"
              type="text"
              class="form-control border-2 modern-input"
              placeholder="Nhập SĐT..."
            />
          </div>
          <div class="col-12 mb-2">
            <label class="form-label small fw-bold text-secondary"
              >ĐỊA CHỈ *</label
            >
            <textarea
              v-model="formData.supplier_address"
              class="form-control border-2 modern-input"
              rows="3"
              placeholder="Nhập địa chỉ..."
            ></textarea>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button
            class="btn btn-light px-4 border shadow-sm fw-bold"
            @click="showModal = false"
          >
            HỦY
          </button>
          <button class="btn btn-brown px-4 shadow fw-bold" @click="handleSave">
            LƯU LẠI
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import supplierService from "@/services/supplier.service";
import Swal from "sweetalert2";

export default {
  data() {
    return {
      showModal: false,
      isEdit: false,
      searchQuery: "",
      statusFilter: "all", // all, active, inactive
      suppliers: [],
      formData: {
        _id: null,
        supplier_name: "",
        supplier_phone: "",
        supplier_address: "",
      },
    };
  },
  computed: {
    filteredSuppliers() {
      if (!Array.isArray(this.suppliers)) return [];
      let result = this.suppliers;

      // 1. Search filter
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.supplier_name.toLowerCase().includes(query) ||
          s.supplier_phone.includes(query),
      );

      // 2. Status filter
      if (this.statusFilter === "active") {
        result = result.filter((s) => s.is_collaborating === true);
      } else if (this.statusFilter === "inactive") {
        result = result.filter((s) => s.is_collaborating === false);
      }

      return result;
    },
  },
  methods: {
    async fetchSuppliers() {
      try {
        const res = await supplierService.getAllSupplier();
        this.suppliers = res.suppliers || [];
      } catch (err) {
        console.error(err);
      }
    },
    async toggleStatus(sup) {
      const actionText = sup.is_collaborating ? "Ngừng hợp tác" : "Tái hợp tác";
      const result = await Swal.fire({
        title: "Thông báo",
        text: `Xác nhận ${actionText.toLowerCase()} với ${sup.supplier_name}`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: sup.is_collaborating ? "#ef4444" : "#198754",
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        try {
          await supplierService.updateCollaborateStatus(sup._id);
          Swal.fire("Thành công", `Đã ${actionText}!`, "success");
          this.fetchSuppliers();
        } catch (err) {
          Swal.fire("Lỗi", "Không thể cập nhật trạng thái!", "error");
        }
      }
    },
    openAddModal() {
      this.isEdit = false;
      this.formData = {
        supplier_name: "",
        supplier_phone: "",
        supplier_address: "",
      };
      this.showModal = true;
    },
    openEditModal(sup) {
      this.isEdit = true;
      this.formData = { ...sup };
      this.showModal = true;
    },
    async handleSave() {
      if (
        !this.formData.supplier_name ||
        !this.formData.supplier_phone ||
        !this.formData.supplier_address
      ) {
        return Swal.fire("Thông báo", "Vui lòng nhập đủ thông tin!", "warning");
      }
      try {
        if (this.isEdit) {
          await supplierService.updateSupplier(
            this.formData._id,
            this.formData,
          );
          Swal.fire("Thành công", "Đã cập nhật đối tác!", "success");
        } else {
          await supplierService.createSupplier(this.formData);
          Swal.fire("Thành công", "Đã thêm nhà cung cấp mới!", "success");
        }
        this.showModal = false;
        this.fetchSuppliers();
      } catch (err) {
        Swal.fire("Lỗi", "Không lưu được dữ liệu!", "error");
      }
    },
  },
  mounted() {
    this.fetchSuppliers();
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
}
.btn-white {
  background: #fff;
  border: 1px solid #eee;
}
.badge-active {
  background-color: #d1e7dd;
  color: #0f5132;
  border: 1px solid #badbcc;
}
.badge-inactive {
  background-color: #f8d7da;
  color: #842029;
  border: 1px solid #f5c2c7;
}
.search-input:focus,
.modern-input:focus {
  border-color: #533422;
  box-shadow: 0 0 0 0.25rem rgba(83, 52, 34, 0.1);
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
  width: 100%;
  max-width: 480px;
}
</style>
