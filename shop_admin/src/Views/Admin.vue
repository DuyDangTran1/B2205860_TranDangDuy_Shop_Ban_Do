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
              <router-link to="/dashboard" class="nav-link rounded-3">
                <i class="fas fa-chart-line me-2"></i> Tổng quan
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/staff" class="nav-link rounded-3">
                <i class="fas fa-users me-2"></i> Quản lý nhân viên
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/products" class="nav-link rounded-3">
                <i class="fas fa-box me-2"></i> Quản lý sản phẩm
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/orders" class="nav-link rounded-3">
                <i class="fas fa-shopping-cart me-2"></i> Quản lý đơn hàng
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/warehouse" class="nav-link rounded-3">
                <i class="fas fa-warehouse"></i> Quản lý kho
              </router-link>
            </li>
            <li class="nav-item">
              <router-link to="/users" class="nav-link rounded-3">
                <i class="fas fa-user-cog"></i> Quản lý người dùng
              </router-link>
            </li>
            <li class="nav-item">
              <router-link
                to="/admin-chat"
                class="nav-link rounded-3 position-relative"
              >
                <i class="fas fa-comments me-2"></i> Tư vấn khách
              </router-link>
            </li>
          </ul>
        </div>
      </nav>

      <main class="col-md-9 ms-sm-auto col-lg-10 px-0 bg-light">
        <header
          class="d-flex justify-content-between align-items-center py-2 px-4 bg-white border-bottom shadow-sm"
        >
          <h5 class="fw-bold m-0">Bảng điều khiển</h5>

          <div class="dropdown">
            <div
              class="d-flex align-items-center gap-2 cursor-pointer"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="text-end d-none d-sm-block">
                <div class="fw-bold small">Admin Duy</div>
                <div class="text-muted" style="font-size: 11px">
                  Quản trị viên
                </div>
              </div>
              <div
                class="avatar-header bg-brown fw-bold d-flex align-items-center justify-content-center rounded-circle shadow-sm"
              >
                D
              </div>
            </div>
            <ul
              class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3"
            >
              <li>
                <a class="dropdown-item py-2" href="#"
                  ><i class="fas fa-user-circle me-2"></i>Hồ sơ</a
                >
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button @click="" class="dropdown-item py-2 text-danger">
                  <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                </button>
              </li>
            </ul>
          </div>
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
  font-size: 16px;
}
.cursor-pointer {
  cursor: pointer;
}
.nav-link {
  color: #555;
  padding: 12px 15px;
  margin-bottom: 2px;
}
.router-link-active {
  background-color: #533422 !important;
  color: #fff !important;
}
.text-brown {
  color: #533422;
}
</style>
