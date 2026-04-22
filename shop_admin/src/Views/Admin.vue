<script>
import employeeService from "@/services/employee.service";
export default {
  data() {
    return {
      adminName: sessionStorage.getItem("name") || "Admin",
      adminRole: sessionStorage.getItem("role") || "Quản trị viên",
    };
  },
  computed: {
    adminAvatar() {
      const avatar = sessionStorage.getItem("avatar");
      return avatar && avatar !== "undefined" && avatar !== "null"
        ? avatar
        : null;
    },
    firstChar() {
      return this.adminName ? this.adminName.charAt(0).toUpperCase() : "A";
    },
  },

  methods: {
    async logout() {
      try {
        await employeeService.logOut();
      } catch (error) {
        console.log(error);
      } finally {
        sessionStorage.clear();
        this.$router.push({ name: "Login" });
      }
    },
  },
};
</script>

<template>
  <div class="container-fluid">
    <div class="row">
      <nav
        class="col-md-3 col-lg-2 d-md-block sidebar shadow-sm min-vh-100 p-0 bg-white"
      >
        <div class="position-sticky pt-3">
          <h5 class="text-center fw-bold py-4 text-brown">SHOPDD ADMIN</h5>
          <ul class="nav flex-column gap-1 px-2">
            <li class="nav-item">
              <router-link
                :to="{ name: 'Dashboard' }"
                class="nav-link rounded-3"
              >
                <i class="fas fa-chart-line me-2"></i> Tổng quan
              </router-link>
            </li>
            <li v-if="adminRole === 'Quản trị viên'" class="nav-item">
              <router-link :to="{ name: 'Staff' }" class="nav-link rounded-3">
                <i class="fas fa-users me-2"></i> Quản lý nhân viên
              </router-link>
            </li>
            <li class="nav-item">
              <a
                class="nav-link rounded-3 d-flex justify-content-between align-items-center"
                data-bs-toggle="collapse"
                href="#productSubmenu"
                role="button"
                aria-expanded="false"
              >
                <span><i class="fas fa-box me-2"></i> Danh mục sản phẩm</span>
                <i class="fas fa-chevron-down small"></i>
              </a>

              <div class="collapse px-3" id="productSubmenu">
                <ul class="nav flex-column gap-1 mt-1 border-start ms-3 ps-2">
                  <li class="nav-item">
                    <router-link
                      :to="{ name: 'Products' }"
                      class="nav-link py-2 small"
                    >
                      Sản phẩm
                    </router-link>
                  </li>
                  <li class="nav-item">
                    <router-link
                      :to="{ name: 'Category' }"
                      class="nav-link py-2 small"
                    >
                      Thể loại
                    </router-link>
                  </li>
                  <li class="nav-item">
                    <router-link
                      :to="{ name: 'Suppliers' }"
                      class="nav-link py-2 small"
                    >
                      Nhà cung cấp
                    </router-link>
                  </li>
                  <li class="nav-item">
                    <router-link
                      :to="{ name: 'Collection' }"
                      class="nav-link py-2 small"
                    >
                      Bộ sưu tập
                    </router-link>
                  </li>
                  <li v-if="adminRole === 'Quản trị viên'" class="nav-item">
                    <router-link
                      :to="{ name: 'Voucher' }"
                      class="nav-link py-2 small"
                    >
                      Mã khuyến mãi
                    </router-link>
                  </li>
                </ul>
              </div>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'Order' }" class="nav-link rounded-3">
                <i class="fas fa-shopping-cart me-2"></i> Quản lý đơn hàng
              </router-link>
            </li>
            <li class="nav-item">
              <router-link
                :to="{ name: 'WareHouse' }"
                class="nav-link rounded-3"
              >
                <i class="fas fa-warehouse"></i> Quản lý kho
              </router-link>
            </li>
            <li v-if="adminRole === 'Quản trị viên'" class="nav-item">
              <router-link :to="{ name: 'Users' }" class="nav-link rounded-3">
                <i class="fas fa-user-cog"></i> Quản lý người dùng
              </router-link>
            </li>

            <li v-if="adminRole === 'Quản trị viên'" class="nav-item">
              <router-link
                :to="{ name: 'Statistical' }"
                class="nav-link rounded-3"
              >
                <i class="fas fa-shopping-cart me-2"></i> Thống kê
              </router-link>
            </li>

            <li class="nav-item">
              <router-link
                :to="{ name: 'Consult' }"
                class="nav-link rounded-3 position-relative"
              >
                <i class="fas fa-comments me-2"></i> Tư vấn khách
              </router-link>
            </li>

            <li v-if="adminRole === 'Quản trị viên'" class="nav-item">
              <router-link :to="{ name: 'Review' }" class="nav-link rounded-3">
                <i class="fas fa-user-cog"></i> Quản lý các bài đánh giá
              </router-link>
            </li>
            <li>
              <button
                @click="logout()"
                class="dropdown-item py-2 ps-3 text-danger"
              >
                <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
              </button>
            </li>
          </ul>
        </div>
      </nav>
      <main class="col-md-9 ms-sm-auto col-lg-10 px-0 bg-light">
        <header
          class="d-flex justify-content-between align-items-center py-2 px-4 bg-white border-bottom shadow-sm"
        >
          <h5 class="fw-bold m-0">Bảng điều khiển</h5>

          <router-link
            :to="{ name: 'Profile' }"
            class="d-flex align-items-center gap-2 cursor-pointer text-decoration-none text-dark profile-header"
          >
            <div class="text-end d-none d-sm-block">
              <div class="fw-bold small">{{ adminName }}</div>
              <div class="text-muted" style="font-size: 11px">
                {{ adminRole }}
              </div>
            </div>

            <div
              class="avatar-header bg-brown fw-bold d-flex align-items-center justify-content-center rounded-circle shadow-sm text-white"
            >
              <img
                v-if="adminAvatar && adminAvatar !== ''"
                :src="`http://localhost:3000/${adminAvatar}`"
                class="rounded-circle w-100 h-100"
                style="object-fit: cover"
                @error="adminAvatar = null"
              />
              <span class="text-brown" v-else>{{ firstChar }}</span>
            </div>
          </router-link>
        </header>

        <div class="p-4">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.avatar-header {
  width: 40px;
  height: 40px;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-header img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cursor-pointer {
  cursor: pointer;
}
.nav-link {
  color: #555;
  padding: 12px 15px;
  margin-bottom: 2px;
}
.text-brown {
  color: #533422;
}
.router-link-active {
  background-color: #533422 !important;
  color: white !important;
}

.router-link-active i {
  color: white !important;
}
</style>
