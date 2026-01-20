<script setup>
import { ref } from "vue";
const isShowMega = ref(false);
</script>
<template>
  <nav class="fixed-top navbar navbar-expand-lg navbar-light nav">
    <div class="container-fluid">
      <!-- <div class="ms-5"></div> -->
      <a class="navbar-brand fw-bold title ms-5 text-white" href="#">SHOPDD</a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div
        class="collapse navbar-collapse justify-content-between"
        id="navbarSupportedContent"
      >
        <ul class="navbar-nav mb-2 mb-lg-0 gap-4">
          <li class="nav-item mr-4">
            <a class="nav-link active pl-5 text-white" href="#">Trang chủ</a>
          </li>

          <li class="nav-item mr-4" @mouseleave="isShowMega = false">
            <a
              class="nav-link dropdown-toggle products text-white"
              href="#"
              @mouseenter="isShowMega = true"
            >
              Sản phẩm
            </a>
            <div
              class="menu_products text-center"
              v-show="isShowMega"
              @mouseenter="isShowMega = true"
            ></div>
          </li>

          <li class="nav-item mr-4">
            <a class="nav-link text-white" href="#">Giới thiệu</a>
          </li>
        </ul>

        <div class="ms-auto d-flex align-items-center">
          <form class="">
            <input
              class="form-control me-2 bg-transparent text-white"
              type="search"
              placeholder="Search"
            />
          </form>
          <button class="btn_auth ms-3">Đăng nhập</button>
          <button class="btn_auth me-5">Đăng kí</button>
        </div>

        <!-- mega menu của sản phẩm -->
        <div
          class="menu_products text-center"
          @mouseenter="isShowMega = true"
          @mouseleave="isShowMega = false"
          v-show="isShowMega"
        >
          <div class="row">
            <div class="col-3">
              <p>Nam</p>
              <div class="image">
                <img
                  src="data:image/jpeg;base64,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"
                />
              </div>
              <p>Áo thun</p>
              <p>Quần jean</p>
              <p>Áo khoác</p>
            </div>
            <div class="col-3">
              <p>Nữ</p>
              <img
                src="data:image/jpeg;base64,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"
              />
            </div>
            <div class="col-3">Trẻ em</div>
            <div class="col-3">Phụ kiện</div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>
<style scoped>
.nav {
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
  background-color: #fff;
}

.btn_auth:hover {
  color: #fff;
  background-color: #ac7657;
}

.menu_products {
  width: 90%;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);

  background-color: #ffffff;
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 0 0 12px 12px;
  padding: 23px;
  z-index: 1000;
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
</style>
