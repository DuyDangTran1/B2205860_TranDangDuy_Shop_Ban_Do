<template>
  <div class="p-4 bg-light min-vh-100">
    <div
      class="card border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-row justify-content-between align-items-center flex-wrap gap-3"
    >
      <h4 class="fw-bold text-shop mb-0">
        <i class="fas fa-home me-2"></i>Trang chủ thống kê doanh nghiệp
      </h4>
      <div class="d-flex align-items-center gap-3 ms-auto">
        <input
          v-model="startDate"
          type="date"
          class="form-control border-0 bg-light rounded-3 px-3 custom-height"
        />
        <input
          v-model="endDate"
          type="date"
          class="form-control border-0 bg-light rounded-3 px-3 custom-height"
        />
        <button
          class="btn btn-shop px-4 fw-bold custom-height text-nowrap"
          @click="fetchStats"
        >
          <i class="fas fa-filter me-2"></i>Lọc dữ liệu
        </button>
      </div>
    </div>
    <Loading :isLoading="loading" />
    <div v-if="!loading">
      <div class="row g-3 mb-4 text-center">
        <div
          class="col-md-4"
          v-for="c in [
            {
              l: 'Doanh thu',
              v: formatPrice(stats.totalRevenue),
              c: 'text-success',
            },
            {
              l: 'Hoàn tiền',
              v: formatPrice(stats.totalRefund),
              c: 'text-danger',
            },
            { l: 'Đơn hàng', v: stats.totalOrders, c: 'text-primary' },
          ]"
          :key="c.l"
        >
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
            <small class="text-muted fw-bold text-uppercase small">{{
              c.l
            }}</small>
            <h3 :class="['fw-bold mb-0 mt-2', c.c]">{{ c.v }}</h3>
          </div>
        </div>
      </div>
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 class="fw-bold mb-4 text-dark">Lượng người dùng đăng ký mới</h6>
            <div style="height: 320px">
              <Bar :data="userBarData" :options="chartOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h6 class="fw-bold mb-3 text-brown">
              <i class="fas fa-fire me-2"></i>Top 5 sản phẩm bán chạy nhất
            </h6>
            <div class="table-responsive">
              <table class="table table-hover align-middle border-0">
                <thead class="bg-light">
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th class="text-center">Số lượng bán</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in stats.topProducts" :key="p._id">
                    <td class="fw-bold text-truncate" style="max-width: 180px">
                      {{ p.product_name }}
                    </td>
                    <td class="text-center">
                      <span class="badge bg-danger-subtle text-danger px-3">{{
                        p.totalSold
                      }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import statisticalService from "@/services/statistical.service";
import Loading from "@/components/Loading.vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
);
export default {
  components: { Loading, Bar },
  data() {
    return {
      loading: true,
      startDate: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .substr(0, 10),
      endDate: new Date().toISOString().substr(0, 10),
      stats: {
        totalRevenue: 0,
        totalOrders: 0,
        totalRefund: 0,
        topProducts: [],
        newUsersOverTime: [],
      },
      userBarData: { labels: [], datasets: [] },
      chartOptions: { responsive: true, maintainAspectRatio: false },
    };
  },
  methods: {
    async fetchStats() {
      this.loading = true;
      try {
        const res = await statisticalService.getDashboardStats({
          startDate: this.startDate,
          endDate: this.endDate,
        });
        if (res.success) {
          this.stats = res.data;
          this.userBarData = {
            labels: this.stats.newUsersOverTime.map((u) => u._id),
            datasets: [
              {
                label: "Người dùng mới",
                backgroundColor: "#17a2b8",
                data: this.stats.newUsersOverTime.map((u) => u.count),
              },
            ],
          };
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    formatPrice(v) {
      return new Intl.NumberFormat("vi-VN").format(v || 0) + "đ";
    },
  },
  mounted() {
    this.fetchStats();
  },
};
</script>
<style scoped>
.text-shop,
.text-brown {
  color: #533422;
}
.btn-shop {
  background: #533422;
  color: white;
}
.custom-height {
  height: 45px;
}
</style>
