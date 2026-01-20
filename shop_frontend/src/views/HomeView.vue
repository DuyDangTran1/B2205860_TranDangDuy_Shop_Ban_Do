<script setup>
import myheader from "@/components/header.vue";
import myfooter from "@/components/footer.vue";
</script>

<template>
  <myheader></myheader>
  <div class="container-fluid p-0">
    <!-- //banner -->
    <img
      class="banner"
      src="https://i.pinimg.com/1200x/db/0b/f6/db0bf6abc011c7a6621e7b8db6b18a1d.jpg"
    />

    <div class="row col-lg-10 offset-1 mt-5 mb-5">
      <h2 class="mb-5">Sản phẩm mới nhất</h2>
      <div class="wrap_lastest_product row">
        <div class="lastest_product col-lg-4">
          <div class="img">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/1200x/2f/fd/59/2ffd59518dfa59755f78b272be6862b6.jpg"
            />
          </div>

          <h4 class="mt-3 fw-bold">Áo sơ mi nam</h4>
          <h4 class="price mt-1">550.000 VND</h4>
          <p class="add_cart mt-3 text-primary fs-5 fw-bold">
            <span class="text-decoration-underline">Thêm vào giỏ hàng</span>
            <span class="ms-1">></span>
          </p>
        </div>

        <div class="lastest_product col-lg-4">
          <div class="img">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/1200x/2f/fd/59/2ffd59518dfa59755f78b272be6862b6.jpg"
            />
          </div>

          <h4 class="mt-3 fw-bold">Áo sơ mi nam</h4>
          <h4 class="price mt-1">550.000 VND</h4>
          <p class="add_cart mt-3 text-primary fs-5 fw-bold">
            <span class="text-decoration-underline">Thêm vào giỏ hàng</span>
            <span class="ms-1">></span>
          </p>
        </div>

        <div class="lastest_product col-lg-4">
          <div class="img">
            <img
              class="w-100 rounded-3 img"
              src="https://i.pinimg.com/1200x/2f/fd/59/2ffd59518dfa59755f78b272be6862b6.jpg"
            />
          </div>

          <h4 class="mt-3 fw-bold">Áo sơ mi nam</h4>
          <h4 class="price mt-1">550.000 VND</h4>
          <p class="add_cart mt-3 text-primary fs-5 fw-bold">
            <span class="text-decoration-underline">Thêm vào giỏ hàng</span>
            <span class="ms-1">></span>
          </p>
        </div>
      </div>
    </div>

    <div class="convenient mb-5 row">
      <div class="col-lg-3 text-center">
        <i class="fa-solid fa-truck-fast mt-5"></i>
        <h4 class="mt-4 fw-bold">Miễn phí ship</h4>
        <p class="pb-5">
          Bước vào vương quốc của phong cách với người tạo ra xu hướng áo phông
          không thể đánh bại của chúng tôi ngày nay. Miễn phí ship toàn quốc với
          các đơn hàng từ 500K
        </p>
      </div>

      <div class="col-lg-3 text-center">
        <i class="fa-solid fa-headset mt-5"></i>
        <h4 class="mt-4 fw-bold">Tư vấn 24/7</h4>
        <p class="pb-5">
          Bước vào vương quốc của phong cách với người tạo ra xu hướng áo phông
          không thể đánh bại của chúng tôi ngày nay.
        </p>
      </div>

      <div class="col-lg-3 text-center">
        <i class="fa-solid fa-rotate-left mt-5"></i>
        <h4 class="mt-4 fw-bold">Đổi trả dễ dàng</h4>
        <p class="pb-5">
          Bước vào vương quốc của phong cách với người tạo ra xu hướng áo phông
          không thể đánh bại của chúng tôi ngày nay.
        </p>
      </div>

      <div class="col-lg-3 text-center">
        <i class="fa-solid fa-lock mt-5"></i>
        <h4 class="mt-4 fw-bold">Thanh toán an toàn</h4>
        <p class="pb-5">
          Bước vào vương quốc của phong cách với người tạo ra xu hướng áo phông
          không thể đánh bại của chúng tôi ngày nay.
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
</template>
<style scoped>
.banner {
  width: 100%;
}

.lastest_product {
  transition: 0.3s ease;
  cursor: pointer;
}

.lastest_product:hover {
  transform: scale(1.02);
  z-index: 10;
}

.price {
  color: #f00;
}

.convenient {
  background-color: #f0ebe7;
}

.img {
  overflow: hidden;
  transition: 0.3s ease;
  cursor: pointer;
  height: 450px;
}

i {
  color: #a19786;
  font-size: 7rem;
}

.img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.4s ease;
}

.img:hover {
  transform: scale(1.02);
}
</style>
