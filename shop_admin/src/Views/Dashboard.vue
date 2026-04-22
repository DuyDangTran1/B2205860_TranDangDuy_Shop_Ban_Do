<template>
  <Loading :isLoading="isLoading" />

  <div class="dashboard-content" v-if="!isLoading">
    <h2 class="fw-bold mb-4">Trang tổng quan</h2>

    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-primary-subtle text-primary p-3 rounded-3 me-3"
            >
              <i class="fas fa-shopping-bag fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold small">Đơn hàng mới</p>
              <h2 class="fw-bold mb-0">{{ stats.orders }}</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-success-subtle text-success p-3 rounded-3 me-3"
            >
              <i class="fas fa-users fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold small">Nhân viên</p>
              <h2 class="fw-bold mb-0">{{ stats.employees }}</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-warning-subtle text-warning p-3 rounded-3 me-3"
            >
              <i class="fas fa-box-open fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold small">Sản phẩm</p>
              <h2 class="fw-bold mb-0">{{ stats.products }}</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-4 bg-white rounded-4 h-100">
          <div class="d-flex align-items-center">
            <div
              class="icon-box bg-danger-subtle text-danger p-3 rounded-3 me-3"
            >
              <i class="fas fa-user-friends fs-3"></i>
            </div>
            <div>
              <p class="text-muted mb-0 fw-bold small">Người dùng</p>
              <h2 class="fw-bold mb-0">{{ stats.users }}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm rounded-4 p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h5 class="fw-bold m-0">
          <i class="fas fa-history me-2 text-brown"></i>Hoạt động gần đây
        </h5>
        <button
          @click="loadData"
          class="btn btn-sm btn-outline-secondary border-0"
        >
          <i class="fas fa-sync-alt"></i> Làm mới
        </button>
      </div>

      <div class="list-group list-group-flush">
        <div v-if="activities.length === 0" class="text-center py-4 text-muted">
          Chưa có hoạt động nào được ghi lại.
        </div>

        <div
          v-for="act in activities"
          :key="act._id"
          class="list-group-item px-0 py-3 border-0 border-bottom d-flex align-items-center justify-content-between"
        >
          <div>
            <span :class="['badge me-2', getBadgeColor(act.type)]">{{
              act.type
            }}</span>
            <span class="activity-content">{{ act.content }}</span>
          </div>
          <small class="text-muted ms-3 text-nowrap">
            {{ formatTime(act.created_at) }}
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DashboardService from "@/services/dashboard.service";
import ActivityService from "@/services/activity.service";
import Loading from "@/components/Loading.vue";

const stats = ref({ orders: 0, employees: 0, products: 0, users: 0 });
const activities = ref([]);
const isLoading = ref(true);

const getBadgeColor = (type) => {
  switch (type) {
    case "Hệ thống":
      return "bg-info";
    case "Đơn hàng":
      return "bg-primary";
    case "Sản phẩm":
      return "bg-success";
    case "Nhân viên":
      return "bg-warning text-dark";
    default:
      return "bg-secondary";
  }
};

const formatTime = (timeStr) => {
  const date = new Date(timeStr);
  return (
    date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
    " - " +
    date.toLocaleDateString("vi-VN")
  );
};

const loadData = async () => {
  isLoading.value = true;
  try {
    const overviewResponse = await DashboardService.getOverview();
    stats.value = {
      orders: overviewResponse.orders || 0,
      employees: overviewResponse.employees || 0,
      products: overviewResponse.products || 0,
      users: overviewResponse.users || 0,
    };

    const activityResponse = await ActivityService.findAll();
    activities.value = activityResponse;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu Dashboard Duy ơi:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});
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
.bg-danger-subtle {
  background-color: #fbe9e7;
}

.activity-content {
  color: #2c3e50;
  font-size: 0.95rem;
}

.list-group-item:last-child {
  border-bottom: none !important;
}

.list-group-item {
  transition: background-color 0.2s;
}
.list-group-item:hover {
  background-color: #fafafa;
}
</style>
