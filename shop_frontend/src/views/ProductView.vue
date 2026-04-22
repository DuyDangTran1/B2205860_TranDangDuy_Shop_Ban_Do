<script>
import myheader from "@/components/header.vue";
import myfooter from "@/components/footer.vue";
import productService from "@/services/product.service";
import categoryService from "@/services/category.service";
import { RouterLink } from "vue-router";
import Loading from "@/components/Loading.vue";
export default {
  components: {
    myfooter,
    myheader,
    Loading,
  },

  data() {
    return {
      categoryTree: {},
      rootName: "",
      products: {},
      isLoading: true,
      level2: [],
      level3: {},
      activeCategory: null,
      discount_list: [
        { category_name: "Giảm giá lên đến 70%" },
        { category_name: "Giảm giá đến 50%" },
        { category_name: "Giảm giá đến 30%" },
      ],
      option: ["Mới nhất", "Giá tăng dần", "Giá giảm dần"],
      activeOption: "Mới nhất",
      about_price: [],
      activeBrand: [],
      isShowTick: null,
      query: "",
    };
  },

  computed: {
    currentPage() {
      return parseInt(this.$route.query.page) || 1;
    },
  },

  methods: {
    handleShowLevel3(key) {
      this.activeCategory = this.activeCategory === key ? null : key;
    },

    handleSelectOption(value) {
      this.activeOption = value;
    },

    buildQuery() {
      let queryArr = [];
      queryArr.push(`page=${this.currentPage}`);
      if (this.activeOption === "Mới nhất") queryArr.push("created=-1");
      else if (this.activeOption === "Giá giảm dần")
        queryArr.push("base_price=-1");
      else if (this.activeOption === "Giá tăng dần")
        queryArr.push("base_price=1");
      const priceVal = this.about_price[0];
      if (priceVal === "Dưới 200") queryArr.push("price_max=200");
      else if (priceVal === "200-400")
        queryArr.push("price_min=200&price_max=400");
      else if (priceVal === "<500") queryArr.push("price_max=500");
      else if (priceVal === "500-1000")
        queryArr.push("price_min=500&price_max=1000");

      if (this.activeBrand.length > 0) {
        const encodedBrand = encodeURIComponent(this.activeBrand);
        queryArr.push(`brand=${encodedBrand}`);
      }

      return queryArr.join("&");
    },

    async loadCategoryData() {
      try {
        const slug = this.$route.params.slug;
        const res = await categoryService.getCategoryTree(slug);
        if (res && res.tree && res.tree.length > 0) {
          const rootData = res.tree[0];
          const allChildren = rootData.Tree;
          allChildren.sort((a, b) =>
            a.category_name.localeCompare(b.category_name),
          );
          this.rootName = rootData.category_name;
          this.level2 = allChildren.filter(
            (c) => c.parent_name === this.rootName,
          );
          this.level3 = this.level2.reduce((acc, parent) => {
            acc[parent.category_name] = allChildren.filter(
              (c) => c.parent_name === parent.category_name,
            );
            return acc;
          }, {});
          this.level3["Danh mục sale"] = this.discount_list;
        }
      } catch (error) {
        console.error("Lỗi load cây danh mục:", error);
      }
    },

    calculateSalePrice(basePrice, discount) {
      if (!discount || discount <= 0) return basePrice;
      return basePrice - (basePrice * discount) / 100;
    },
    renderPrice(val) {
      return val.toLocaleString("vi-VN") + "đ";
    },
    async loadOnlyProducts() {
      try {
        this.isLoading = true;
        const slug = this.$route.params.slug;
        this.query = this.buildQuery();
        const resProducts = await productService.getProductBySlug(
          slug,
          this.query,
        );
        this.products = resProducts;
      } catch (error) {
        console.error("Lỗi lọc sản phẩm:", error);
      } finally {
        this.isLoading = false;
      }
    },
  },
  mounted() {
    this.loadCategoryData();
    this.loadOnlyProducts();
  },

  watch: {
    "$route.params.slug": function () {
      this.loadCategoryData();
      this.loadOnlyProducts();
    },
    activeOption: function () {
      this.loadOnlyProducts();
    },
    about_price: function (about_price) {
      if (about_price.length > 1) {
        this.about_price = [about_price[about_price.length - 1]];
        return;
      }
      this.loadOnlyProducts();
    },
    currentPage: function () {
      this.loadOnlyProducts();
    },
    activeBrand: function (brands) {
      if (brands.length > 1) {
        this.activeBrand = [brands[brands.length - 1]];
        return;
      }
      this.loadOnlyProducts();
    },
  },
};
</script>

<template>
  <loading :isLoading="isLoading"></loading>
  <div class="container-fluid p-0">
    <myheader></myheader>
    <div class="banner">
      <img
        class="w-100"
        src="https://i.pinimg.com/1200x/82/6b/27/826b2783cefcfc9854e874e7fcaced4e.jpg"
        alt=""
      />
    </div>
  </div>

  <div v-if="!isLoading">
    <div class="container-fluid p-0">
      <div class="container-fluid px-lg-5 mt-5">
        <div class="row g-4">
          <div class="col-lg-3 d-none d-lg-block">
            <div class="filter-group mb-4">
              <h5 class="fw-bold mb-3 mt-2">DANH MỤC</h5>
              <ul class="list-unstyled sidebar-link level-2">
                <li
                  v-on:click="handleShowLevel3(key)"
                  class="fs-5"
                  v-for="(value, key) in level3"
                  :key="key"
                >
                  {{ key }}
                  <i
                    :class="
                      activeCategory !== key
                        ? 'fa-solid fa-chevron-down'
                        : 'fa-solid fa-chevron-up'
                    "
                  ></i>

                  <ul
                    class="list-unstyled ms-4 list-category"
                    :class="activeCategory == key ? 'show' : ''"
                  >
                    <li
                      class="fs-6"
                      v-for="category in value"
                      :key="category._id"
                    >
                      <router-link
                        class="router-link"
                        :to="{
                          name: 'category',
                          params: { slug: category.slug },
                        }"
                      >
                        {{ category.category_name }}
                      </router-link>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>

            <div class="filter-group">
              <h5 class="fw-bold mb-3">KHOẢNG GIÁ</h5>
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="price1"
                  value="Dưới 200"
                  v-model="about_price"
                />
                <label class="form-check-label fs-5" for="price1"
                  >Dưới 200.000đ</label
                >
              </div>
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="price2"
                  value="200-400"
                  v-model="about_price"
                />
                <label class="form-check-label fs-5" for="price2"
                  >Từ 200.000đ - 400.000đ</label
                >
              </div>
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="price3"
                  value="<500"
                  v-model="about_price"
                />
                <label class="form-check-label fs-5" for="price3"
                  >Dưới 500.000đ</label
                >
              </div>
              <div class="form-check mb-2">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="price4"
                  value="500-1000"
                  v-model="about_price"
                />
                <label class="form-check-label fs-5" for="price4"
                  >500.000đ - 1.000.000đ</label
                >
              </div>
            </div>

            <!--Thương hiệu-->
            <div class="filter-group mt-4">
              <h5 class="fw-bold mb-3">Thương hiệu</h5>
              <div
                v-if="products.brands.length > 0"
                class="form-check mb-2"
                v-for="value in products.brands"
                :key="value._id"
              >
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="value._id"
                  :value="value._id"
                  v-model="activeBrand"
                />
                <label class="form-check-label fs-5" :for="value._id">{{
                  value._id
                }}</label>
              </div>
            </div>
          </div>

          <div class="col-lg-9">
            <div
              class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom"
            >
              <h4 class="fw-bold mb-0">{{ products.category_name }}</h4>
              <div class="select">
                <span>{{ activeOption }} </span>
                <i class="fa-solid fa-chevron-down"></i>
                <ul class="list-unstyled options">
                  <li
                    v-for="value in option"
                    :key="value"
                    v-on:click="handleSelectOption(value)"
                    v-on:mouseenter="isShowTick = value"
                    v-on:mouseleave="isShowTick = null"
                  >
                    <span>{{ value }}</span>
                    <i
                      class="fa-solid fa-check"
                      :class="isShowTick == value ? 'show_tick' : ''"
                    ></i>
                  </li>
                </ul>
              </div>
            </div>

            <div
              v-if="products.products && products.products.length > 0"
              class="row g-2"
            >
              <div
                class="col-xl-3 col-lg-4 col-md-6"
                v-for="item in products.products"
                :key="item._id"
              >
                <router-link
                  class="router-link"
                  :to="{ name: 'Detail', params: { id: item._id } }"
                >
                  <div class="product_item rounded-1 pb-2 mb-4">
                    <div v-if="item.discount > 0" class="discount">
                      <span class="fw-bold">-{{ item.discount }}%</span>
                    </div>

                    <img
                      :src="'http://localhost:3000/' + item.image_url"
                      alt=""
                      class="w-100"
                    />

                    <h5 class="mt-2 mb-1 text-center px-1 text-truncate">
                      {{ item.product_name }}
                    </h5>

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
                        <span
                          class="fw-bold text-dark"
                          style="font-size: 0.85rem"
                        >
                          {{ item.rating.toFixed(1) }}
                        </span>
                      </div>

                      <div v-else class="tag-new">
                        <span>Mới</span>
                      </div>
                    </div>

                    <div
                      class="price_and_number_sell mt-2 px-2 d-flex align-items-center justify-content-between"
                    >
                      <div class="d-flex align-items-center flex-wrap">
                        <span
                          class="price fw-bold me-2"
                          style="font-size: 1.1rem"
                        >
                          {{
                            renderPrice(
                              calculateSalePrice(
                                item.base_price,
                                item.discount,
                              ),
                            )
                          }}
                        </span>

                        <span
                          v-if="item.discount > 0"
                          class="text-muted text-decoration-line-through small"
                          style="font-size: 0.8rem"
                        >
                          {{ renderPrice(item.base_price) }}
                        </span>
                      </div>

                      <span
                        class="number_sell text-muted"
                        style="font-size: 0.75rem"
                      >
                        Đã bán: {{ item.count_sell }}
                      </span>
                    </div>

                    <div class="add-cart text-center mb-2 mt-2">
                      <button type="button">Thêm vào giỏ hàng</button>
                    </div>
                  </div>
                </router-link>
              </div>
            </div>

            <div
              v-if="!products.products || products.products.length == 0"
              class="text-center mt-5"
            >
              <span> Không có sản phẩm nào được tìm thấy </span>
            </div>

            <nav
              class="mt-5"
              v-if="products.products && products.products.length !== 0"
            >
              <ul class="pagination justify-content-center">
                <li
                  class="page-item"
                  :class="currentPage == 1 ? 'disabled' : ''"
                >
                  <router-link
                    class="page-link"
                    :to="{
                      name: 'category',
                      params: { slug: $route.params.slug },
                      query: { page: currentPage - 1 },
                    }"
                    >Trước</router-link
                  >
                </li>
                <li
                  v-for="page in products.count_page"
                  class="page-item"
                  :class="currentPage == page ? 'active' : ''"
                >
                  <router-link
                    class="page-link"
                    :to="{
                      name: 'category',
                      params: { slug: $route.params.slug },
                      query: { page: page },
                    }"
                    >{{ page }}</router-link
                  >
                </li>
                <li
                  class="page-item"
                  :class="currentPage == products.count_page ? 'disabled' : ''"
                >
                  <router-link
                    class="page-link"
                    :to="{
                      name: 'category',
                      params: { slug: $route.params.slug },
                      query: { page: currentPage + 1 },
                    }"
                    >Sau</router-link
                  >
                </li>
              </ul>
            </nav>
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
  color: #533422;
}

.banner img {
  height: 100vh;
}

.level-2 i {
  font-size: 0.8rem;
}

.level-2 li {
  cursor: pointer;
}

.select {
  position: relative;
  max-width: 200px;
  width: 200px;
  display: inline-flex;
  justify-content: space-between;
  padding: 12px 12px;
  background-color: #fff;
  border: 1px solid #533422;
  border-radius: 6px;
}

.select > i {
  transform: translateY(15%);
}

.select .options {
  display: none;
  position: absolute;
  padding: 12px 12px;
  width: 100%;
  left: 0;
  bottom: 0;
  transform: translateY(116%);
  background-color: #fff;
  border: 1px solid #533422;
  border-radius: 6px;
  z-index: 1000;
}

.select:hover .options {
  display: block;
}

.options li {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.options i {
  display: none;
  color: #f00;
}

.options i.show_tick {
  display: block;
}

.list-category {
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.3s ease;
  opacity: 0;
  display: block;
}

.list-category.show {
  max-height: 500px;
  opacity: 1;
  margin-top: 5px;
}

.product_item {
  position: relative;
  overflow: hidden;
  border: 1px solid #e9e9e9 !important;
  background-color: #fff;
  transition: all 0.3s ease-in-out;
}

.product_item img {
  width: 100%;
  height: 360px;
}

.product_item:hover {
  border-color: #533422 !important;
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 10px 20px rgba(83, 52, 34, 0.15);
  z-index: 10;
}

.product_item span {
  font-size: 0.9rem;
}

.price_and_number_sell {
  display: flex;
  justify-content: space-between;
}

.price_and_number_sell span {
  font-size: 0.9rem;
}

.price {
  color: #ee4d2d;
  font-size: 1.1rem !important;
}

.tag-new {
  background-color: #533422;
  color: #ffffff;
  padding: 2px 12px;
  border-radius: 2px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 1px solid #533422;
  display: inline-block;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating i {
  color: #ffc107;
  font-size: 0.8rem;
}

.rating span {
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
}

.add-cart button {
  width: 90%;
  padding: 10px;
  background-color: #f8f1ed;
  color: #533422;
  border: 1px solid #533422;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  transition: all 0.4s ease;
}

.add-cart button:hover {
  background-color: #533422;
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(83, 52, 34, 0.3);
}

.discount {
  padding: 3px 8px;
  position: absolute;
  top: 0;
  right: 0;
  color: #fff;
  background-color: #f00;
  font-weight: bold;
  font-size: 0.8rem;
  border-bottom-left-radius: 12px;
  box-shadow: -2px 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.bg-danger-subtle {
  background-color: #fff1f0 !important;
  border: 1px solid #ffa39e;
}

.pagination .page-link {
  color: #533422;
  background-color: #fff;
  border-color: #533422;
  transition: all 0.3s ease;
}

.pagination .page-link:hover {
  background-color: #f8f1ed;
  color: #533422;
  border-color: #533422;
  z-index: 2;
}

.pagination .page-item.active .page-link {
  background-color: #533422 !important;
  border-color: #533422 !important;
  color: #fff !important;
}

.pagination .page-item.disabled .page-link {
  color: #6c757d;
  background-color: #fff;
  border-color: #dee2e6;
  opacity: 0.6;
}

.pagination .page-link:focus {
  box-shadow: 0 0 0 0.25rem rgba(83, 52, 34, 0.25);
}

/* Hiệu ứng trượt */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: transform 0.1s translate(-50%, 100%);
}

.variant-img-wrapper img {
  width: 80px;
  height: 80px;
  object-fit: cover;
}

.btn-option {
  padding: 6px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-option.active {
  border-color: #533422;
  color: #533422;
  background: #fdf8f5;
}

.qty-selector {
  border: 1px solid #ddd;
  border-radius: 4px;
}
.qty-selector button {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
}
.qty-selector input {
  width: 40px;
  border: none;
  text-align: center;
  font-size: 0.9rem;
}

.btn-confirm {
  background: #533422;
  color: #fff;
  border: none;
  padding: 12px;
  font-weight: bold;
  border-radius: 8px;
}
.btn-confirm:disabled {
  background: #ccc;
}

@media (min-width: 992px) {
  .quick-select-drawer {
    left: 50%;
    transform: translateX(-50%);
    height: 45vh;
    width: 50vw;
    max-width: none;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translate(-50%, 100%);
  }
}
</style>
