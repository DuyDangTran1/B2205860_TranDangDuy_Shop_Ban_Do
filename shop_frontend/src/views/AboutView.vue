<script>
import MyHeader from "../components/header.vue";
import MyFooter from "../components/footer.vue";
export default {
  components: {
    MyHeader,
    MyFooter,
  },
};
</script>

<template>
  <MyHeader></MyHeader>
  <div class="about-page">
    <section class="about-hero">
      <div class="container">
        <h1 class="display-4 fw-bold">SHOPDB</h1>
        <p class="lead">Định hình phong cách - Khẳng định bản sắc</p>
      </div>
    </section>

    <section class="container my-5 py-5">
      <div class="row align-items-center">
        <div class="col-md-6 mb-4 mb-md-0">
          <img
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800"
            alt="Our Story"
            class="img-fluid rounded-4 shadow"
          />
        </div>
        <div class="col-md-6 ps-md-5">
          <h2 class="section-title">Câu chuyện của chúng tôi</h2>
          <p class="text-muted">
            Khởi nguồn từ niềm đam mê bất tận với những sợi vải Cotton tinh
            khiết,
            <strong>SHOPDB</strong> ra đời với sứ mệnh mang đến những trải
            nghiệm thời trang thoải mái nhất cho người Việt.
          </p>
          <p class="text-muted">
            Chúng tôi không chỉ bán quần áo, chúng tôi bán sự tự tin và phong
            cách sống tối giản nhưng tinh tế. Mỗi sản phẩm tại SHOPDB đều được
            kiểm duyệt khắt khe về chất liệu từ khâu sợi vải đến đường kim mũi
            chỉ.
          </p>
        </div>
      </div>
    </section>

    <section class="values-section bg-light py-5">
      <div class="container text-center">
        <h2 class="mb-5">SHOP CAM KẾT</h2>
        <div class="row g-4">
          <div class="col-md-4">
            <div class="value-card shadow-sm">
              <i class="fa-solid fa-leaf mb-3"></i>
              <h4>Chất lượng thực</h4>
              <p>
                Sử dụng chất liệu tốt nhất, thoải mái, mát mẻ, an toàn cho da và
                bền bỉ theo thời gian.
              </p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="value-card shadow-sm">
              <i class="fa-solid fa-bolt mb-3"></i>
              <h4>Sáng tạo</h4>
              <p>Thiết kế trẻ trung, bắt kịp xu hướng thời trang hiện đại.</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="value-card shadow-sm">
              <i class="fa-solid fa-heart mb-3"></i>
              <h4>Khách hàng là trọng tâm</h4>
              <p>Luôn lắng nghe và hỗ trợ khách hàng bằng tất cả sự tận tâm.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container my-5 py-5 text-center">
      <h2 class="mb-4">Kết nối với chúng tôi</h2>
      <p class="mb-5">
        SHOPDB luôn sẵn sàng chào đón bạn ghé thăm và trải nghiệm sản phẩm trực
        tiếp.
      </p>
      <div class="row justify-content-center">
        <div class="col-md-4">
          <div class="contact-info">
            <i class="fa-solid fa-location-dot"></i>
            <p>Phú Lộc, Thạnh Trị, Sóc Trăng, Việt Nam</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="contact-info">
            <i class="fa-solid fa-phone"></i>
            <p>0979069459</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="contact-info">
            <i class="fa-solid fa-envelope"></i>
            <p>support@shopdb.com</p>
          </div>
        </div>
        <div class="col-12 mt-5">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31487.863666387442!2d105.719547003705!3d9.422896836238712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a10722b52da851%3A0x9cedb80842fb25b1!2zUGjDuiBM4buZYywgVGjhuqFuaCBUcuG7iywgU8OzYyBUcsSDbmcsIFZp4buHdCBOYW0!5e0!3m2!1svi!2sus!4v1772683088993!5m2!1svi!2sus"
            width="100%"
            height="450"
            style="border: 0"
            class="map-container"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  </div>
  <MyFooter></MyFooter>
</template>

<style scoped>
.about-hero {
  background:
    linear-gradient(rgba(83, 52, 34, 0.8), rgba(83, 52, 34, 0.8)),
    url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1500");
  background-size: cover;
  background-position: center;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
}

.section-title {
  color: #533422;
  font-weight: bold;
  margin-bottom: 20px;
  position: relative;
}

.section-title::after {
  content: "";
  display: block;
  width: 50px;
  height: 3px;
  background: #ac7657;
  margin-top: 10px;
}

.value-card {
  background: white;
  padding: 40px 20px;
  border-radius: 16px;
  height: 100%;
  transition: transform 0.3s ease;
}

.value-card:hover {
  transform: translateY(-10px);
}

.value-card i {
  font-size: 40px;
  color: #ac7657;
}

.contact-info i {
  font-size: 24px;
  color: #533422;
  margin-bottom: 10px;
}

.contact-info p {
  font-weight: 500;
}

/* Bo góc và đổ bóng cho bản đồ */
.map-container {
  width: 100%;
  border-radius: 20px; /* Bo góc mạnh nhìn cho hiện đại */
  overflow: hidden; /* Quan trọng: để iframe không đè mất góc bo */
  border: 4px solid #fff; /* Tạo viền trắng bao quanh map cho sang */
  transition: transform 0.3s ease;
}

.map-container:hover {
  transform: scale(1.01); /* Rà chuột vào nó hơi nở ra nhẹ cho sinh động */
}

/* Đảm bảo iframe luôn lấp đầy khung */
iframe {
  display: block;
}

@media (max-width: 768px) {
  .about-hero {
    height: 300px;
  }
}
</style>
