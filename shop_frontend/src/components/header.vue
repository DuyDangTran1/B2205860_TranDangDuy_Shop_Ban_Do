<script>
import userService from "@/services/user.service";
import Chat from "@/components/Chat.vue";
import productService from "@/services/product.service";
import categoryService from "@/services/category.service";
import collectionService from "@/services/collection.service";
import { useCartStore } from "@/stores/cartStore";
export default {
  components: {
    Chat,
  },
  setup() {
    const cartStore = useCartStore();
    return { cartStore };
  },
  data() {
    return {
      isShowMega: false,
      accessToken: sessionStorage.getItem("accessToken") || null,
      user: {},
      name: sessionStorage.getItem("name"),
      isChatOpen: false,
      products: null,
      searchKeyword: "",
      searchResults: [],
      menuTree: [],
    };
  },

  methods: {
    async loadData() {
      try {
        if (this.accessToken) {
          this.user = (await userService.me()).user_information || {};

          if (Object.keys(this.user).length > 0) {
            sessionStorage.setItem("user", JSON.stringify(this.user));
          }
        }

        const [prodRes, catRes, collRes] = await Promise.all([
          productService.getAllProduct(),
          categoryService.getAllCategory(),
          collectionService.getAll(),
        ]);

        // Gán danh sách sản phẩm
        this.products = prodRes?.products || [];

        // Gán danh sách Categories
        const allCats = catRes?.categories || [];

        // Gán danh sách Bộ sưu tập
        const allColls = collRes?.collections || [];

        const mainGroups = [
          "Thời trang nam",
          "Thời trang nữ",
          "Trẻ em",
          "Phụ kiện",
        ];

        const tree = mainGroups.map((groupName) => {
          const root = allCats.find(
            (c) => c.category_name.toLowerCase() === groupName.toLowerCase(),
          );
          const leafCategories = allCats.filter((cat) => {
            const parent = allCats.find(
              (c) => c.category_name === cat.parent_name,
            );
            return parent && parent.parent_name === groupName;
          });

          return {
            _id: root?._id || Math.random(),
            name: groupName,
            children: leafCategories,
            isCollection: false,
          };
        });

        if (allColls.length > 0) {
          tree.push({
            _id: "collection-root",
            name: "Bộ sưu tập HOT",
            isCollection: true,
            children: allColls.slice(0, 8).map((c) => ({
              _id: c._id,
              category_name: c.collection_name,
              slug: null,
            })),
          });
        }

        this.menuTree = tree;
      } catch (error) {
        console.log(error);
      }
    },

    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    },

    handleSearch() {
      if (!this.searchKeyword.trim()) {
        this.searchResults = [];
        return;
      }

      this.searchResults = this.products?.filter((p) =>
        p.product_name.toLowerCase().includes(this.searchKeyword.toLowerCase()),
      );
    },

    async logOut() {
      try {
        await userService.logOut();
      } catch (error) {
        console.log(error);
      } finally {
        sessionStorage.clear();
        this.$router.push({ name: "Login" });
      }
    },
  },

  async mounted() {
    this.loadData();
    if (this.accessToken) {
      console.log("Đang gọi fetchCount từ Store...");
      await this.cartStore.fetchCount();
    }
  },
};
</script>
<template>
  <nav class="sticky-top navbar navbar-expand-lg navbar-light nav">
    <div class="container-fluid">
      <!-- <div class="ms-5"></div> -->
      <a class="navbar-brand fw-bold title ms-5 text-white" href="#">SHOPDD</a>

      <div
        class="collapse navbar-collapse justify-content-between"
        id="navbarSupportedContent"
      >
        <ul class="navbar-nav mb-2 mb-lg-0 gap-4">
          <li class="nav-item mr-4">
            <RouterLink
              class="nav-link active pl-5 text-white"
              :to="{ name: 'Home' }"
              >Trang chủ</RouterLink
            >
          </li>

          <li class="nav-item mr-4" @mouseleave="isShowMega = false">
            <a
              class="nav-link dropdown-toggle products text-white"
              href="#"
              @mouseenter="isShowMega = true"
            >
              Sản phẩm
            </a>
          </li>

          <li class="nav-item mr-4">
            <RouterLink class="nav-link text-white" :to="{ name: 'About' }"
              >Giới thiệu</RouterLink
            >
          </li>
        </ul>

        <div class="ms-auto d-flex align-items-center gap-3">
          <div class="search-container position-relative">
            <form style="max-width: 250px; width: 250px">
              <input
                v-model="searchKeyword"
                @input="handleSearch"
                class="form-control me-2 bg-transparent text-white search-input shadow-none"
                type="search"
                placeholder="Tìm kiếm sản phẩm"
              />
            </form>

            <div v-if="searchResults.length" class="search-dropdown shadow-lg">
              <div
                v-for="product in searchResults"
                :key="product._id"
                class="search-item"
              >
                <router-link
                  class="router-link d-flex align-items-center gap-3 w-100 text-dark text-decoration-none"
                  :to="{ name: 'Detail', params: { id: product._id } }"
                >
                  <div class="search-item-img">
                    <img
                      :src="`http://localhost:3000/${product.image_url}`"
                      width="40"
                      class="rounded"
                    />
                  </div>
                  <div
                    class="product-name-mini text-truncate"
                    style="max-width: 150px"
                  >
                    {{ product.product_name }}
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <div class="d-flex align-items-center gap-3">
            <router-link
              :to="{ name: 'Cart' }"
              class="text-white pt-1 position-relative"
            >
              <i class="fa-solid fa-cart-shopping fs-3 cart"></i>
              <span v-if="cartStore.count > 0" class="cart-badge shadow-sm">
                {{ cartStore.count > 99 ? "99+" : cartStore.count }}
              </span>
            </router-link>

            <div class="chatbot-icon" @click="toggleChat">
              <i class="fa-solid fa-comments fs-5"></i>
            </div>
          </div>

          <div v-if="!accessToken" class="d-flex align-items-center gap-2">
            <router-link
              :to="{ name: 'Login' }"
              class="btn_auth text-decoration-none"
            >
              Đăng nhập
            </router-link>
            <router-link
              :to="{ name: 'Register' }"
              class="btn_auth text-decoration-none"
            >
              Đăng kí
            </router-link>
          </div>

          <div
            v-else
            class="d-flex align-items-center avatar-wrapper ms-0"
            data-bs-toggle="dropdown"
          >
            <div class="avatar me-1">
              <img
                :src="
                  !user.image_url
                    ? '/images/avatar_default/avatar_default.jpg'
                    : user.image_url.startsWith('http')
                      ? user.image_url
                      : 'http://localhost:3000/' + user.image_url
                "
                alt="Profile"
              />
            </div>

            <i class="bi bi-caret-down-fill"></i>
            <ul class="dropdown-menu dropdown-menu-end shadow">
              <li>
                <a
                  class="dropdown-item"
                  href="javascript:void(0)"
                  @click="$router.push({ name: 'Profile' })"
                >
                  Hồ sơ cá nhân
                </a>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <router-link class="dropdown-item">
                  Sản phẩm yêu thích
                </router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <a
                  class="dropdown-item"
                  href="javascript:void(0)"
                  @click="$router.push({ name: 'OrderHistory' })"
                >
                  Lịch sử mua hàng
                </a>
              </li>

              <li><hr class="dropdown-divider" /></li>
              <li>
                <button v-on:click="logOut()" class="dropdown-item text-danger">
                  Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </div>
        <!-- mega menu của sản phẩm -->
        <div
          class="menu_products shadow-lg"
          @mouseenter="isShowMega = true"
          @mouseleave="isShowMega = false"
          v-show="isShowMega"
        >
          <div class="container">
            <div class="row">
              <div
                v-for="group in menuTree"
                :key="group._id"
                class="col-3 text-start px-4 border-end last-child-no-border"
              >
                <p class="fw-bold text-uppercase mb-3 group-title">
                  {{ group.name }}
                </p>

                <div class="category-list">
                  <router-link
                    v-for="sub in group.children"
                    :key="sub._id"
                    :to="
                      group.isCollection
                        ? {
                            name: 'CollectionProducts',
                            params: { id: sub._id },
                          }
                        : { name: 'category', params: { slug: sub.slug } }
                    "
                    class="d-block text-decoration-none text-muted mb-2 sub-item"
                  >
                    <i
                      v-if="group.isCollection"
                      class="fa-solid fa-fire me-1 text-danger"
                      style="font-size: 0.7rem"
                    ></i>
                    {{ sub.category_name }}
                  </router-link>

                  <span
                    v-if="group.children.length === 0"
                    class="text-muted small italic"
                  >
                    Đang cập nhật...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="d-flex align-items-center">
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <span class="name me-5 text-white">{{ name }}</span>
      </div>
    </div>
  </nav>
  <Chat v-if="isChatOpen" @close="isChatOpen = false" />
</template>
<style scoped>
.router-link {
  text-decoration: none !important;
  color: inherit;
  display: flex;
}

.nav {
  position: relative;
  background-color: #533422;
}

.title {
  margin-right: 8%;
}
.btn_auth {
  padding: 5px 10px;
  margin-left: 5px;
  border: 1px solid #ced4de;
  border-radius: 8px;
  color: #000;
  background-color: #fff;
}

.btn_auth:hover {
  color: #fff;
  background-color: #ac7657;
}

.menu_products {
  width: 80vw;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #fff;
  padding: 40px 0;
  z-index: 1000;
  border-top: 1px solid #eee;
}

.group-title {
  color: #533422;
  font-size: 1rem;
  letter-spacing: 1px;
  border-bottom: 2px solid #ac7657;
  display: inline-block;
  padding-bottom: 5px;
}

.sub-item {
  font-size: 0.9rem;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.sub-item:hover {
  color: #ac7657 !important;
}

.menu_products::before {
  content: "";
  position: absolute;
  top: -15px;
  left: 0;
  right: 0;
  height: 15px;
}

input::placeholder {
  color: white !important;
  opacity: 0.8;
}

.avatar {
  width: 50px;
  height: 50px;
  margin-right: 20px;
}

.avatar img {
  width: 100%;
  border-radius: 999px;
}

.avatar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.avatar {
  width: 50px;
  height: 50px;
  border: 2px solid rgba(83, 52, 34, 0.7);
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.3s ease;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-wrapper i {
  position: absolute;
  /* display: inline-block;  */
  width: 14px; /* Set cứng kích thước cho nó */
  height: 14px;
  bottom: -3px;
  right: 9px;
  color: #fff;
  z-index: 1999 !important;
}

.dropdown-item {
  padding: 8px 16px;
}

.dropdown-item:hover {
  background-color: #ac7657 !important;
  color: white !important;
  transition: all 0.2s ease;
}

.dropdown-menu {
  padding: 0;
  margin: 0;
  border: none;
}

.dropdown-divider {
  margin: 0;
}

.cart {
  color: #ac7657;
}

.chatbot-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ac7657;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chatbot-icon i {
  color: white;
}

.chatbot-icon:hover {
  transform: scale(1.1);
  background: #8d5f45;
}
/* Style cho ô input tìm kiếm */
.search-input {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 8px 15px;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #ac7657;
  box-shadow: 0 0 8px rgba(172, 118, 87, 0.5);
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  width: 100%;
  min-width: 250px;
  max-height: 350px;
  overflow-y: auto;
  border-radius: 12px;
  padding: 5px 0;
  z-index: 9999;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.search-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f9f9f9;
}

.search-item:last-child {
  border-bottom: none;
}

.search-item:hover {
  background: #f8f5f2;
}

/* Ảnh nhỏ trong tìm kiếm */
.search-item-img {
  width: 45px;
  height: 45px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f0f0f0;
}

.search-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-name-mini {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  /* Giới hạn 2 dòng cho tên dài */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-dropdown::-webkit-scrollbar {
  width: 5px;
}
.search-dropdown::-webkit-scrollbar-thumb {
  background: #ac7657;
  border-radius: 10px;
}
.cart-badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background-color: #ff4d4d;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  border: 2px solid #533422;
}
</style>
