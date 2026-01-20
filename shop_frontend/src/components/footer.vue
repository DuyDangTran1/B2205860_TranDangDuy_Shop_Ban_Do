<template>
  <div class="container-fluid footer text-white py-5">
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-4">
          <h4 class="fs-3 fw-bold mb-4">SHOPDD</h4>
          <p class="lh-base opacity-75" style="text-align: justify">
            Tại SHOPDD, chúng tôi tin rằng thời trang không chỉ là trang phục
            bạn mặc, mà là cách bạn khẳng định bản thân với thế giới. SHOPDD đã
            và đang trở thành "Vương quốc của phong cách" – nơi cập nhật những
            xu hướng không thể đánh bại.
          </p>
        </div>

        <div class="col-lg-2">
          <h4 class="fw-bold fs-5 mb-4">Danh mục</h4>
          <div class="footer-links">
            <a href="#">Thời trang nam</a>
            <a href="#">Thời trang nữ</a>
            <a href="#">Thời trang trẻ em</a>
            <a href="#">Phụ kiện</a>
          </div>
        </div>

        <div class="col-lg-3">
          <h4 class="fw-bold fs-5 mb-4">Chính sách</h4>
          <div class="footer-links">
            <a href="#">Chính sách đổi trả</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Điều khoản dịch vụ</a>
          </div>
        </div>

        <div class="col-lg-3">
          <h4 class="fw-bold fs-5 mb-4">Liên hệ với chúng tôi</h4>
          <div class="d-flex align-items-center mb-3">
            <i class="fa-solid fa-phone-volume fs-4 me-3"></i>
            <a
              href="tel:0901234567"
              class="text-white text-decoration-none fs-5 fw-bold"
              >097.906.9459</a
            >
          </div>
          <div class="d-flex gap-3 mt-4">
            <a href="#" class="social-icon"
              ><i class="fa-brands fa-facebook-f"></i
            ></a>
            <a href="#" class="social-icon"
              ><i class="fa-brands fa-instagram"></i
            ></a>
            <a href="#" class="social-icon"
              ><i class="fa-brands fa-tiktok"></i
            ></a>
          </div>
        </div>
      </div>

      <hr class="mt-5 opacity-25" />
      <div class="text-center opacity-50 small mt-4">
        &copy; 2025 SHOPDD Fashion. All rights reserved.
      </div>
    </div>
  </div>
</template>

<style scoped>
.footer {
  background-color: #533422;
}

.footer-links a {
  display: block;
  text-decoration: none;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 12px;
  transition: 0.3s;
}

.footer-links a:hover {
  color: white;
  padding-left: 8px;
}

.social-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  display: flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: 0.3s;
}

.social-icon:hover {
  background: #ac7657;
  transform: translateY(-3px);
}

i {
  font-size: 1.2rem !important;
  color: white !important;
}
</style>
