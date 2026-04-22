<template>
  <div class="shop-layout">
    <header-component />

    <Loading :isLoading="isLoading"></Loading>

    <main v-if="!isLoading" class="container mt-5 pb-5 content-wrapper">
      <div class="collection-header text-center mb-5">
        <h1 class="fw-bold text-uppercase text-shop">
          {{ collectionInfo.collection_name }}
        </h1>
        <p class="text-muted mx-auto" style="max-width: 700px">
          {{ collectionInfo.description }}
        </p>
        <div class="divider mx-auto"></div>
      </div>

      <div v-if="products.length > 0">
        <div class="row g-4">
          <div
            v-for="item in products"
            :key="item._id"
            class="col-6 col-md-4 col-lg-3"
          >
            <div
              class="card h-100 product-card border-0 shadow-sm"
              @click="goToDetail(item.product_id)"
            >
              <div class="position-relative overflow-hidden img-container">
                <img
                  :src="`http://localhost:3000/${item.product_image}`"
                  class="card-img-top p-2"
                  :alt="item.product_name"
                />
                <div class="overlay">
                  <span class="btn btn-light btn-sm fw-bold">Xem chi tiết</span>
                </div>
              </div>
              <div class="card-body text-center">
                <h6 class="card-title text-truncate-2">
                  {{ item.product_name }}
                </h6>
                <p class="card-text fw-bold text-danger fs-5">
                  {{ formatPrice(item.base_price) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav class="mt-5" v-if="!isLoading">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="currentPage <= 1 ? 'disabled' : ''">
              <router-link
                class="page-link"
                :to="{
                  name: 'CollectionProducts',
                  params: { id: $route.params.id || '' },
                  query: { page: Math.max(1, currentPage - 1) },
                }"
                >Trước</router-link
              >
            </li>

            <li
              v-for="p in totalPages"
              :key="p"
              class="page-item"
              :class="currentPage == p ? 'active' : ''"
            >
              <router-link
                class="page-link"
                :to="{
                  name: 'CollectionProducts',
                  params: { id: $route.params.id || '' },
                  query: { page: p },
                }"
                >{{ p }}</router-link
              >
            </li>

            <li
              class="page-item"
              :class="currentPage >= totalPages ? 'disabled' : ''"
            >
              <router-link
                class="page-link"
                :to="{
                  name: 'CollectionProducts',
                  params: { id: $route.params.id || '' },
                  query: { page: Math.min(totalPages, currentPage + 1) },
                }"
                >Sau</router-link
              >
            </li>
          </ul>
        </nav>
      </div>

      <div v-else class="text-center py-5">
        <i class="fa-solid fa-box-open fs-1 text-muted mb-3"></i>
        <p class="text-muted">Bộ sưu tập này hiện chưa có sản phẩm nào!</p>
        <router-link :to="{ name: 'Home' }" class="btn btn-shop"
          >Quay về trang chủ</router-link
        >
      </div>
    </main>

    <footer-component v-if="!isLoading" />
  </div>
</template>

<script>
import collectionService from "@/services/collection.service";
import collectionProductService from "@/services/collection_product.service";
import Loading from "@/components/Loading.vue";
import header from "@/components/header.vue";
import footer from "@/components/footer.vue";

export default {
  name: "CollectionDetail",
  components: {
    Loading,
    "header-component": header,
    "footer-component": footer,
  },
  data() {
    return {
      collectionInfo: {},
      products: [],
      totalPages: 0,
      isLoading: true,
    };
  },
  computed: {
    currentPage() {
      return parseInt(this.$route.query.page) || 1;
    },
  },

  methods: {
    async loadData() {
      this.isLoading = true;
      const id = this.$route.params.id;
      const page = this.currentPage;
      console.log(id);
      console.log(this.currentPage);
      try {
        const [infoRes, prodRes] = await Promise.all([
          collectionService.getOne(id),
          collectionProductService.getProducts(id, page),
        ]);

        this.collectionInfo = infoRes.collection || {};
        this.products = prodRes.collection_products || [];
        this.totalPages = prodRes.count_page || 0;
      } catch (error) {
        console.error("Lỗi tải bộ sưu tập:", error);
        this.isLoading = false;
      } finally {
        setTimeout(() => {
          this.isLoading = false;
        }, 200);
      }
    },
    formatPrice(price) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(price);
    },
    goToDetail(productId) {
      this.$router.push({ name: "Detail", params: { id: productId } });
    },
  },
  mounted() {
    this.loadData();
  },
  watch: {
    "$route.params.id": "loadData",
    "$route.query.page": "loadData",
  },
};
</script>

<style scoped>
.content-wrapper {
  min-height: 60vh;
}
.text-shop {
  color: #533422;
}
.btn-shop {
  background-color: #ac7657;
  color: white;
  border: none;
  padding: 10px 25px;
}
.btn-shop:hover {
  background-color: #533422;
  color: white;
}
.divider {
  width: 60px;
  height: 3px;
  background-color: #ac7657;
  margin-top: 15px;
}
.product-card {
  cursor: pointer;
  transition: 0.3s;
  border-radius: 12px;
}
.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}
.img-container img {
  height: 280px;
  object-fit: cover;
  transition: 0.5s;
}
.product-card:hover img {
  transform: scale(1.05);
}
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.8rem;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(83, 52, 34, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: 0.3s;
}
.product-card:hover .overlay {
  opacity: 1;
}
.page-link {
  color: #533422;
  border-color: #dee2e6;
}
.page-item.active .page-link {
  background-color: #ac7657;
  border-color: #ac7657;
  color: white;
}
</style>
