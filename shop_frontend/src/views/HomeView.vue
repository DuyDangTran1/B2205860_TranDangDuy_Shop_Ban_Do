<script>
import productService from "@/services/product.service";
import collectionService from "@/services/collection.service";
import myheader from "@/components/header.vue";
import myfooter from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
export default {
  components: {
    myheader,
    myfooter,
    Loading,
  },

  data() {
    return {
      isLoading: true,
      products: [],
      collections: [],
    };
  },
  methods: {
    async loadData() {
      try {
        const [prodRes, collRes] = await Promise.all([
          productService.getProductNew(),
          collectionService.getFeatured(),
        ]);

        this.products = prodRes.products || [];
        this.collections = collRes.collections || [];
      } catch (error) {
        console.log(error);
      } finally {
        this.isLoading = false;
      }
    },
  },

  mounted() {
    this.loadData();
  },
};
</script>

<template>
  <loading :isLoading="isLoading"></loading>
  <div v-if="!isLoading">
    <myheader></myheader>
    <div class="container-fluid p-0 overflow-hidden">
      <!-- //banner -->
      <img
        class="banner"
        src="https://i.pinimg.com/1200x/db/0b/f6/db0bf6abc011c7a6621e7b8db6b18a1d.jpg"
      />

      <div
        v-if="products.length !== 0"
        class="row col-lg-10 offset-1 mt-5 mb-5"
      >
        <h2 class="mb-2">Sản phẩm mới nhất</h2>
        <div class="wrap_lastest_product row g-4">
          <div v-for="product in products" :key="product._id" class="col-lg-4">
            <router-link
              :to="{ name: 'Detail', params: { id: product._id } }"
              class="router-link"
            >
              <div class="lastest_product_card shadow-sm h-100">
                <div class="badge-new">NEW</div>

                <div class="product_img_container">
                  <img
                    class="product_img"
                    :src="`http://localhost:3000/${product.image_url}`"
                    alt="Product Image"
                  />
                  <div class="overlay_view">
                    <span>Xem chi tiết</span>
                  </div>
                </div>

                <div class="product_info p-3">
                  <h5 class="product_name text-dark fw-bold mb-2">
                    {{ product.product_name }}
                  </h5>
                  <div
                    class="d-flex align-items-center justify-content-between"
                  >
                    <span class="price_tag">
                      {{
                        Intl.NumberFormat("vi-VN").format(product.base_price)
                      }}đ
                    </span>
                    <div class="view_more_link">
                      <i class="fa-solid fa-arrow-right"></i>
                    </div>
                  </div>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <div
        v-if="collections.length !== 0"
        class="col-lg-10 offset-1 mt-5 mb-5 px-3"
      >
        <div class="d-flex justify-content-between align-items-end mb-4">
          <div>
            <h2 class="fw-bold mb-0">Bộ sưu tập mới nhất</h2>
            <p class="text-muted mt-2">
              Khám phá những phong cách độc đáo được tuyển chọn riêng cho bạn.
            </p>
          </div>
          <router-link
            to="/all-collections"
            class="text-decoration-none text-shop fw-bold"
          >
            Xem tất cả <i class="fa-solid fa-chevron-right ms-1"></i>
          </router-link>
        </div>

        <div class="row g-4">
          <div
            v-for="col in collections"
            :key="col._id"
            class="col-lg-3 col-md-6"
          >
            <router-link
              :to="{ name: 'CollectionProducts', params: { id: col._id } }"
              class="collection-card text-decoration-none"
            >
              <div class="collection-img-wrapper shadow-sm">
                <img
                  :src="`http://localhost:3000/${col.image_url}`"
                  class="collection-img"
                  alt="Collection"
                />
                <div class="collection-overlay">
                  <h4 class="text-white fw-bold">{{ col.collection_name }}</h4>
                  <span class="btn-discover">Khám phá ngay</span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <div class="convenient mb-5 row">
        <div class="col-lg-3 text-center">
          <i class="fa-solid fa-truck-fast mt-5"></i>
          <h4 class="mt-4 fw-bold">Miễn phí ship</h4>
          <p class="pb-5">
            Bước vào vương quốc của phong cách với người tạo ra xu hướng áo
            phông không thể đánh bại của chúng tôi ngày nay. Miễn phí ship toàn
            quốc với các đơn hàng từ 500K
          </p>
        </div>

        <div class="col-lg-3 text-center">
          <i class="fa-solid fa-headset mt-5"></i>
          <h4 class="mt-4 fw-bold">Tư vấn 24/7</h4>
          <p class="pb-5">
            Bước vào vương quốc của phong cách với người tạo ra xu hướng áo
            phông không thể đánh bại của chúng tôi ngày nay.
          </p>
        </div>

        <div class="col-lg-3 text-center">
          <i class="fa-solid fa-rotate-left mt-5"></i>
          <h4 class="mt-4 fw-bold">Đổi trả dễ dàng</h4>
          <p class="pb-5">
            Bước vào vương quốc của phong cách với người tạo ra xu hướng áo
            phông không thể đánh bại của chúng tôi ngày nay.
          </p>
        </div>

        <div class="col-lg-3 text-center">
          <i class="fa-solid fa-lock mt-5"></i>
          <h4 class="mt-4 fw-bold">Thanh toán an toàn</h4>
          <p class="pb-5">
            Bước vào vương quốc của phong cách với người tạo ra xu hướng áo
            phông không thể đánh bại của chúng tôi ngày nay.
          </p>
        </div>
      </div>

      <div class="col-lg-10 offset-1 mt-5">
        <h2 class="fw-bold text-center">THỂ LOẠI</h2>
        <p class="text-center mt-2">
          Hoàn hảo cho các thương hiệu quần áo, shop thời trang và các cửa hàng
          thời trang trực tuyến.
        </p>

        <div class="wrap_category mt-5 pt-3 mb-5 row">
          <!-- Thời trang nam -->
          <div class="col-lg-3">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/736x/9d/a7/12/9da7124bc42f281ade9fd9a297596e14.jpg"
              alt=""
            />
          </div>

          <!-- Thời trang nữ -->
          <div class="col-lg-3">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/736x/9e/99/40/9e99406fadfddda02af45e2a684004f5.jpg"
              alt=""
            />
          </div>
          <!-- Thời trang dành cho trẻ em -->
          <div class="col-lg-3">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/736x/4f/d1/54/4fd154412da9a571083a32afc27dd903.jpg"
              alt=""
            />
          </div>

          <!-- Thời trang phụ kiện -->
          <div class="col-lg-3">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/736x/60/8c/35/608c35d4830b4c899e7c044c4111c793.jpg"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
    <myfooter></myfooter>
  </div>
</template>
<style scoped>
.router-link {
  text-decoration: none;
  transition: all 0.3s ease;
}

.banner {
  width: 100%;
  height: auto;
  display: block;
}

.lastest_product_card {
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.lastest_product_card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px rgba(83, 52, 34, 0.12) !important;
  border-color: #533422;
}

.badge-new {
  position: absolute;
  top: 15px;
  left: 15px;
  background: #533422;
  color: #fff;
  padding: 4px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  border-radius: 4px;
  z-index: 5;
  letter-spacing: 1px;
}

.product_img_container {
  position: relative;
  height: 400px;
  overflow: hidden;
  background-color: #f8f8f8;
}

.product_img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.lastest_product_card:hover .product_img {
  transform: scale(1.08);
}

.overlay_view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(83, 52, 34, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: 0.3s ease;
}

.lastest_product_card:hover .overlay_view {
  opacity: 1;
}

.overlay_view span {
  color: #fff;
  background: #533422;
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.product_name {
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s;
}

.lastest_product_card:hover .product_name {
  color: #533422 !important;
}

.price_tag {
  color: #ee4d2d;
  font-weight: 700;
  font-size: 1.2rem;
}

.view_more_link {
  width: 35px;
  height: 35px;
  background: #f8f1ed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #533422;
  transition: 0.3s;
}

.lastest_product_card:hover .view_more_link {
  background: #533422;
  color: #fff;
}

.convenient {
  background-color: #f0ebe7;
  padding: 40px 0;
}

.convenient i {
  color: #a19786;
  font-size: 4rem;
  margin-bottom: 20px;
}

.convenient h4 {
  font-size: 1.25rem;
  color: #533422;
}

.convenient p {
  padding: 0 20px;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
}

.wrap_category .col-lg-3 {
  padding: 10px;
}

.img {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  height: 450px;
  cursor: pointer;
}

.img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s ease;
}

.img:hover img {
  transform: scale(1.1);
  filter: brightness(0.8);
}

h2 {
  color: #533422;
  letter-spacing: 1px;
}

.collection-img-wrapper {
  position: relative;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.5s ease;
}

.collection-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  transition: transform 0.8s ease;
}

.collection-overlay h4 {
  font-size: 1.1rem;
  margin-bottom: 5px;
}

.btn-discover {
  padding: 4px 12px;
  font-size: 0.75rem;
}

@media (max-width: 991px) {
  .product_img_container {
    height: 300px;
  }
  .convenient i {
    font-size: 3rem;
  }
}
</style>
