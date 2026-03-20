<script>
import Loading from "@/components/Loading.vue";
import employeeService from "@/services/employee.service";

export default {
  components: {
    Loading,
  },
  data() {
    return {
      loading: true,
      issubmitting: false,
      showAddModal: false,
      staffs: [],
      searchQuery: "",
      filterRole: "",
      newStaff: {
        name: "",
        email: "",
        phone: "",
        role: "Nhân viên",
        password: "",
      },
      showDetailModal: false,
      selectedStaff: null,
    };
  },
  computed: {
    // Logic tìm kiếm và lọc nhân viên
    filteredStaffs() {
      // Nếu không có danh sách thì trả về mảng rỗng
      if (!this.staffs || !Array.isArray(this.staffs)) return [];

      return this.staffs.filter((s) => {
        // 1. Lọc theo Search (Tên, Email, SĐT)
        const query = this.searchQuery.toLowerCase().trim();
        const matchSearch =
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.phone.includes(query);

        // 2. Lọc theo Role
        // Nếu filterRole trống thì lấy tất cả, ngược lại so sánh khớp hoàn toàn
        const matchRole = this.filterRole === "" || s.role === this.filterRole;

        return matchSearch && matchRole;
      });
    },
  },

  methods: {
    // 1. Lấy danh sách nhân viên từ Backend
    async loadStaffs() {
      try {
        const data = await employeeService.getListEmployee();
        this.staffs = data.list || [];
        console.log(this.staffs);
      } catch (error) {
        console.error("Lỗi lấy danh sách:", error);
      } finally {
        this.loading = false;
      }
    },

    // 2. Mở/Đóng Modal
    closeModal() {
      this.showAddModal = false;
      this.newStaff = {
        name: "",
        email: "",
        phone: "",
        role: "Nhân viên",
        password: "",
      };
    },

    validateData() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;

      if (this.newStaff.name.trim().length < 2) {
        alert("Tên nhân viên quá ngắn!");
        return false;
      }

      if (!emailRegex.test(this.newStaff.email)) {
        alert("Email không đúng định dạng (ví dụ: abc@gmail.com)!");
        return false;
      }

      if (!phoneRegex.test(this.newStaff.phone)) {
        alert(
          "Số điện thoại không hợp lệ (phải có 10 số và bắt đầu bằng 03, 05, 07, 08, 09)!",
        );
        return false;
      }

      if (this.newStaff.password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return false;
      }

      return true;
    },

    async handleAddEmployee() {
      // Gọi hàm check trước khi chạy
      if (!this.validateData()) return;

      this.issubmitting = true;
      try {
        console.log(this.newStaff);
        await employeeService.create(this.newStaff);
        alert("Thêm nhân viên mới thành công!");
        this.closeModal();
        await this.loadStaffs();
      } catch (error) {
        console.log("Lỗi gửi từ Server:", error.response);
        // Nếu Backend trả về lỗi (ví dụ email đã tồn tại)
        alert(error || "Đã có lỗi xảy ra khi thêm");
      } finally {
        this.issubmitting = false;
      }
    },

    // 4. Khóa/Mở khóa tài khoản
    async toggleBlock(staff) {
      const action = staff.block ? "mở khóa" : "khóa";
      if (confirm(`Bạn có chắc chắn muốn ${action} nhân viên ${staff.name}?`)) {
        try {
          // Gọi API thật
          const result = await employeeService.updateStatusAccount(staff._id);

          // Cập nhật lại giá trị block từ server trả về
          staff.block = result.block;

          alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} thành công!`,
          );
        } catch (error) {
          console.error(error);
          alert("Không thể cập nhật trạng thái");
        }
      }
    },

    // 5. Xem chi tiết
    viewDetail(staff) {
      this.selectedStaff = { ...staff }; // Copy dữ liệu để tránh bị lỗi tham chiếu
      this.showDetailModal = true;
    },
    closeDetailModal() {
      this.showDetailModal = false;
      this.selectedStaff = null;
    },
  },
  mounted() {
    this.loadStaffs();
  },
};
</script>

<template>
  <div class="staff-manager">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold text-brown m-0">
        <i class="fas fa-users-cog me-2"></i>Quản lý nhân viên
      </h3>
      <button
        class="btn btn-brown px-4 py-2 shadow-sm"
        @click="showAddModal = true"
      >
        <i class="fas fa-plus-circle me-2"></i>Thêm nhân viên mới
      </button>
    </div>

    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="row g-3 align-items-center">
        <div class="col-md-6">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <i class="fas fa-search text-muted"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control border-start-0 ps-0"
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
            />
          </div>
        </div>
      </div>
    </div>

    <Loading :isLoading="loading" message="Đang tải danh sách nhân viên..." />

    <div
      v-if="!loading"
      class="card border-0 shadow-sm rounded-4 overflow-hidden"
    >
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th class="ps-4">Nhân viên</th>
              <th>Liên hệ</th>
              <th>Chức vụ</th>
              <th>Trạng thái</th>
              <th class="text-end pe-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in filteredStaffs" :key="staff._id">
              <td class="ps-4">
                <div class="d-flex align-items-center">
                  <div
                    class="avatar-sm me-3 bg-brown-light text-brown fw-bold d-flex align-items-center justify-content-center rounded-circle"
                  >
                    {{ staff.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="fw-bold text-dark">{{ staff.name }}</div>
                    <small class="text-muted"
                      >ID: {{ staff._id.slice(-6) }}</small
                    >
                  </div>
                </div>
              </td>
              <td>
                <div>
                  <i class="fas fa-envelope me-2 small text-muted"></i
                  >{{ staff.email }}
                </div>
                <div>
                  <i class="fas fa-phone me-2 small text-muted"></i
                  >{{ staff.phone }}
                </div>
              </td>
              <td>
                <span
                  :class="
                    staff.role === 'admin'
                      ? 'badge bg-danger-subtle text-danger'
                      : 'badge bg-primary-subtle text-primary'
                  "
                >
                  {{ staff.role.toUpperCase() }}
                </span>
              </td>
              <td>
                <span
                  v-if="!staff.block"
                  class="badge bg-success-subtle text-success"
                >
                  <i class="fas fa-check-circle me-1"></i>Đang hoạt động
                </span>
                <span v-else class="badge bg-secondary-subtle text-secondary">
                  <i class="fas fa-lock me-1"></i>Đã khóa
                </span>
              </td>
              <td class="text-end pe-4">
                <div class="btn-group">
                  <button
                    class="btn btn-sm btn-outline-primary me-2"
                    @click="viewDetail(staff)"
                    title="Xem chi tiết"
                  >
                    <i class="fas fa-eye"></i>
                  </button>

                  <button
                    v-if="!staff.block"
                    class="btn btn-sm btn-outline-danger"
                    @click="toggleBlock(staff)"
                    title="Khóa tài khoản"
                  >
                    <i class="fas fa-user-slash"></i>
                  </button>
                  <button
                    v-else
                    class="btn btn-sm btn-outline-success"
                    @click="toggleBlock(staff)"
                    title="Mở khóa tài khoản"
                  >
                    <i class="fas fa-user-check"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredStaffs.length === 0">
              <td colspan="5" class="text-center py-5 text-muted">
                Hiện không có nhân viên nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div v-if="showAddModal" class="modal-overlay">
    <div class="modal-content shadow-lg rounded-4 p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="fw-bold m-0 text-brown">Thêm nhân viên mới</h4>
        <button class="btn-close" @click="closeModal"></button>
      </div>

      <form @submit.prevent="handleAddEmployee">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label fw-bold">Họ và tên</label>
            <input
              v-model="newStaff.name"
              type="text"
              class="form-control"
              placeholder="Nhập tên..."
              required
            />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Email</label>
            <input
              v-model="newStaff.email"
              type="email"
              class="form-control"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Số điện thoại</label>
            <input
              v-model="newStaff.phone"
              type="text"
              class="form-control"
              placeholder="0912345678"
              required
            />
          </div>
          <div class="col-md-6">
            <label class="form-label fw-bold">Chức vụ</label>
            <select v-model="newStaff.role" class="form-select">
              <option value="Nhân viên">Nhân viên</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label fw-bold">Mật khẩu mặc định</label>
            <input
              v-model="newStaff.password"
              type="password"
              class="form-control"
              placeholder="Nhập mật khẩu..."
              required
            />
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button
            type="button"
            class="btn btn-secondary px-4"
            @click="closeModal"
          >
            Hủy
          </button>
          <button
            type="submit"
            class="btn btn-brown px-4"
            :disabled="issubmitting"
          >
            <span
              v-if="issubmitting"
              class="spinner-border spinner-border-sm me-2"
            ></span>
            Lưu nhân viên
          </button>
        </div>
      </form>
    </div>
  </div>
  <div v-if="showDetailModal" class="modal-overlay">
    <div
      class="modal-content shadow-lg rounded-4 p-0 border-0 overflow-hidden animate__animated animate__fadeInDown"
    >
      <div
        class="bg-brown-light p-4 d-flex justify-content-between align-items-center border-bottom"
      >
        <h4 class="fw-bold m-0 text-brown">Hồ sơ nhân viên</h4>
        <button class="btn-close" @click="closeDetailModal"></button>
      </div>

      <div class="p-4" v-if="selectedStaff">
        <div class="row align-items-center mb-4 pb-3 border-bottom">
          <div class="col-auto">
            <img
              v-if="selectedStaff.image_url"
              :src="selectedStaff.image_url"
              class="avatar-lg rounded-circle shadow-sm object-fit-cover border border-3 border-white"
            />
            <div
              v-else
              class="avatar-lg bg-brown text_avartar fw-bold d-flex align-items-center justify-content-center rounded-circle shadow-sm border border-2"
            >
              {{ selectedStaff.name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="col">
            <h3 class="fw-bold mb-1 text-dark">{{ selectedStaff.name }}</h3>
            <div class="d-flex gap-2">
              <span
                class="badge bg-primary-subtle text-primary text-uppercase px-3"
              >
                {{ selectedStaff.role }}
              </span>
              <span
                v-if="selectedStaff.block"
                class="badge bg-danger-subtle text-danger px-3"
              >
                <i class="fas fa-lock me-1"></i>TÀI KHOẢN ĐÃ KHÓA
              </span>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-6">
            <label class="small text-muted fw-bold text-uppercase mb-1"
              >Email liên hệ</label
            >
            <p
              class="mb-0 fw-semibold text-dark border-start border-3 border-brown ps-2"
            >
              {{ selectedStaff.email }}
            </p>
          </div>

          <div class="col-md-6">
            <label class="small text-muted fw-bold text-uppercase mb-1"
              >Số điện thoại</label
            >
            <p
              class="mb-0 fw-semibold text-dark border-start border-3 border-brown ps-2"
            >
              {{ selectedStaff.phone }}
            </p>
          </div>

          <div class="col-md-6">
            <label class="small text-muted fw-bold text-uppercase mb-1"
              >Ngày sinh</label
            >
            <p
              class="mb-0 fw-semibold text-dark border-start border-3 border-brown ps-2"
            >
              {{
                selectedStaff.birthday
                  ? new Date(selectedStaff.birthday).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"
              }}
            </p>
          </div>

          <div class="col-md-6">
            <label class="small text-muted fw-bold text-uppercase mb-1"
              >Địa chỉ</label
            >
            <p
              class="mb-0 fw-semibold text-dark border-start border-3 border-brown ps-2"
            >
              {{ selectedStaff.address || "Chưa cập nhật" }}
            </p>
          </div>

          <div class="col-md-12">
            <label class="small text-muted fw-bold text-uppercase mb-1"
              >Mã nhân viên (ID hệ thống)</label
            >
            <p
              class="mb-0 text-muted small font-monospace bg-light p-2 rounded"
            >
              {{ selectedStaff._id }}
            </p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-top d-flex justify-content-end gap-2">
          <button
            class="btn btn-outline-dark px-4 rounded-3 fw-bold"
            @click="closeDetailModal"
          >
            Đóng
          </button>
          <button
            :class="selectedStaff.block ? 'btn btn-success' : 'btn btn-danger'"
            class="px-4 rounded-3 fw-bold shadow-sm"
            @click="
              toggleBlock(selectedStaff);
              closeDetailModal();
            "
          >
            <i
              :class="
                selectedStaff.block ? 'fas fa-unlock' : 'fas fa-user-slash'
              "
              class="me-2"
            ></i>
            {{ selectedStaff.block ? "Mở khóa ngay" : "Khóa tài khoản" }}
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
}
.btn-brown:hover {
  background-color: #3d2619;
  color: white;
}
.bg-brown-light {
  background-color: #f1edea;
}
.avatar-sm {
  width: 40px;
  height: 40px;
  font-size: 16px;
}
.badge {
  padding: 0.5em 0.8em;
  border-radius: 6px;
}
.table thead th {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  border-bottom: none;
}
.table tbody tr {
  transition: all 0.2s;
}
.table tbody tr:hover {
  background-color: #fcfaf9 !important;
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
  width: 100%;
  max-width: 600px;
}
.btn-brown {
  background-color: #533422;
  color: white;
}
.btn-brown:hover {
  background-color: #3d2619;
  color: white;
}

.avatar-lg {
  width: 90px;
  height: 90px;
  font-size: 36px;
  object-fit: cover;
}

.border-brown {
  border-color: #533422 !important;
}

.modal-overlay {
  backdrop-filter: blur(4px);
}

.rounded-3 {
  border-radius: 0.75rem !important;
}
</style>
