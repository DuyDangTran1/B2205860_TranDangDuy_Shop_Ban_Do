<template>
  <div class="dashboard-content">
    <h2 class="fw-bold mb-4">Trang tổng quan</h2>

    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-primary-subtle text-primary p-3 rounded-3 me-3"
            >
              <i class="fas fa-shopping-bag fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold">Đơn hàng mới</p>
              <h2 class="fw-bold mb-0">125</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-success-subtle text-success p-3 rounded-3 me-3"
            >
              <i class="fas fa-users fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold">Nhân viên</p>
              <h2 class="fw-bold mb-0">12</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-warning-subtle text-warning p-3 rounded-3 me-3"
            >
              <i class="fas fa-box-open fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold">Sản phẩm</p>
              <h2 class="fw-bold mb-0">1,050</h2>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm rounded-4 p-4">
      <h5 class="fw-bold mb-4">
        <i class="fas fa-history me-2 text-brown"></i>Hoạt động gần đây
      </h5>
      <div class="list-group list-group-flush">
        <div class="list-group-item px-0 py-3 border-0 border-bottom">
          <span class="badge bg-info me-2">Hệ thống</span>
          Admin Duy vừa cập nhật trạng thái đơn hàng <strong>#DH-1024</strong>
        </div>
        <div class="list-group-item px-0 py-3 border-0 border-bottom">
          <span class="badge bg-success me-2">Sản phẩm</span>
          Thêm mới 5 sản phẩm vào kho hàng Nam.
        </div>
        <div class="list-group-item px-0 py-3 border-0">
          <span class="badge bg-warning me-2">Nhân viên</span>
          Nhân viên Tuấn vừa đăng nhập vào hệ thống.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Trang này chỉ lo hiển thị dữ liệu, không cần lo chuyển trang hay Sidebar nữa nhen ní
</script>

<style scoped>
.icon-box {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.text-brown {
  color: #533422;
}
.bg-primary-subtle {
  background-color: #e7f1ff;
}
.bg-success-subtle {
  background-color: #e1f7ec;
}
.bg-warning-subtle {
  background-color: #fff8e6;
}
</style>
