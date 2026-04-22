<script>
import collectionProductService from "@/services/collection_product.service";
import collectionService from "@/services/collection.service";
import productService from "@/services/product.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";

export default {
  components: { Loading },
  data() {
    return {
      collectionId: this.$route.params.id,
      collection: {},
      collectionProducts: [],
      allProducts: [],
      isLoading: false,
      showAddModal: false,
      searchQuery: "",
      searchInWarehouse: "",
    };
  },
  computed: {
    filteredCollectionProducts() {
      return this.collectionProducts.filter((p) =>
        p.product_name.toLowerCase().includes(this.searchQuery.toLowerCase()),
      );
    },
    availableProducts() {
      const existingIds = this.collectionProducts.map((p) => p.product_id);
      return this.allProducts.filter(
        (p) =>
          !existingIds.includes(p._id) &&
          p.product_name
            .toLowerCase()
            .includes(this.searchInWarehouse.toLowerCase()),
      );
    },
  },
  methods: {
    async initData() {
      this.isLoading = true;
      try {
        const [colRes, colProdRes, allProdRes] = await Promise.all([
          collectionService.getCollection(this.collectionId),
          collectionProductService.getAllCollectionProduct(this.collectionId),
          productService.getAllProducts(),
        ]);

        this.collection = colRes.collection || {};
        this.collectionProducts = colProdRes.collection_products || [];
        this.allProducts = allProdRes.products || [];
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    },
    async addProductToCollection(productId) {
      try {
        await collectionProductService.createCollection({
          collection_id: this.collectionId,
          product_ids: [productId],
        });
        await this.initData();
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Đã thêm sản phẩm",
          showConfirmButton: false,
          timer: 1500,
        });
      } catch (err) {
        Swal.fire("Lỗi", "Không thể thêm sản phẩm", "error");
      }
    },
    async removeProduct(productId) {
      const res = await Swal.fire({
        title: "Xác nhận",
        text: "Gỡ sản phẩm này khỏi bộ sưu tập?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#533422",
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
      });
      if (res.isConfirmed) {
        try {
          await collectionProductService.deleteCollection(
            this.collectionId,
            productId,
          );
          await this.initData();
        } catch (err) {
          Swal.fire("Lỗi", "Không thể gỡ sản phẩm", "error");
        }
      }
    },
    formatPrice(val) {
      return new Intl.NumberFormat("vi-VN").format(val);
    },
  },
  mounted() {
    this.initData();
  },
};
</script>

<template>
  <div class="collection-product-detail p-4">
    <Loading :isLoading="isLoading" />

    <div v-if="!isLoading">
      <div class="d-flex align-items-center mb-4">
        <button
          @click="$router.back()"
          class="btn btn-light rounded-circle me-3 shadow-sm border"
        >
          <i class="fas fa-arrow-left"></i>
        </button>
        <h4 class="fw-bold text-brown m-0 text-uppercase tracking-wider">
          Sản phẩm trong: {{ collection.collection_name }}
        </h4>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div
            class="card border-0 shadow-sm rounded-4 overflow-hidden sticky-top"
            style="top: 20px"
          >
            <img
              :src="`http://localhost:3000/${collection.image_url}`"
              class="card-img-top object-fit-cover"
              style="height: 300px"
            />
            <div class="card-body p-4 text-center">
              <h5 class="fw-bold text-brown text-uppercase mb-2">
                {{ collection.collection_name }}
              </h5>
              <p class="text-secondary small mb-0">
                {{ collection.description || "Chưa có mô tả chi tiết." }}
              </p>
              <div class="mt-3 border-top pt-3 text-muted small">
                Số lượng:
                <span class="fw-bold text-brown"
                  >{{ collectionProducts.length }} sản phẩm</span
                >
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div class="card-body p-4">
              <div
                class="d-flex justify-content-between align-items-center mb-4"
              >
                <div
                  class="position-relative flex-grow-1 me-3"
                  style="max-width: 300px"
                >
                  <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control ps-5 border-0 bg-light rounded-pill py-2"
                    placeholder="Tìm trong danh sách..."
                  />
                  <i
                    class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"
                  ></i>
                </div>
                <button
                  class="btn btn-brown px-4 shadow-sm fw-bold rounded-pill text-nowrap"
                  @click="showAddModal = true"
                >
                  <i class="fas fa-plus me-2"></i> THÊM SẢN PHẨM
                </button>
              </div>

              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                    <tr>
                      <th class="ps-4 py-3 small fw-bold text-uppercase">
                        Sản phẩm
                      </th>
                      <th class="py-3 small fw-bold text-uppercase text-center">
                        Giá gốc
                      </th>
                      <th
                        class="py-3 small fw-bold text-uppercase text-end pe-4"
                      >
                        Gỡ bỏ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in filteredCollectionProducts"
                      :key="item._id"
                      class="border-bottom"
                    >
                      <td class="ps-4 py-3">
                        <div class="d-flex align-items-center gap-3">
                          <img
                            :src="`http://localhost:3000/${item.product_image}`"
                            class="rounded-3 border"
                            style="width: 55px; height: 55px; object-fit: cover"
                          />
                          <div class="fw-bold text-dark">
                            {{ item.product_name }}
                          </div>
                        </div>
                      </td>
                      <td class="text-center text-brown fw-bold">
                        {{ formatPrice(item.base_price) }}đ
                      </td>
                      <td class="pe-4 text-end">
                        <button
                          @click="removeProduct(item.product_id)"
                          class="btn btn-outline-danger btn-sm rounded-circle shadow-sm border-0"
                        >
                          <i class="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                    <tr v-if="filteredCollectionProducts.length === 0">
                      <td
                        colspan="3"
                        class="text-center py-5 text-muted italic"
                      >
                        <i
                          class="fas fa-box-open fa-2x mb-2 d-block opacity-25"
                        ></i>
                        Trống
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

    <div v-if="showAddModal" class="custom-modal-overlay">
      <div
        class="custom-modal-content p-4 shadow-lg rounded-4 animate__animated animate__fadeInUp"
      >
        <div
          class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2"
        >
          <h5 class="fw-bold m-0 text-brown">CHỌN TỪ KHO</h5>
          <button
            type="button"
            class="btn-close"
            @click="showAddModal = false"
          ></button>
        </div>
        <input
          v-model="searchInWarehouse"
          type="text"
          class="form-control mb-3 bg-light border-0 rounded-pill px-4"
          placeholder="Tìm tên sản phẩm..."
        />
        <div class="warehouse-list overflow-auto" style="max-height: 350px">
          <div
            v-for="p in availableProducts"
            :key="p._id"
            class="d-flex align-items-center justify-content-between p-2 border-bottom hover-light"
          >
            <div class="d-flex align-items-center gap-2">
              <img
                :src="`http://localhost:3000/${p.image_url}`"
                class="rounded border"
                style="width: 45px; height: 45px; object-fit: cover"
              />
              <div class="fw-bold small">{{ p.product_name }}</div>
            </div>
            <button
              @click="addProductToCollection(p._id)"
              class="btn btn-sm btn-brown rounded-pill px-3"
            >
              Thêm
            </button>
          </div>
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
.btn-brown:hover {
  background-color: #3e2719;
}
.rounded-4 {
  border-radius: 1rem !important;
}

.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(83, 52, 34, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.custom-modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
}
.hover-light:hover {
  background-color: #fcf8f6;
}
.bg-light {
  background-color: #f8f9fa !important;
}
</style>
