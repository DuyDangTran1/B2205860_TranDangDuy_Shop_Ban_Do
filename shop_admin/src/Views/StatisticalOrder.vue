<template>
  <div class="p-4 bg-light min-vh-100">
    <div
      class="card border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-row justify-content-between align-items-center flex-wrap gap-3"
    >
      <h4 class="fw-bold text-shop mb-0">
        <i class="fas fa-shopping-bag me-2"></i>Thống kê đơn hàng theo thời gian
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

    <div v-if="!loading" class="row g-4">
      <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
          <h6 class="fw-bold mb-4 text-success">
            Trạng thái đơn hàng theo mốc thời gian
          </h6>
          <div style="height: 400px">
            <LineChart :data="orderStatusLineData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import statisticalService from "@/services/statistical.service";
import Loading from "@/components/Loading.vue";
import { Line as LineChart } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
);

export default {
  components: { Loading, LineChart },
  data() {
    return {
      loading: true,
      startDate: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .substr(0, 10),
      endDate: new Date().toISOString().substr(0, 10),
      orderStatusLineData: { labels: [], datasets: [] },
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
          const stats = res.data;
          const rawData = stats.statusOverTime || [];
          const dates = [
            ...new Set(rawData.map((item) => item._id.date)),
          ].sort();
          const statuses = [
            { name: "Đã giao", color: "#28a745" },
            { name: "Đã hủy", color: "#dc3545" },
            { name: "Đang chờ xác nhận", color: "#ffc107" },
          ];

          this.orderStatusLineData = {
            labels: dates,
            datasets: statuses.map((status) => ({
              label: status.name,
              borderColor: status.color,
              backgroundColor: status.color,
              fill: false,
              tension: 0.3,
              data: dates.map((date) => {
                const found = rawData.find(
                  (d) => d._id.date === date && d._id.status === status.name,
                );
                return found ? found.count : 0;
              }),
            })),
          };
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
  },
  mounted() {
    this.fetchStats();
  },
};
</script>

<style scoped>
.text-shop {
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
