<script>
import StarRating from "@/components/StarRating.vue";
import my_footer from "@/components/footer.vue";
import my_header from "@/components/header.vue";
import Loading from "@/components/Loading.vue";
import productService from "@/services/product.service";
import cartService from "@/services/cart.service";
export default {
  components: {
    StarRating,
    my_footer,
    my_header,
    Loading,
  },
  data() {
    return {
      // DỮ LIỆU SẢN PHẨM
      product: null,
      // TRẠNG THÁI LỰA CHỌN
      selectedColor: null,
      selectedSize: null,
      quantity: 1,
      accessToken: sessionStorage.getItem("accessToken") || null,
      filter: [
        "Tất cả",
        "5 sao",
        "4 sao",
        "3 sao",
        "2 sao",
        "1 sao",
        "có bình luận",
      ],

      selectedFilter: "Tất cả",
      isLoading: true,
    };
  },
  computed: {
    // 1. Lọc danh sách màu duy nhất
    uniqueColors() {
      const variants = this.product?.variant || [];
      const map = new Map();
      return variants
        .map((v) => v)
        .filter((v) => {
          if (!map.has(v.color._id)) {
            map.set(v.color._id, true);
            return true;
          }
          return false;
        });
    },
    // 2. Lọc danh sách size duy nhất
    uniqueSizes() {
      if (!this.selectedColor || !this.selectedColor.color) return [];
      const filtered =
        this.product?.variant?.filter(
          (v) => v.color._id === this.selectedColor.color._id,
        ) || [];

      // Lọc size duy nhất từ danh sách trên
      const map = new Map();
      return filtered
        .map((v) => v.size)
        .filter((s) => {
          if (!map.has(s._id)) {
            map.set(s._id, true);
            return true;
          }
          return false;
        });
    },

    // 3. Tìm variant đang được chọn
    selectedVariant() {
      if (!this.selectedColor?.color || !this.selectedSize?._id) {
        return this.product?.variant?.find(
          (v) => v.color._id === this.selectedColor?.color?._id,
        );
      }

      return this.product?.variant?.find(
        (v) =>
          v.color._id === this.selectedColor.color._id &&
          v.size._id === this.selectedSize._id,
      );
    },

    formattedDescription() {
      if (!this.product?.description) return "";

      return this.product.description

        .replace(/\\n/g, "\n")

        .replace(/\\/g, "");
    },
  },
  methods: {
    async loadData() {
      try {
        const id = this.$route.params.id;
        const product = await productService.getDetailProduct(id);
        this.product = product.product || {};
        this.selectedColor = this.uniqueColors[0];
        if (!this.selectedSize || !this.selectedSize.size_name)
          this.selectedSize = this.uniqueSizes[0];
      } catch (error) {
        console.log(error);
      } finally {
        this.isLoading = false;
      }
    },

    handleSizeChangeColor(color) {
      this.selectedColor = color;
      const match = this.uniqueSizes.find(
        (s) => s.size_name == this.selectedSize.size_name,
      );
      if (match) {
        this.selectedSize = match;
      } else {
        this.selectedSize = this.uniqueSizes[0];
      }
    },

    handleQuantityChange() {
      if (this.quantity <= 1) {
        this.quantity = 1;
      }

      if (this.quantity > this.selectedVariant.quantity) {
        this.quantity = this.selectedVariant.quantity;
      }
    },
    async addProductToCart() {
      try {
        const result = await cartService.addProduct(
          {
            variant_id: this.selectedVariant._id,
            quantity: this.quantity,
          },
          this.accessToken,
        );
      } catch (error) {
        console.log(error);
      }
    },
  },

  mounted() {
    this.loadData();
  },
};
</script>

<template>
  <Loading :isLoading="isLoading" />

  <div v-if="!isLoading">
    <my_header></my_header>
    <div
      v-if="product && product.variant"
      class="container mt-5 mb-5 text-dark"
    >
      <div class="row g-5 mt-5">
        <div class="col-md-6">
          <div class="main-image-container mb-3">
            <img
              :src="
                'http://localhost:3000/' + selectedVariant?.image_url ||
                'https://via.placeholder.com/600'
              "
              class="img-fluid rounded-4 shadow-sm w-100"
              style="height: 600px; object-fit: cover"
            />
          </div>
          <!-- <span>{{ uniqueColors }}</span> -->
          <div class="d-flex gap-3 justify-content-center">
            <div
              v-for="img in uniqueColors"
              :key="img.color._id"
              class="thumb-box"
              :class="{
                active: selectedColor.color.color_name === img.color.color_name,
              }"
              @click="selectedColor = img"
            >
              <img
                :src="'http://localhost:3000/' + img.image_url"
                class="rounded-3 border"
              />
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <h1 class="fw-bold display-6 mb-3">
            {{ product.product_name }}
          </h1>

          <div class="d-flex align-items-center gap-3 mb-4">
            <h2 class="text-danger fw-bold mb-0">
              {{ product.base_price.toLocaleString() }} VND
            </h2>
            <span class="badge bg-danger">-{{ product.double_discount }}%</span>
          </div>

          <div class="mt-1 mb-4 small text-muted">
            <div>
              <i class="fa-solid fa-shield-halved me-2"></i> Bảo hành chính hãng
              12 tháng
            </div>
            <div class="mt-2">
              <i class="fa-solid fa-truck-fast me-2"></i> Miễn phí vận chuyển
              đơn hàng từ 500k
            </div>
          </div>

          <div class="selection-area p-4 rounded-4 bg-light">
            <div class="mb-4">
              <label class="fw-bold mb-2 d-block"
                >MÀU SẮC:
                <span class="text-primary">{{
                  selectedColor.color.color_name
                }}</span></label
              >
              <div class="d-flex gap-2">
                <button
                  v-for="color in uniqueColors"
                  :key="color"
                  class="btn variant-btn"
                  :class="
                    selectedColor.color.color_name === color.color.color_name
                      ? 'btn-dark'
                      : 'btn-outline-dark'
                  "
                  @click="handleSizeChangeColor(color)"
                >
                  {{ color.color.color_name }}
                </button>
              </div>
            </div>

            <div class="mb-4">
              <label class="fw-bold mb-2 d-block"
                >KÍCH CỠ:
                <span class="text-primary fs-6">
                  {{ selectedSize.size_name }}</span
                ></label
              >
              <div class="d-flex gap-2">
                <button
                  v-for="size in uniqueSizes"
                  :key="size"
                  class="btn variant-btn"
                  :class="
                    selectedSize.size_name === size.size_name
                      ? 'btn-dark'
                      : 'btn-outline-dark'
                  "
                  @click="selectedSize = size"
                >
                  {{ size.size_name }}
                </button>
              </div>
            </div>

            <div class="mb-4 d-flex align-items-center gap-3">
              <label class="fw-bold mb-0">SỐ LƯỢNG:</label>
              <div class="input-group quantity-selector" style="width: 140px">
                <button
                  :class="quantity == 1 ? 'disabled' : ''"
                  class="btn btn-outline-dark border-secondary-subtle"
                  type="button"
                  @click="quantity > 1 ? quantity-- : null"
                >
                  <i class="fa-solid fa-minus"></i>
                </button>

                <input
                  type="number"
                  class="form-control text-center border-secondary-subtle fw-bold"
                  min="1"
                  :max="selectedVariant.quantity"
                  v-model.number="quantity"
                  @change="handleQuantityChange"
                />

                <button
                  :class="
                    selectedVariant.quantity == quantity ? 'disabled' : ''
                  "
                  class="btn btn-outline-dark border-secondary-subtle"
                  type="button"
                  @click="
                    quantity < selectedVariant?.quantity ? quantity++ : null
                  "
                >
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <div class="stock-status mb-4">
              <div v-if="selectedVariant && selectedVariant.quantity > 0">
                <i class="fa-solid fa-check-circle text-success me-1"></i>
                Còn lại <strong>{{ selectedVariant.quantity }}</strong> sản phẩm
                trong kho
              </div>
              <div v-else class="text-danger fw-bold">
                XIN LỖI, SẢN PHẨM NÀY ĐÃ HẾT HÀNG!
              </div>
            </div>

            <div class="row gap-2">
              <button
                v-on:click="addProductToCart"
                class="col-md-6 btn btn-primary btn-lg py-3 fw-bold rounded-3"
                :disabled="!selectedVariant || selectedVariant.quantity <= 0"
                style="background-color: #533422; border: none"
              >
                <i class="fa-solid fa-cart-plus me-2"></i> THÊM VÀO GIỎ HÀNG
              </button>

              <button
                class="col-md-5 btn btn-primary btn-lg py-3 fw-bold rounded-3"
                :disabled="!selectedVariant || selectedVariant.quantity <= 0"
                style="background-color: #533422; border: none"
              >
                <i class="fa-solid fa-bolt me-2"></i> MUA NGAY
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="description px-0 mt-5 mb-4">
        <h3 class="ms-4 pt-4">Mô tả sản phẩm</h3>
        <p class="text-muted fs-5 mb-4 ps-4 mt-3 pb-4">
          {{ formattedDescription }}
        </p>
      </div>

      <div class="product-review">
        <h3 class="pt-4 ms-4">Đánh giá sản phẩm</h3>
        <!-- Bộ lọc đánh giá -->
        <div class="wrap_filter_review mt-4 mx-4 mb-4">
          <div class="mx-4 mt-4 d-flex justify-content-around mb-4">
            <div
              v-for="filter_value in filter"
              :key="filter_value"
              :class="{ select_filter: selectedFilter == filter_value }"
              class="filter_review mx-2"
              v-on:click="selectedFilter = filter_value"
            >
              {{ filter_value }}
            </div>
          </div>
        </div>
        <!-- Bình luận -->
        <div class="wrap_review">
          <div class="infor_user ms-4 row mb-4">
            <div class="col-auto">
              <div
                class="avartar d-flex align-items-center justify-content-center"
              >
                <i class="fa-solid fa-user"></i>
              </div>
            </div>

            <div class="wrap_infor col">
              <h6 class="mb-0 fw-bold">Duy đẹp trai</h6>
              <StarRating :value="4.2" />
              <div class="content_review mt-2">
                Áo đẹp lắm mọi người ơi, mặc vào nhìn như tài tử Hong Kong luôn!
              </div>
            </div>

            <div class="col-12 px-3">
              <hr class="mt-4 mb-2 mb-0 opacity-25" />
            </div>
          </div>
        </div>
      </div>

      <div class="product_recommend row g-3 mt-4">
        <h5 class="mb-0">Có thể bạn cũng thích</h5>
        <div v-for="n in 8" :key="n" class="col-md-2">
          <div class="product_item border border-dark rounded-1 h-100 pb-2">
            <img
              src="https://tse3.mm.bing.net/th/id/OIP.q56o4MJMZj0ajD3EC1yXlwHaHa?pid=Api&h=220&P=0"
              alt=""
              class="w-100"
            />
            <h6 class="mt-2 mb-1 text-center px-1 text-truncate">Áo thun nữ</h6>

            <div class="d-flex justify-content-start px-2">
              <div class="rating">
                <i class="fa-solid fa-star"></i>
                <span>4.9</span>
              </div>
            </div>

            <div class="price_and_number_sell mt-2 px-2">
              <span class="price fw-bold" style="font-size: 0.8rem"
                >100.000đ</span
              >
              <span class="number_sell text-muted" style="font-size: 0.6rem"
                >Đã bán 10k+</span
              >
            </div>

            <div class="discount">
              <span class="fw-bold">76%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <my_footer></my_footer>
  </div>
</template>

<style scoped>
.variant-btn {
  min-width: 60px;
  border-radius: 8px;
  transition: 0.2s;
}

.text-justify {
  text-align: justify;
}

.thumb-box {
  width: 80px;
  height: 80px;
  cursor: pointer;
  transition: 0.3s;
  opacity: 0.6;
}

.thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-box.active {
  opacity: 1;
  transform: scale(1.1);
}

.thumb-box.active img {
  border: 2px solid #533422 !important;
}

.breadcrumb-item + .breadcrumb-item::before {
  color: #6c757d;
}

.main-image-container img {
  transition: transform 0.5s ease;
}

.main-image-container:hover img {
  transform: scale(1.02);
}

.product-review,
.description {
  background-color: #f6f2ef;
}

.wrap_filter_review {
  border: 1px #533422 solid;
  border-radius: 2px;
  background-color: #fdeee5;
  overflow-x: auto;
}

.description {
  /* max-width: 80%; */
  white-space: pre-line;
  text-align: justify;
}

.description p {
  max-width: 90%;
}

.filter_review {
  padding: 4px 30px;
  border: 1px #ccc solid;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
  background-color: #d0cccc;
}

.select_filter.filter_review {
  border: #533422;
  background-color: #87593f;
}

.avartar {
  width: 50px;
  height: 50px;
  border: 1px #533422 solid;
  border-radius: 999px;
}

.product_item {
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.product_item:hover img {
  scale: calc(1.02);
}

.product_item img {
  width: 100%;
}

.rating {
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px #ffc107 solid;
  background-color: #fcf3d8;
  border-radius: 2px;
}

.product_item i,
span {
  font-size: 0.7rem;
}

.product_item i {
  color: #ffc107;
  transform: translateY(10%);
}

.price_and_number_sell {
  display: flex;
  justify-content: space-between;
}

.price_and_number_sell span {
  font-size: 0.9rem;
}

.price {
  color: #f00;
}

.discount {
  padding: 0 2px;
  position: absolute;
  top: 0;
  right: 0;
  color: #f00;
  background-color: rgb(251, 196, 196);
}
</style>
