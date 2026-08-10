<script>
import Loading from "@/components/Loading.vue";
import employeeService from "@/services/employee.service";
import { useUserStore } from "@/stores/user";
import Swal from "sweetalert2";

export default {
  components: {
    Loading,
  },

  setup() {
    const userStore = useUserStore();
    return { userStore };
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
        permissions: [],
      },
      showDetailModal: false,
      selectedStaff: null,
      showPermissionModal: false,

      singlePermissions: {},
      groupPermissions: {},

      selectedPermissions: [],
      currentSelectedCode: "",
      copiedPermissions: null,
      originalPermissions: [],
    };
  },
  computed: {
    filteredStaffs() {
      if (!this.staffs || !Array.isArray(this.staffs)) return [];

      return this.staffs.filter((s) => {
        const query = this.searchQuery.toLowerCase().trim();
        const matchSearch =
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.phone.includes(query);

        const matchRole = this.filterRole === "" || s.role === this.filterRole;

        return matchSearch && matchRole;
      });
    },
  },

  methods: {
    async loadStaffs() {
      try {
        const data = await employeeService.getListEmployee();
        this.staffs = data.list || [];
      } catch (error) {
        console.error("Lỗi lấy danh sách:", error);
      } finally {
        this.loading = false;
      }
    },

    async fetchPermissions() {
      if (Object.keys(this.singlePermissions).length === 0) {
        try {
          const response = await employeeService.getPermissionsList();
          this.singlePermissions = response.singlePermissions || {};
          this.groupPermissions = response.groupPermissions || {};
        } catch (error) {
          console.error("Lỗi tải phân quyền:", error);
        }
      }
    },

    addPermissionToNewStaff() {
      if (
        this.currentSelectedCode &&
        !this.newStaff.permissions.includes(this.currentSelectedCode)
      ) {
        this.newStaff.permissions.push(this.currentSelectedCode);
      }
      this.currentSelectedCode = "";
    },

    removePermissionFromNewStaff(code) {
      this.newStaff.permissions = this.newStaff.permissions.filter(
        (p) => p !== code,
      );
    },

    async openAddModal() {
      try {
        await this.fetchPermissions();
        this.showAddModal = true;
      } catch (error) {
        console.error("Lỗi khi tải danh sách quyền:", error);
        Swal.fire(
          "Lỗi",
          "Không thể lấy danh sách quyền hạn từ hệ thống",
          "error",
        );
      }
    },

    closeModal() {
      this.showAddModal = false;
      this.newStaff = {
        name: "",
        email: "",
        phone: "",
        role: "Nhân viên",
        password: "",
        permissions: [],
      };
    },

    addPermission() {
      if (
        this.currentSelectedCode &&
        !this.selectedPermissions.includes(this.currentSelectedCode)
      ) {
        this.selectedPermissions.push(this.currentSelectedCode);
      }
      this.currentSelectedCode = "";
    },

    removePermission(code) {
      this.selectedPermissions = this.selectedPermissions.filter(
        (p) => p !== code,
      );
    },

    getPermissionName(code) {
      const foundGroup = Object.values(this.groupPermissions).find(
        (g) => g.code === code,
      );
      if (foundGroup) return foundGroup.name;

      const foundSingle = Object.values(this.singlePermissions).find(
        (p) => p.code === code,
      );
      return foundSingle ? foundSingle.name : code;
    },

    copyStaffPermissions(staff) {
      this.copiedPermissions = staff.permissions ? [...staff.permissions] : [];

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });

      Toast.fire({
        icon: "success",
        title: `Sao chép quyền của ${staff.name} thành công!`,
      });
    },

    pastePermissions() {
      if (this.copiedPermissions) {
        this.selectedPermissions = [...this.copiedPermissions];

        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
        });
        Toast.fire({
          icon: "info",
          title: "Đã dán dữ liệu sao chép vào ô chọn",
        });
      }
    },

    cancelPermissionModal() {
      this.selectedPermissions = [...this.originalPermissions];
      this.showPermissionModal = false;
    },

    async openPermissionModal(staff) {
      this.selectedStaff = { ...staff };
      try {
        await this.fetchPermissions();

        this.originalPermissions = staff.permissions
          ? [...staff.permissions]
          : [];

        this.selectedPermissions = staff.permissions
          ? [...staff.permissions]
          : [];
        this.showPermissionModal = true;
      } catch (error) {
        Swal.fire("Lỗi", "Không thể tải danh sách quyền", "error");
      }
    },

    async handleGrantPermissions() {
      this.issubmitting = true;
      try {
        await employeeService.grantPermissions(this.selectedStaff._id, {
          permissions: this.selectedPermissions,
        });

        await Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã cập nhật quyền hạn mới!",
          timer: 1500,
          showConfirmButton: false,
        });

        this.showPermissionModal = false;
        await this.loadStaffs();
      } catch (error) {
        Swal.fire("Lỗi", "Cập nhật quyền thất bại", "error");
      } finally {
        this.issubmitting = false;
      }
    },

    validateData() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;

      if (this.newStaff.name.trim().length < 2) {
        Swal.fire({
          icon: "warning",
          title: "Tên quá ngắn",
          text: "Vui lòng nhập tên nhân viên!",
          confirmButtonColor: "#533422",
        });
        return false;
      }
      if (!emailRegex.test(this.newStaff.email)) {
        Swal.fire({
          icon: "warning",
          title: "Email sai định dạng",
          text: "Ví dụ: abc@gmail.com",
          confirmButtonColor: "#533422",
        });
        return false;
      }
      if (!phoneRegex.test(this.newStaff.phone)) {
        Swal.fire({
          icon: "warning",
          title: "SĐT không hợp lệ",
          text: "SĐT gồm 10 số, bắt đầu bằng 03,05,07,08,09",
          confirmButtonColor: "#533422",
        });
        return false;
      }
      if (this.newStaff.password.length < 6) {
        Swal.fire({
          icon: "warning",
          title: "Mật khẩu yếu",
          text: "Mật khẩu phải từ 6 ký tự trở lên",
          confirmButtonColor: "#533422",
        });
        return false;
      }
      return true;
    },

    async handleAddEmployee() {
      if (!this.validateData()) return;
      Swal.fire({
        title: "Đang tạo tài khoản...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      this.issubmitting = true;
      try {
        await employeeService.create(this.newStaff);
        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Đã thêm nhân viên mới.",
          confirmButtonColor: "#533422",
          timer: 2000,
          showConfirmButton: false,
        });
        this.closeModal();
        await this.loadStaffs();
      } catch (error) {
        Swal.fire({
          icon: "error",
          text:
            error.response?.data?.message ||
            "Email đã tồn tại hoặc có lỗi hệ thống.",
          confirmButtonColor: "#533422",
        });
      } finally {
        this.issubmitting = false;
      }
    },

    async toggleBlock(staff) {
      const action = staff.block ? "mở khóa" : "khóa";
      const result = await Swal.fire({
        text: `Bạn có chắc muốn ${action} tài khoản của ${staff.name} không?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: staff.block ? "#198754" : "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: staff.block ? "Mở khóa" : "Khóa ngay",
        cancelButtonText: "Hủy",
        reverseButtons: true,
      });
      if (result.isConfirmed) {
        try {
          const res = await employeeService.updateStatusAccount(staff._id);
          staff.block = res.block;
          Swal.fire({
            icon: "success",
            text: `Đã ${action} thành công.`,
            confirmButtonColor: "#533422",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            text: error.response?.data?.message || "Lỗi thay đổi trạng thái!",
            confirmButtonColor: "#533422",
          });
        }
      }
    },

    viewDetail(staff) {
      this.selectedStaff = { ...staff };
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
        v-if="userStore.hasPermission('EMPLOYEE_CREATE')"
        class="btn btn-brown px-4 py-2 shadow-sm"
        @click="openAddModal"
      >
        <i class="fas fa-plus-circle me-2"></i>Thêm nhân viên mới
      </button>
    </div>

    <!-- Thanh tìm kiếm -->
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

    <!-- Bảng danh sách -->
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
                    staff.role === 'Quản trị viên'
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
                    v-if="userStore.hasPermission('EMPLOYEE_GRANT')"
                    class="btn btn-sm btn-outline-warning me-2"
                    @click="openPermissionModal(staff)"
                    title="Phân quyền hạn"
                  >
                    <i class="fas fa-key"></i>
                  </button>

                  <!-- NÚT COPY QUYỀN HẠN  -->
                  <button
                    v-if="userStore.hasPermission('EMPLOYEE_GRANT')"
                    class="btn btn-sm btn-outline-info me-2"
                    @click="copyStaffPermissions(staff)"
                    title="Sao chép quyền"
                  >
                    <i class="fas fa-copy"></i>
                  </button>

                  <button
                    class="btn btn-sm btn-outline-primary me-2"
                    @click="viewDetail(staff)"
                    title="Xem chi tiết"
                  >
                    <i class="fas fa-eye"></i>
                  </button>
                  <template
                    v-if="userStore.hasPermission('EMPLOYEE_UPDATE_STATUS')"
                  >
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
                  </template>
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

  <!--THÊM NHÂN VIÊN MỚI -->
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

          <!-- PHẦN CHỌN PHÂN QUYỀN MỚI -->
          <div class="col-12 mt-3">
            <label class="form-label fw-bold text-black"
              >Cấp quyền hạn ban đầu</label
            >
            <div class="d-flex gap-2 mb-3">
              <select v-model="currentSelectedCode" class="form-select">
                <option value="" disabled>-- Chọn nhóm hoặc quyền lẻ --</option>
                <optgroup label="--- NHÓM CÁC QUYỀN ---">
                  <option
                    v-for="(group, key) in groupPermissions"
                    :key="'g-' + key"
                    :value="group.code"
                    :disabled="newStaff.permissions.includes(group.code)"
                  >
                    {{ group.name }}
                  </option>
                </optgroup>
                <optgroup label="--- QUYỀN CHI TIẾT ---">
                  <option
                    v-for="(perm, key) in singlePermissions"
                    :key="'s-' + key"
                    :value="perm.code"
                    :disabled="newStaff.permissions.includes(perm.code)"
                  >
                    {{ perm.name }}
                  </option>
                </optgroup>
              </select>
              <button
                type="button"
                class="btn btn-brown px-3"
                @click="addPermissionToNewStaff"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>

            <div
              class="p-2 border rounded bg-light d-flex flex-wrap gap-2"
              style="min-height: 80px"
            >
              <div
                v-if="newStaff.permissions.length === 0"
                class="small text-muted p-2"
              >
                Nhân viên sẽ chưa có quyền thực hiện các chức năng nếu không
                được chọn ở đây.
              </div>
              <span
                v-for="code in newStaff.permissions"
                :key="code"
                class="badge bg-white border text-dark d-flex align-items-center py-2 px-2 shadow-sm"
              >
                {{ getPermissionName(code) }}
                <button
                  type="button"
                  class="btn-close ms-2"
                  style="font-size: 0.5rem"
                  @click="removePermissionFromNewStaff(code)"
                ></button>
              </span>
            </div>
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
            ></span
            >Lưu nhân viên
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- XEM CHI TIẾT HỒ SƠ -->
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
            <div
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
                >{{ selectedStaff.role }}</span
              >
              <span
                v-if="selectedStaff.block"
                class="badge bg-danger-subtle text-danger px-3"
                ><i class="fas fa-lock me-1"></i>TÀI KHOẢN ĐÃ KHÓA</span
              >
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
            class="btn-outline-dark btn px-4 rounded-3 fw-bold"
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

  <!-- PHÂN LẠI QUYỀN HẠN CHO NHÂN VIÊN ĐANG CÓ -->
  <div v-if="showPermissionModal" class="modal-overlay">
    <div
      class="modal-content shadow-lg rounded-4 p-0 border-0 overflow-hidden"
      style="max-width: 650px"
    >
      <div
        class="bg-brown-light p-4 d-flex justify-content-between align-items-center border-bottom"
      >
        <h5 class="fw-bold m-0 text-brown">
          <i class="fas fa-shield-alt me-2"></i>Phân quyền:
          {{ selectedStaff.name }}
        </h5>

        <!-- Khi click nút X sẽ gọi hàm cancelPermissionModal để hoàn tác -->
        <button class="btn-close" @click="cancelPermissionModal"></button>
      </div>

      <div class="p-4">
        <!-- KHỐI NÚT DÁN QUYỀN HẠN -->
        <div
          v-if="copiedPermissions !== null"
          class="mb-4 p-3 border border-info rounded-3 bg-info-subtle d-flex justify-content-between align-items-center animate__animated animate__fadeIn"
        >
          <div class="small text-info-emphasis">
            <i class="fas fa-info-circle me-2"></i>
            Đang sao chép <strong>{{ copiedPermissions.length }}</strong> quyền.
          </div>
          <button
            type="button"
            class="btn btn-sm btn-info text-white fw-bold shadow-sm"
            @click="pastePermissions"
          >
            <i class="fas fa-paste me-1"></i> Dán quyền
          </button>
        </div>

        <div class="mb-4">
          <label class="form-label fw-bold small text-muted text-uppercase"
            >Chọn quyền hạn muốn cấp</label
          >
          <div class="d-flex gap-2">
            <select v-model="currentSelectedCode" class="form-select shadow-sm">
              <option value="" disabled>-- Chọn nhóm hoặc quyền lẻ --</option>
              <optgroup label="--- NHÓM CÁC QUYỀN ---">
                <option
                  v-for="(group, key) in groupPermissions"
                  :key="'modal-g-' + key"
                  :value="group.code"
                  :disabled="selectedPermissions.includes(group.code)"
                >
                  {{ group.name }}
                </option>
              </optgroup>
              <optgroup label="--- QUYỀN RIÊNG CHI TIẾT ---">
                <option
                  v-for="(perm, key) in singlePermissions"
                  :key="'modal-s-' + key"
                  :value="perm.code"
                  :disabled="selectedPermissions.includes(perm.code)"
                >
                  {{ perm.name }}
                </option>
              </optgroup>
            </select>
            <button
              class="btn btn-brown px-3"
              @click="addPermission"
              :disabled="!currentSelectedCode"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="mb-2">
          <label class="form-label fw-bold small text-muted text-uppercase"
            >Quyền hạn đã chọn ({{ selectedPermissions.length }})</label
          >
          <div
            class="permission-tags-container p-3 border rounded-3 bg-light d-flex flex-wrap gap-2"
            style="min-height: 120px; align-content: flex-start"
          >
            <div
              v-if="selectedPermissions.length === 0"
              class="w-100 text-center py-4 text-muted small"
            >
              Chưa có quyền nào được chọn. Hãy chọn từ danh sách phía trên.
            </div>
            <span
              v-for="code in selectedPermissions"
              :key="code"
              class="badge bg-white border text-dark shadow-sm d-flex align-items-center py-2 px-3 rounded-pill"
            >
              <i class="fas fa-check-circle text-success me-2"></i>
              {{ getPermissionName(code) }}
              <button
                type="button"
                class="btn-close ms-2"
                style="font-size: 0.6rem"
                @click="removePermission(code)"
              ></button>
            </span>
          </div>
        </div>
        <small class="text-muted"
          >Admin có thể nhấn dấu (x) để gỡ bỏ quyền.</small
        >
      </div>

      <div class="p-3 bg-white d-flex justify-content-end gap-2 border-top">
        <!-- THAY ĐỔI: Khi click nút Hủy sẽ gọi hàm cancelPermissionModal để hoàn tác -->
        <button
          class="btn btn-outline-secondary px-4 rounded-3"
          @click="cancelPermissionModal"
        >
          Hủy
        </button>
        <button
          class="btn btn-brown px-4 rounded-3 shadow-sm"
          @click="handleGrantPermissions"
          :disabled="issubmitting"
        >
          <span
            v-if="issubmitting"
            class="spinner-border spinner-border-sm me-2"
          ></span
          >Lưu thay đổi
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toàn bộ CSS giữ nguyên gốc của bạn */
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
  backdrop-filter: blur(4px);
}
.modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
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
.rounded-3 {
  border-radius: 0.75rem !important;
}
.permission-tags-container {
  max-height: 250px;
  overflow-y: auto;
}
.badge {
  transition: all 0.2s ease;
  font-weight: 500;
  border-color: #dee2e6 !important;
}
.badge:hover {
  border-color: #d33 !important;
  transform: translateY(-1px);
}
.form-select:focus {
  border-color: #533422;
  box-shadow: 0 0 0 0.25rem rgba(83, 52, 34, 0.25);
}
.permission-tags-container::-webkit-scrollbar {
  width: 5px;
}
.permission-tags-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 10px;
}
</style>
