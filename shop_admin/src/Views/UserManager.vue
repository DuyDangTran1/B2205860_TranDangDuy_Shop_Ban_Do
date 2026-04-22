<script>
import Loading from "@/components/Loading.vue";
import userService from "@/services/user.service";
import Swal from "sweetalert2";

export default {
  components: { Loading },
  data() {
    return {
      loading: true,
      users: [],
      searchQuery: "",
      filterAuthType: "",
      filterRank: "", // Lọc theo hạng
      showDetailModal: false,
      selectedUser: null,
    };
  },
  computed: {
    filteredUsers() {
      if (!this.users || !Array.isArray(this.users)) return [];

      return this.users.filter((u) => {
        // 1. Tìm kiếm (Tìm theo Tên, Email, SĐT nhưng ở ngoài bảng không hiện SĐT)
        const query = this.searchQuery.toLowerCase().trim();
        const matchSearch =
          (u.name?.toLowerCase() || "").includes(query) ||
          (u.email?.toLowerCase() || "").includes(query) ||
          (u.phone || "").includes(query);

        // 2. Lọc loại tài khoản
        const authType = u.password ? "normal" : "google";
        const matchAuth =
          this.filterAuthType === "" || authType === this.filterAuthType;

        // 3. Lọc theo Rank (Duy nhớ chuẩn hóa chữ thường ở Backend hoặc dùng toLowerCase)
        const matchRank =
          this.filterRank === "" ||
          u.rank?.toLowerCase() === this.filterRank.toLowerCase();

        return matchSearch && matchAuth && matchRank;
      });
    },
  },

  methods: {
    async loadUsers() {
      this.loading = true;
      try {
        const data = await userService.getAllUser();
        this.users = data.users || [];
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        this.loading = false;
      }
    },

    async toggleBlock(user) {
      const action = user.block ? "mở khóa" : "khóa";
      const result = await Swal.fire({
        title: `Xác nhận ${action}?`,
        text: `Duy có chắc muốn ${action} tài khoản này?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: user.block ? "#198754" : "#dc3545",
        confirmButtonText: `Đồng ý ${action}`,
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        try {
          await userService.updateStatusAccount(user._id);
          user.block = !user.block;
          Swal.fire("Thành công!", `Đã ${action} tài khoản.`, "success");
        } catch (error) {
          Swal.fire("Lỗi", "Không thể cập nhật!", "error");
        }
      }
    },

    viewDetail(user) {
      this.selectedUser = { ...user };
      this.showDetailModal = true;
    },
    closeDetailModal() {
      this.showDetailModal = false;
      this.selectedUser = null;
    },
    // Hàm lấy màu cho Rank nhìn cho sang Duy nè
    getRankClass(rank) {
      const r = rank?.toLowerCase();
      if (r === "kim cương") return "badge-diamond";
      if (r === "vàng") return "badge-gold";
      if (r === "bạc") return "badge-silver";
      return "badge-bronze";
    },
  },
  mounted() {
    this.loadUsers();
  },
};
</script>
<template>
  <div class="user-manager p-4">
    <Loading :isLoading="loading" message="Đang tải danh sách người dùng..." />

    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold text-brown m-0 text-uppercase tracking-wider">
        <i class="fas fa-user-shield me-2"></i>Quản lý khách hàng
      </h3>
      <div class="text-muted small fw-bold">
        Tổng cộng: {{ filteredUsers.length }} người dùng
      </div>
    </div>

    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white border">
      <div class="row g-3 align-items-center">
        <div class="col-md-4">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <i class="fas fa-search text-muted"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control border-start-0 ps-0 shadow-none"
              placeholder="Tìm tên, email hoặc số điện thoại..."
            />
          </div>
        </div>
        <div class="col-md-3">
          <select v-model="filterAuthType" class="form-select shadow-none">
            <option value="">Tất cả loại tài khoản</option>
            <option value="normal">Đăng ký hệ thống</option>
            <option value="google">Đăng nhập Google</option>
          </select>
        </div>
        <div class="col-md-3">
          <select v-model="filterRank" class="form-select shadow-none">
            <option value="">Tất cả thứ hạng</option>
            <option value="Đồng">Hạng Đồng</option>
            <option value="Bạc">Hạng Bạc</option>
            <option value="Vàng">Hạng Vàng</option>
            <option value="Kim cương">Hạng Kim Cương</option>
          </select>
        </div>
        <div class="col-md-auto ms-auto">
          <button
            @click="loadUsers"
            class="btn btn-light rounded-circle border shadow-sm"
          >
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="!loading"
      class="card border-0 shadow-sm rounded-4 overflow-hidden border"
    >
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th class="ps-4 py-3">Khách hàng</th>
              <th>Email và Số điện thoại</th>
              <th>Hạng</th>
              <th>Loại tài khoản</th>
              <th>Trạng thái</th>
              <th class="text-end pe-4">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user._id">
              <td class="ps-4">
                <div class="d-flex align-items-center">
                  <div
                    class="avatar-sm me-3 bg-brown-light text-brown fw-bold d-flex align-items-center justify-content-center rounded-circle"
                  >
                    {{ (user.name || user.email).charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="fw-bold text-dark">
                      {{ user.name || "Chưa cập nhật" }}
                    </div>
                    <small class="text-muted text-uppercase"
                      >ID: {{ user._id.slice(-6) }}</small
                    >
                  </div>
                </div>
              </td>

              <td>
                <div>
                  <i class="fas fa-phone-alt me-2 small text-muted"></i
                  >{{ user.phone || "N/A" }}
                </div>
                <div class="small text-muted">
                  <i class="fas fa-envelope me-2 small"></i>{{ user.email }}
                </div>
              </td>

              <td>
                <span :class="['badge-rank', getRankClass(user.rank)]">
                  {{ user.rank || "Đồng" }}
                </span>
              </td>

              <td>
                <span
                  v-if="!user.password"
                  class="badge bg-danger-subtle text-danger px-2 py-1"
                  style="font-size: 0.7rem"
                >
                  GOOGLE
                </span>
                <span
                  v-else
                  class="badge bg-primary-subtle text-primary px-2 py-1"
                  style="font-size: 0.7rem"
                >
                  HỆ THỐNG
                </span>
              </td>

              <td>
                <span
                  v-if="!user.block"
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
                    @click="viewDetail(user)"
                    title="Xem chi tiết"
                  >
                    <i class="fas fa-eye"></i>
                  </button>

                  <button
                    v-if="!user.block"
                    class="btn btn-sm btn-outline-danger"
                    @click="toggleBlock(user)"
                    title="Khóa tài khoản"
                  >
                    <i class="fas fa-user-slash"></i>
                  </button>
                  <button
                    v-else
                    class="btn btn-sm btn-outline-success"
                    @click="toggleBlock(user)"
                    title="Mở khóa tài khoản"
                  >
                    <i class="fas fa-user-check"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="text-center py-5 text-muted">
                Không tìm thấy khách hàng nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="closeDetailModal"
    >
      <div
        class="modal-content-custom shadow-2xl animate__animated animate__zoomIn animate__faster"
      >
        <div class="modal-header-fancy bg-brown text-center">
          <button
            class="btn-close btn-close-white position-absolute end-0 top-0 m-3 shadow-none"
            @click="closeDetailModal"
          ></button>
          <div class="avatar-profile-container mx-auto mb-3">
            <img
              v-if="selectedUser.url_avatar"
              :src="selectedUser.url_avatar"
              class="avatar-profile"
            />
            <div
              v-else
              class="avatar-profile bg-white text-brown display-5 fw-bold d-flex align-items-center justify-content-center"
            >
              {{ (selectedUser.name || "U").charAt(0).toUpperCase() }}
            </div>
          </div>
          <h3 class="text-white fw-bold mb-1">
            {{ selectedUser.name || "Khách hàng" }}
          </h3>
          <span
            class="rank_user"
            :class="['badge-rank-modal', getRankClass(selectedUser.rank)]"
          >
            Hạng {{ selectedUser.rank || "Đồng" }}
          </span>
        </div>
        <div class="modal-body p-4 bg-white">
          <div class="row g-3">
            <div class="col-md-6 info-item-box">
              <label>Email</label>
              <div>{{ selectedUser.email }}</div>
            </div>
            <div class="col-md-6 info-item-box">
              <label>Số điện thoại</label>
              <div>{{ selectedUser.phone || "Chưa cập nhật" }}</div>
            </div>
            <div class="col-md-6 info-item-box">
              <label>Ngày sinh</label>
              <div>
                {{
                  selectedUser.birthday
                    ? new Date(selectedUser.birthday).toLocaleDateString(
                        "vi-VN",
                      )
                    : "Chưa cập nhật"
                }}
              </div>
            </div>
            <div class="col-md-6 info-item-box">
              <label>Địa chỉ</label>
              <div>{{ selectedUser.address || "Chưa cập nhật" }}</div>
            </div>
            <div
              class="col-12 violation-box mt-2"
              :class="{ 'has-violation': selectedUser.count_violate > 0 }"
            >
              <div class="d-flex justify-content-between">
                <span
                  ><i class="fas fa-exclamation-triangle me-2"></i>Số lần vi
                  phạm</span
                >
                <span class="fw-bold">{{
                  selectedUser.count_violate || 0
                }}</span>
              </div>
            </div>
          </div>
          <button
            class="btn btn-brown w-100 mt-4 py-2 fw-bold"
            @click="closeDetailModal"
          >
            ĐÓNG HỒ SƠ
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
.bg-brown {
  background-color: #533422;
}
.bg-brown-light {
  background-color: #f1edea;
}

.avatar-sm {
  width: 40px;
  height: 40px;
  font-size: 16px;
}

.badge-rank {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
  text-transform: uppercase;
}
.badge-bronze {
  background: #fdf2f2;
  color: #ac7657;
  border: 1px solid #ecd9ce;
}
.badge-silver {
  background: #f8f9fa;
  color: #718096;
  border: 1px solid #e2e8f0;
}
.badge-gold {
  background: #fffaf0;
  color: #b7791f;
  border: 1px solid #fbd38d;
}
.badge-diamond {
  background: #ebf8ff;
  color: #2b6cb0;
  border: 1px solid #bee3f8;
}

.badge-rank-modal {
  padding: 4px 15px;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: bold;
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: inline-block;
  color: white;
}

.badge {
  padding: 0.5em 0.8em;
  border-radius: 6px;
}

.rank_user {
  color: #533422 !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content-custom {
  width: 90%;
  max-width: 480px;
  border-radius: 20px;
  overflow: hidden;
}
.avatar-profile-container {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}
.avatar-profile {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-item-box {
  background: #fdfaf8;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #f1edea;
}
.info-item-box label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  color: #ac7657;
  text-transform: uppercase;
}
.info-item-box div {
  font-weight: 600;
  color: #333;
  font-size: 0.85rem;
}

.violation-box {
  padding: 12px;
  border-radius: 10px;
  background: #f8f9fa;
  font-size: 0.9rem;
}
.violation-box.has-violation {
  background: #fff5f5;
  color: #c53030;
  border: 1px solid #feb2b2;
}

.table thead th {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: #6c757d;
  border-bottom: none;
}
</style>
