<script>
import StarRating from "@/components/StarRating.vue";
import my_footer from "@/components/footer.vue";
import my_header from "@/components/header.vue";
import Loading from "@/components/Loading.vue";
import productService from "@/services/product.service";
import cartService from "@/services/cart.service";
import reviewService from "@/services/review.service";
import { useCartStore } from "@/stores/cartStore";
import Swal from "sweetalert2";
export default {
  components: {
    StarRating,
    my_footer,
    my_header,
    Loading,
  },

  setup() {
    const cartStore = useCartStore();
    return { cartStore };
  },

  data() {
    return {
      product: null,
      reviews: [],
      selectedColor: null,
      selectedSize: null,
      quantity: 1,
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
      recommendations: [],
      // Đã xóa accessToken lắt nhắt, interceptor sẽ lo
    };
  },
  computed: {
    // Check xem đã đăng nhập chưa để hiện gợi ý (dùng cho Template)
    isLoggedIn() {
      return !!sessionStorage.getItem("accessToken");
    },
    filteredReviewsList() {
      if (this.selectedFilter === "Tất cả") return this.reviews;
      if (this.selectedFilter === "có bình luận") {
        return this.reviews.filter((r) => r.comment && r.comment.trim() !== "");
      }
      const stars = parseInt(this.selectedFilter);
      return this.reviews.filter((r) => r.rating_score === stars);
    },
    uniqueColors() {
      const variants = this.product?.variant || [];
      const map = new Map();
      return variants.filter((v) => {
        if (v.color_name && !map.has(v.color_name)) {
          map.set(v.color_name, true);
          return true;
        }
        return false;
      });
    },
    uniqueSizes() {
      if (!this.selectedColor?.color_name) return [];
      const filteredByColor =
        this.product?.variant?.filter(
          (v) => v.color_name === this.selectedColor.color_name,
        ) || [];
      const map = new Map();
      return filteredByColor
        .filter((v) => {
          if (v.size_name && !map.has(v.size_name)) {
            map.set(v.size_name, true);
            return true;
          }
          return false;
        })
        .sort((a, b) => a.size_name.localeCompare(b.size_name));
    },
    selectedVariant() {
      if (!this.selectedColor || !this.selectedSize) {
        return this.product?.variant?.find(
          (v) => v.color_name === this.selectedColor?.color_name,
        );
      }
      return this.product?.variant?.find(
        (v) =>
          v.color_name === this.selectedColor.color_name &&
          v.size_name === this.selectedSize.size_name,
      );
    },
  },
  methods: {
    async loadData() {
      this.isLoading = true;
      try {
        const id = this.$route.params.id;

        // Reset lựa chọn khi đổi sản phẩm
        this.quantity = 1;

        // Gọi các API song song cho nhanh
        const [res, reviewRes] = await Promise.all([
          productService.getDetailProduct(id),
          reviewService.getAllReviewByProduct(id),
        ]);

        this.product = res.product || {};
        this.reviews = reviewRes || [];

        // Chỉ gọi gợi ý nếu đã đăng nhập (Interceptor tự đính token)
        if (this.isLoggedIn) {
          const recommendRes = await productService.getProductRecommend();
          this.recommendations = recommendRes.recommendations || [];
        }

        // Set mặc định
        if (this.uniqueColors.length > 0) {
          this.selectedColor = this.uniqueColors[0];
          // Chờ Vue cập nhật uniqueSizes rồi mới set size đầu tiên
          this.$nextTick(() => {
            this.selectedSize = this.uniqueSizes[0];
          });
        }
      } catch (error) {
        console.error("Lỗi load dữ liệu:", error);
      } finally {
        this.isLoading = false;
      }
    },

    calculateSalePrice(basePrice, discount) {
      if (!discount || discount <= 0) return basePrice;
      return basePrice - (basePrice * discount) / 100;
    },

    renderPrice(val) {
      if (!val) return "0đ";
      return val.toLocaleString("vi-VN") + "đ";
    },

    handleSizeChangeColor(color) {
      this.selectedColor = color;
      const match = this.uniqueSizes.find(
        (s) => s.size_name === this.selectedSize?.size_name,
      );
      this.selectedSize = match ? match : this.uniqueSizes[0];
    },

    handleQuantityChange() {
      if (this.quantity < 1) this.quantity = 1;
      if (this.quantity > this.selectedVariant?.quantity) {
        this.quantity = this.selectedVariant.quantity;
      }
    },

    async addProductToCart() {
      if (!this.isLoggedIn) {
        Swal.fire({
          icon: "info",
          text: "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.",
          confirmButtonColor: "#533422",
          showCancelButton: true,
          cancelButtonText: "Để sau",
          confirmButtonText: "Đăng nhập ngay",
        }).then((result) => {
          if (result.isConfirmed) {
            this.$router.push({ name: "Login" });
          }
        });
        return;
      }
      try {
        await cartService.addProduct({
          variant_id: this.selectedVariant._id,
          quantity: this.quantity,
        });

        Swal.fire({
          icon: "success",
          text: `Thêm sản phẩm vào giỏ hàng thành công`,
          timer: 2000,
          showConfirmButton: false,
          position: "center",
        });

        this.cartStore.fetchCount();
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          text: "Đã có lỗi xảy ra vui lòng thử lại sau",
          confirmButtonColor: "#533422",
        });
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString("vi-VN");
    },

    async buyNow() {
      if (!this.isLoggedIn) {
        Swal.fire({
          icon: "warning",
          text: "Bạn cần đăng nhập để tiến hành thanh toán.",
          confirmButtonColor: "#533422",
        });
        this.$router.push({ name: "Login" });
        return;
      }

      const quickBuyData = [
        {
          variant_id: this.selectedVariant._id,
          product_name: this.product.product_name,
          product_id: this.product._id,
          image: this.selectedVariant.image_url,
          color_name: this.selectedColor.color_name,
          size_name: this.selectedSize.size_name,
          price: this.product.base_price,
          discount: this.product.discount,
          quantityInCart: this.quantity,
        },
      ];

      sessionStorage.setItem("quickBuyItem", JSON.stringify(quickBuyData));
      Swal.fire({
        title: "Đang chuẩn bị đơn hàng...",
        timer: 800,
        didOpen: () => {
          Swal.showLoading();
        },
        willClose: () => {
          this.$router.push({ name: "CheckOut", query: { from: "quick" } });
        },
      });
    },
    formatAvatarUrl(url) {
      if (!url) return "";
      if (url.startsWith("http")) {
        return url;
      }
      return "http://localhost:3000/" + url;
    },

    getInitials(name) {
      if (!name) return "D";
      return name.charAt(0).toUpperCase();
    },
  },
  mounted() {
    this.loadData();
  },
  watch: {
    "$route.params.id": function (newId, oldId) {
      if (newId !== oldId) {
        this.loadData();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
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
              :key="img._id"
              class="thumb-box"
              :class="{ active: selectedColor?.color_name === img.color_name }"
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

          <div
            class="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom"
            style="font-size: 0.95rem"
          >
            <div class="d-flex align-items-center text-warning border-end pe-3">
              <span class="me-1 fw-bold text-dark">{{
                product.rating || 0
              }}</span>
              <i class="fa-solid fa-star"></i>
            </div>

            <div class="text-muted">
              <span class="ms-1">Đã bán: </span>
              <span class="text-dark fw-bold">
                {{ selectedVariant ? selectedVariant.sold_count : 0 }}
              </span>
            </div>
          </div>

          <div class="d-flex align-items-center gap-3 mb-4">
            <h2 class="text-danger fw-bold mb-0">
              {{
                renderPrice(
                  calculateSalePrice(product.base_price, product.discount),
                )
              }}
            </h2>

            <template v-if="product.discount > 0">
              <span class="text-muted text-decoration-line-through fs-5">
                {{ renderPrice(product.base_price) }}
              </span>
              <span class="badge bg-danger fs-6">-{{ product.discount }}%</span>
            </template>
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
                  selectedColor.color_name
                }}</span></label
              >
              <div class="d-flex gap-2">
                <button
                  v-for="color in uniqueColors"
                  :key="color.color_name"
                  class="btn variant-btn"
                  :class="
                    selectedColor?.color_name === color.color_name
                      ? 'btn-dark'
                      : 'btn-outline-dark'
                  "
                  @click="handleSizeChangeColor(color)"
                >
                  {{ color.color_name }}
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
                  :key="size.size_name"
                  class="btn variant-btn"
                  :class="
                    selectedSize?.size_name === size.size_name
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
                <span class="text-muted small">Kho: còn </span>
                <strong class="text-success">{{
                  selectedVariant.quantity
                }}</strong>
                <span class="ms-1 small text-muted">sản phẩm</span>
              </div>
              <div v-else class="text-danger fw-bold">
                <i class="fa-solid fa-circle-xmark me-1"></i>HẾT HÀNG
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
                @click="buyNow()"
              >
                <i class="fa-solid fa-bolt me-2"></i> MUA NGAY
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="description px-0 mt-5 mb-4">
        <h3 class="ms-4 pt-4">Mô tả sản phẩm</h3>
        <p
          class="text-muted fs-5 mb-4 px-4 mt-3 pb-4"
          v-html="product.description"
        ></p>
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
        <div class="product-review pb-5">
          <div class="wrap_review mt-4">
            <div
              v-if="filteredReviewsList.length === 0"
              class="text-center py-5 text-muted italic"
            >
              Chưa có đánh giá nào cho sản phẩm này.
            </div>

            <div
              v-for="review in filteredReviewsList"
              :key="review._id"
              class="review-item ms-4 mb-4 border-bottom pb-4"
            >
              <div class="d-flex align-items-start">
                <div class="pe-3">
                  <div
                    class="avartar shadow-sm"
                    :style="
                      !review.user_avatar || review.is_anonymous
                        ? 'background-color: #87593f; color: white;'
                        : ''
                    "
                  >
                    <img
                      v-if="review.user_avatar && !review.is_anonymous"
                      :src="formatAvatarUrl(review.user_avatar)"
                    />

                    <i
                      v-else-if="review.is_anonymous"
                      class="fa-solid fa-user-secret text-secondary"
                    ></i>

                    <span v-else class="fw-bold fs-5">
                      {{ getInitials(review.user_name) }}
                    </span>
                  </div>
                </div>

                <div class="wrap_infor flex-grow-1" style="max-width: 80%">
                  <h6 class="mb-1 fw-bold text-dark">
                    {{
                      review.is_anonymous
                        ? "Người dùng ẩn danh"
                        : review.user_name
                    }}
                  </h6>

                  <div class="d-flex align-items-center gap-3">
                    <StarRating :value="review.rating_score" />
                    <small
                      class="text-muted"
                      style="font-size: 0.75rem; margin-top: 2px"
                    >
                      {{ formatDate(review.created_at) }}
                    </small>
                  </div>

                  <div class="content_review mt-2">
                    {{ review.comment }}
                  </div>

                  <div
                    v-if="review.images && review.images.length"
                    class="d-flex gap-2 mt-3"
                  >
                    <img
                      v-for="(img, index) in review.images"
                      :key="index"
                      :src="'http://localhost:3000/' + img"
                      class="rounded border media-preview shadow-sm"
                    />
                  </div>

                  <div v-if="review.video" class="mt-2">
                    <video
                      :src="'http://localhost:3000/' + review.video"
                      controls
                      class="rounded border media-video"
                    ></video>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="product_recommend row g-3 mt-4"
        v-if="isLoggedIn && recommendations.length > 0"
      >
        <h5 class="mb-2 fw-bold">Gợi ý sản phẩm</h5>

        <div v-for="item in recommendations" :key="item._id" class="col-md-2">
          <router-link
            :to="{ name: 'Detail', params: { id: item._id } }"
            class="text-decoration-none"
          >
            <div
              class="product_item border border-secondary-subtle rounded-3 h-100 pb-2 bg-white position-relative overflow-hidden shadow-sm"
            >
              <div v-if="item.discount > 0" class="discount-badge">
                -{{ item.discount }}%
              </div>

              <img
                :src="'http://localhost:3000/' + item.image_url"
                class="w-100"
                style="height: 180px; object-fit: cover"
              />

              <h6 class="mt-2 mb-1 text-center px-1 text-truncate text-dark">
                {{ item.product_name }}
              </h6>

              <div
                class="d-flex justify-content-between align-items-center px-2 mt-2"
              >
                <div
                  v-if="item.rating > 0"
                  class="rating d-flex align-items-center gap-1"
                >
                  <i
                    class="fa-solid fa-star text-warning"
                    style="font-size: 0.75rem"
                  ></i>
                  <span class="fw-bold text-dark" style="font-size: 0.85rem">
                    {{ item.rating.toFixed(1) }}
                  </span>
                </div>
                <div v-else class="tag-new-small">
                  <span>Mới</span>
                </div>

                <span class="number_sell text-muted" style="font-size: 0.65rem">
                  Đã bán {{ item.count_sell || 0 }}
                </span>
              </div>

              <div class="price_and_number_sell mt-1 px-2">
                <span
                  class="price fw-bold text-danger"
                  style="font-size: 0.95rem"
                >
                  {{
                    renderPrice(
                      calculateSalePrice(item.base_price, item.discount),
                    )
                  }}
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <my_footer></my_footer>
  </div>
</template>

<style scoped>
/* Variant Buttons */
.variant-btn {
  min-width: 60px;
  border-radius: 8px;
  transition: 0.2s;
}

/* Thumbs */
.thumb-box {
  width: 80px;
  height: 80px;
  cursor: pointer;
  transition: 0.3s;
  opacity: 0.6;
}
.thumb-box.active {
  opacity: 1;
  transform: scale(1.1);
}
.thumb-box.active img {
  border: 2px solid #533422 !important;
}
.thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Sections Background */
.product-review,
.description {
  background-color: #f6f2ef;
  border-radius: 8px;
}

/* Filter Review */
.wrap_filter_review {
  border: 1px #533422 solid;
  background-color: #fdeee5;
}
.filter_review {
  padding: 6px 25px;
  border: 1px #ccc solid;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  background-color: #fff;
  transition: 0.3s;
}
.select_filter.filter_review {
  border-color: #533422;
  background-color: #87593f;
  color: #fff;
}

/* Review Item & Border Fix */
.review-item {
  margin-right: 3rem; /* Để đường kẻ border-bottom nằm gọn bên trong */
}

/* AVARTAR FIX - Quan trọng nhất */
.avartar {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  background-color: #eee;
  flex-shrink: 0;
  border: 1px solid #ddd;
}
.avartar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

/* Nội dung bình luận */
.content_review {
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  text-align: justify;
  color: #333;
  line-height: 1.6;
}

/* Media đính kèm */
.media-preview {
  width: 75px;
  height: 75px;
  object-fit: cover;
  cursor: zoom-in;
}
.media-video {
  width: 160px;
  height: 100px;
  object-fit: cover;
}

/* Khác */
.description {
  white-space: pre-line;
  text-align: justify;
}

.product_item {
  transition: all 0.3s ease;
}

.product_item:hover {
  transform: translateY(-5px);
  border-color: #533422 !important;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
  z-index: 1;
}

.price {
  color: #f00;
}
.discount {
  position: absolute;
  top: 0;
  right: 0;
  color: #f00;
  background-color: rgb(251, 196, 196);
  padding: 0 4px;
}
.italic {
  font-style: italic;
}

.tag-new-small {
  background-color: #533422;
  color: #ffffff;
  padding: 1px 8px;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: inline-block;
}

.product_item {
  cursor: pointer;
  transition: all 0.3s ease;
}
.product_item:hover {
  transform: translateY(-5px);
  border-color: #533422 !important;
  box-shadow: 0 8px 15px rgba(83, 52, 34, 0.2) !important;
}
</style>
