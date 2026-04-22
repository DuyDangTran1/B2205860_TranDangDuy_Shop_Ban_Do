<script>
import statisticalService from "@/services/statistical.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { Bar, Pie, Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
);

export default {
  components: { Loading, Bar, Pie, Line },
  data() {
    return {
      loading: true,
      // Mặc định lấy thống kê 30 ngày gần nhất
      startDate: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .substr(0, 10),
      endDate: new Date().toISOString().substr(0, 10),
      stats: {
        totalRevenue: 0,
        totalOrders: 0,
        totalRefund: 0,
        allInventory: [],
        topProducts: [],
        statusOverTime: [],
        newUsersOverTime: [],
        revenueByCategory: [],
        inventory: { totalStock: 0 },
      },
      orderStatusLineData: { labels: [], datasets: [] },
      userBarData: { labels: [], datasets: [] },
      categoryPieData: { labels: [], datasets: [] },
      chartOptions: { responsive: true, maintainAspectRatio: false },
    };
  },
  methods: {
    async fetchStats() {
      this.loading = true;
      try {
        const response = await statisticalService.getDashboardStats({
          startDate: this.startDate,
          endDate: this.endDate,
        });
        if (response.success) {
          this.stats = response.data;
          this.renderCharts();
        }
      } catch (e) {
        console.error("Lỗi fetchStats:", e);
        Swal.fire({ text: "Không thể lấy dữ liệu thống kê!", icon: "error" });
      } finally {
        this.loading = false;
      }
    },

    renderCharts() {
      //BIỂU ĐỒ ĐƯỜNG (Trạng thái đơn hàng)
      const rawData = this.stats.statusOverTime || [];
      const dates = [...new Set(rawData.map((item) => item._id.date))].sort();
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
          data: dates.map((date) => {
            const found = rawData.find(
              (d) => d._id.date === date && d._id.status === status.name,
            );
            return found ? found.count : 0;
          }),
          fill: false,
          tension: 0.3,
        })),
      };

      //BIỂU ĐỒ CỘT (Người dùng mới)
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

      //BIỂU ĐỒ TRÒN (Doanh thu danh mục)
      const categoryData = this.stats.revenueByCategory || [];
      this.categoryPieData = {
        labels: categoryData.map((c) => c._id),
        datasets: [
          {
            data: categoryData.map((c) => c.totalAmount),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
            ],
          },
        ],
      };
    },

    formatPrice(v) {
      return new Intl.NumberFormat("vi-VN").format(v || 0) + "đ";
    },

    // HÀM XUẤT EXCEL
    exportToExcel() {
      try {
        const workbook = XLSX.utils.book_new();

        const topData = this.stats.topProducts.map((p, i) => ({
          STT: i + 1,
          "Tên Sản Phẩm": p.product_name,
          "Số Lượng Đã Bán": p.totalSold,
          "Trạng Thái": "Đang kinh doanh",
        }));
        const wsTop = XLSX.utils.json_to_sheet(topData);
        XLSX.utils.book_append_sheet(workbook, wsTop, "Top_Ban_Chay");

        const invData = this.stats.allInventory.map((p, i) => ({
          STT: i + 1,
          "Tên Biến Thể": p.full_name,
          "Số Lượng Tồn": p.totalQty,
          "Đánh Giá": p.totalQty < 10 ? "Cần nhập gấp" : "Ổn định",
        }));
        const wsInv = XLSX.utils.json_to_sheet(invData);
        XLSX.utils.book_append_sheet(workbook, wsInv, "Ton_Kho_Chi_Tiet");

        const summaryData = [
          {
            "Hạng mục": "Tổng doanh thu",
            "Giá trị": this.formatPrice(this.stats.totalRevenue),
          },
          { "Hạng mục": "Tổng đơn hàng", "Giá trị": this.stats.totalOrders },
          {
            "Hạng mục": "Tổng tiền hoàn",
            "Giá trị": this.formatPrice(this.stats.totalRefund),
          },
          {
            "Hạng mục": "Tổng sản phẩm trong kho",
            "Giá trị": this.stats.inventory.totalStock,
          },
          { "Hạng mục": "Từ ngày", "Giá trị": this.startDate },
          { "Hạng mục": "Đến ngày", "Giá trị": this.endDate },
        ];
        const wsSum = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, wsSum, "Tong_Quan_Chung");

        // Lưu file
        XLSX.writeFile(
          workbook,
          `Bao_Cao_Tong_Hop_SHOPDD_${this.endDate}.xlsx`,
        );

        Swal.fire({
          text: "Xuất file báo cáo thành công",
          icon: "success",
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          text: "Đã có lỗi xảy ra khi xuất file thống kê. Vui lòng thử lại sao!",
          icon: "error",
        });
      }
    },
  },
  mounted() {
    this.fetchStats();
  },
};
</script>

<template>
  <div class="p-4 bg-light min-vh-100">
    <div
      class="card border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-row justify-content-between align-items-center flex-wrap gap-3"
    >
      <h4 class="fw-bold text-shop mb-0">
        <i class="fas fa-chart-pie me-2"></i>Thống kê tổng hợp
      </h4>

      <div class="d-flex align-items-center gap-3 ms-auto">
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-bold text-muted d-none d-md-inline">Từ:</span>
          <input
            v-model="startDate"
            type="date"
            class="form-control shadow-none border-0 bg-light rounded-3 px-3 custom-height"
          />
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-bold text-muted d-none d-md-inline">Đến:</span>
          <input
            v-model="endDate"
            type="date"
            class="form-control shadow-none border-0 bg-light rounded-3 px-3 custom-height"
          />
        </div>

        <button
          class="btn btn-shop px-4 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm custom-height btn-min-width"
          @click="fetchStats"
        >
          <i class="fas fa-filter"></i>
          <span class="text-nowrap">Lọc dữ liệu</span>
        </button>

        <button
          class="btn btn-outline-success px-4 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm custom-height"
          @click="exportToExcel"
        >
          <i class="fas fa-file-excel"></i>
          <span class="d-none d-lg-inline">Xuất Excel</span>
        </button>
      </div>
    </div>

    <Loading :isLoading="loading" />

    <div v-if="!loading">
      <div class="row g-3 mb-4 text-center">
        <div
          class="col-md-3"
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
            { l: 'Tổng tồn', v: stats.inventory.totalStock, c: 'text-warning' },
          ]"
          :key="c.l"
        >
          <div class="card border-0 shadow-sm rounded-4 p-3 h-100">
            <small class="text-muted fw-bold text-uppercase small">{{
              c.l
            }}</small>
            <h5 :class="['fw-bold mb-0', c.c]">{{ c.v }}</h5>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h6 class="fw-bold mb-4 text-success">
          Trạng thái đơn hàng theo thời gian
        </h6>
        <div style="height: 350px">
          <Line :data="orderStatusLineData" :options="chartOptions" />
        </div>
      </div>

      <div class="row g-4 mb-4">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h6 class="fw-bold mb-4">Lượng người dùng đăng ký mới</h6>
            <div style="height: 300px">
              <Bar :data="userBarData" :options="chartOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 text-center">
            <h6 class="fw-bold mb-4">Cơ cấu doanh thu danh mục</h6>
            <div style="height: 300px">
              <Pie :data="categoryPieData" :options="chartOptions" />
            </div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h6 class="fw-bold mb-3 text-brown">
          <i class="fas fa-fire me-2"></i>Sản phẩm bán chạy nhất
        </h6>
        <div class="table-responsive">
          <table class="table table-hover align-middle border-0">
            <thead class="bg-light">
              <tr>
                <th width="80">Ảnh</th>
                <th>Tên sản phẩm</th>
                <th class="text-center">Số lượng bán</th>
                <th class="text-end">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in stats.topProducts" :key="p._id">
                <td>
                  <img
                    :src="`http://localhost:3000/${p.image}`"
                    width="45"
                    height="45"
                    class="rounded border shadow-sm"
                    @error="(e) => (e.target.src = 'https://placehold.co/45')"
                  />
                </td>
                <td class="fw-bold">{{ p.product_name }}</td>
                <td class="text-center">
                  <span class="badge bg-danger-subtle text-danger px-3"
                    >{{ p.totalSold }}
                  </span>
                </td>
                <td class="text-end text-success small">
                  <i class="fas fa-check-circle me-1"></i>Đang bán
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 p-4">
        <h6 class="fw-bold mb-3 text-brown">
          <i class="fas fa-boxes me-2"></i>Chi tiết tồn kho biến thể
        </h6>
        <div class="table-responsive" style="max-height: 400px">
          <table class="table table-hover align-middle small">
            <thead class="bg-light sticky-top">
              <tr>
                <th>Sản phẩm</th>
                <th class="text-center">Số lượng</th>
                <th class="text-center">Mức độ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in stats.allInventory" :key="p._id">
                <td>
                  <div class="d-flex align-items-center">
                    <img
                      :src="`http://localhost:3000/${p.image}`"
                      width="35"
                      height="35"
                      class="me-2 rounded border"
                      @error="(e) => (e.target.src = 'https://placehold.co/35')"
                    />
                    <span class="fw-bold">{{ p.full_name }}</span>
                  </div>
                </td>
                <td class="text-center fw-bold text-success">
                  {{ p.totalQty }}
                </td>
                <td class="text-center">
                  <span
                    :class="[
                      'badge rounded-pill',
                      p.totalQty < 10
                        ? 'bg-danger'
                        : p.totalQty < 30
                          ? 'bg-warning'
                          : 'bg-success',
                    ]"
                  >
                    {{
                      p.totalQty < 10
                        ? "Cần nhập gấp"
                        : p.totalQty < 30
                          ? "Sắp hết"
                          : "Ổn định"
                    }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-shop,
.text-brown {
  color: #533422;
}
.btn-shop {
  background: #533422;
  color: white;
  border: none;
  transition: 0.3s;
}
.btn-shop:hover {
  background: #3d2619;
  transform: translateY(-2px);
}
.custom-height {
  height: 45px;
}
.btn-min-width {
  min-width: 150px;
}
.text-nowrap {
  white-space: nowrap;
}
.bg-light {
  background-color: #f8f9fa !important;
}
.sticky-top {
  top: -1px;
  z-index: 10;
}
</style>
