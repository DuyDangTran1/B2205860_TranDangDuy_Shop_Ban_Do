<script>
import StarRating from "@/components/StarRating.vue";
import my_footer from "@/components/footer.vue";
import my_header from "@/components/header.vue";
export default {
  components: {
    StarRating,
    my_footer,
    my_header,
  },
  data() {
    return {
      // DỮ LIỆU SẢN PHẨM
      product: {
        _id: "6598f1b2c9e3a12345678901",
        name: "Áo Polo Nam Classic Cotton",
        base_price: 350000,
        double_discount: 20,
        material: "95% Cotton, 5% Spandex",
        description:
          "Áo Polo nam thiết kế cơ bản, chất vải co giãn 4 chiều, thấm hút mồ hôi cực tốt. Phù hợp cho cả đi làm và đi chơi.",
        variants: [
          {
            color: "Trắng",
            size: "M",
            quantity: 50,
            url_image:
              "https://i.pinimg.com/736x/2f/fd/59/2ffd59518dfa59755f78b272be6862b6.jpg",
          },
          {
            color: "Trắng",
            size: "L",
            quantity: 35,
            url_image:
              "https://i.pinimg.com/736x/2f/fd/59/2ffd59518dfa59755f78b272be6862b6.jpg",
          },
          {
            color: "Đen",
            size: "M",
            quantity: 20,
            url_image:
              "https://i.pinimg.com/736x/20/0f/73/200f73f272a39626219463991873f915.jpg",
          },
          {
            color: "Đen",
            size: "L",
            quantity: 0,
            url_image:
              "https://i.pinimg.com/736x/20/0f/73/200f73f272a39626219463991873f915.jpg",
          },
          {
            color: "Trắng",
            size: "XL",
            quantity: 35,
            url_image:
              "https://i.pinimg.com/736x/2f/fd/59/2ffd59518dfa59755f78b272be6862b6.jpg",
          },
        ],
        tag: ["polo", "áo nam", "thời trang hè"],
      },
      // TRẠNG THÁI LỰA CHỌN
      selectedColor: "Trắng",
      selectedSize: "M",
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
    };
  },
  computed: {
    // 1. Lọc danh sách màu duy nhất
    uniqueColors() {
      return [...new Set(this.product?.variants?.map((v) => v.color))];
    },
    // 2. Lọc danh sách size duy nhất
    uniqueSizes() {
      return [
        ...new Set(
          this.product?.variants
            ?.filter((v) => v.color === this.selectedColor)
            .map((v) => v.size)
        ),
      ];
    },
    // 3. Tìm variant đang được chọn (Dùng Optional Chaining ?. để chống crash)
    selectedVariant() {
      return this.product?.variants?.find(
        (v) => v.color === this.selectedColor && v.size === this.selectedSize
      );
    },
    // 4. Lấy list ảnh đại diện theo màu
    colorImages() {
      const images = [];
      const map = new Map();
      const variants = this.product?.variants || [];
      for (const item of variants) {
        if (!map.has(item.color)) {
          map.set(item.color, true);
          images.push({ color: item.color, url: item.url_image });
        }
      }
      return images;
    },
  },
};
</script>

<template>
  <my_header></my_header>
  <div v-if="product && product.variants" class="container mt-5 mb-5 text-dark">
    <div class="row g-5 mt-5">
      <div class="col-md-6">
        <div class="main-image-container mb-3">
          <img
            :src="
              selectedVariant?.url_image || 'https://via.placeholder.com/600'
            "
            class="img-fluid rounded-4 shadow-sm w-100"
            style="height: 600px; object-fit: cover"
          />
        </div>

        <div class="d-flex gap-3 justify-content-center">
          <div
            v-for="img in colorImages"
            :key="img.color"
            class="thumb-box"
            :class="{ active: selectedColor === img.color }"
            @click="selectedColor = img.color"
          >
            <img :src="img.url" class="rounded-3 border" />
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <a href="#" class="text-decoration-none text-muted">Trang chủ</a>
            </li>
            <li class="breadcrumb-item active">{{ product.tag[1] }}</li>
          </ol>
        </nav>

        <h1 class="fw-bold display-6 mb-3">{{ product.name }}</h1>

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
            <i class="fa-solid fa-truck-fast me-2"></i> Miễn phí vận chuyển đơn
            hàng từ 500k
          </div>
        </div>

        <div class="selection-area p-4 rounded-4 bg-light">
          <div class="mb-4">
            <label class="fw-bold mb-2 d-block"
              >MÀU SẮC:
              <span class="text-primary">{{ selectedColor }}</span></label
            >
            <div class="d-flex gap-2">
              <button
                v-for="color in uniqueColors"
                :key="color"
                class="btn variant-btn"
                :class="
                  selectedColor === color ? 'btn-dark' : 'btn-outline-dark'
                "
                @click="selectedColor = color"
              >
                {{ color }}
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="fw-bold mb-2 d-block"
              >KÍCH CỠ:
              <span class="text-primary">{{ selectedSize }}</span></label
            >
            <div class="d-flex gap-2">
              <button
                v-for="size in uniqueSizes"
                :key="size"
                class="btn variant-btn"
                :class="selectedSize === size ? 'btn-dark' : 'btn-outline-dark'"
                @click="selectedSize = size"
              >
                {{ size }}
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
              <i class="fa-solid fa-circle-xmark me-1"></i> XIN LỖI, SẢN PHẨM
              NÀY ĐÃ HẾT HÀNG!
            </div>
          </div>

          <div class="row gap-2">
            <button
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
        {{ product.description }}
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

  <div
    v-else
    class="vh-100 d-flex flex-column justify-content-center align-items-center"
  >
    <div class="spinner-grow text-primary" role="status"></div>
    <p class="mt-3 fw-bold">Đang tải vương quốc thời trang...</p>
  </div>

  <my_footer></my_footer>
</template>

<style scoped>
.variant-btn {
  min-width: 60px;
  border-radius: 8px;
  transition: 0.2s;
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
