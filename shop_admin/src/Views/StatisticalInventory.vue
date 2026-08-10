<template>
  <div class="p-4 bg-light min-vh-100">
    <div
      class="card border-0 shadow-sm rounded-4 p-3 mb-4 d-flex flex-row justify-content-between align-items-center flex-wrap gap-3"
    >
      <h4 class="fw-bold text-shop mb-0">
        <i class="fas fa-warehouse me-2"></i>Báo cáo tổng hợp luồng biến động
        Xuất - Nhập - Tồn kho biến thể
      </h4>
      <div class="d-flex align-items-center gap-3 ms-auto">
        <button
          class="btn btn-outline-success px-4 fw-bold custom-height shadow-sm"
          @click="exportToExcel"
        >
          <i class="fas fa-file-excel me-2"></i>Xuất Excel báo cáo
        </button>
      </div>
    </div>
    <Loading :isLoading="loading" />
    <div v-if="!loading" class="card border-0 shadow-sm rounded-4 p-4">
      <div class="input-group mb-4">
        <span class="input-group-text bg-white border-end-0"
          ><i class="fas fa-search text-muted"></i
        ></span>
        <input
          v-model="keyword"
          @input="debouncedGetInventoryStats"
          type="text"
          class="form-control border-start-0 ps-0"
          placeholder="Tìm nhanh mã sản phẩm hoặc tên biến thể quần áo..."
        />
      </div>
      <div class="table-responsive" style="max-height: 550px">
        <table class="table table-hover align-middle small mb-0">
          <thead class="bg-light sticky-top">
            <tr>
              <th>Sản phẩm biến thể hệ thống SHOPDD</th>
              <th class="text-center" width="160">Lượng hàng Nhập</th>
              <th class="text-center" width="160">Lượng hàng Xuất</th>
              <th class="text-center" width="160">Lượng hàng Tồn</th>
              <th class="text-center" width="160">Mức độ kho</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in warehouseInventory" :key="p._id">
              <td>
                <div class="d-flex align-items-center">
                  <img
                    :src="`http://localhost:3000/${p.image}`"
                    width="35"
                    height="35"
                    class="me-2 rounded border"
                    @error="(e) => (e.target.src = 'https://placehold.co/35')"
                  />
                  <span class="fw-bold text-dark">{{ p.full_name }}</span>
                </div>
              </td>
              <td class="text-center fw-bold text-info">
                {{ p.totalImported }}
              </td>
              <td class="text-center fw-bold text-danger">
                {{ p.totalExported }}
              </td>
              <td class="text-center fw-bold text-success">
                {{ p.currentStock }}
              </td>
              <td class="text-center">
                <span
                  :class="[
                    'badge rounded-pill',
                    p.currentStock < 10
                      ? 'bg-danger'
                      : p.currentStock < 30
                        ? 'bg-warning'
                        : 'bg-success',
                  ]"
                >
                  {{
                    p.currentStock < 10
                      ? "Cần nhập gấp"
                      : p.currentStock < 30
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
</template>
<script>
import statisticalService from "@/services/statistical.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useDebounceFn } from "@vueuse/core";
export default {
  components: { Loading },
  data() {
    return { loading: true, keyword: "", warehouseInventory: [] };
  },
  created() {
    this.debouncedGetInventoryStats = useDebounceFn(() => {
      this.getInventoryWarehouseStats();
    }, 500);
  },
  methods: {
    async getInventoryWarehouseStats() {
      this.loading = true;
      try {
        const res = await statisticalService.getInventoryWarehouseStats({
          keyword: this.keyword,
        });
        if (res.success) {
          this.warehouseInventory = res.data.allInventory;
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    exportToExcel() {
      try {
        const workbook = XLSX.utils.book_new();
        const invData = this.warehouseInventory.map((p, i) => ({
          STT: i + 1,
          "Tên Biến Thể": p.full_name,
          "Lượng Nhập": p.totalImported,
          "Lượng Xuất": p.totalExported,
          "Lượng Tồn Kho": p.currentStock,
          "Mức Độ": p.currentStock < 10 ? "Nguy cấp" : "Ổn định",
        }));
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(invData),
          "Thong_Ke_Kho",
        );
        XLSX.writeFile(workbook, `Bao_Cao_Kho_SHOPDD.xlsx`);
        Swal.fire({
          text: "Xuất báo cáo bến bãi Excel thành công",
          icon: "success",
        });
      } catch (error) {
        Swal.fire({ text: "Lỗi xuất file", icon: "error" });
      }
    },
  },
  mounted() {
    this.getInventoryWarehouseStats();
  },
};
</script>
<style scoped>
.text-shop {
  color: #533422;
}
.custom-height {
  height: 45px;
}
.sticky-top {
  top: -1px;
  z-index: 10;
}
</style>
