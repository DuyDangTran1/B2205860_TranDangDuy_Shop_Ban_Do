<script></script>
<template>
  <div class="container-fluid text-dark vh-100 login-container">
    <div class="row h-100 justify-content-center align-items-center">
      <div class="col-lg-4 col-md-8">
        <div class="login-card p-5 rounded-4">
          <h3 class="text-center mb-4">Đăng Nhập</h3>
          <form action="">
            <div class="mb-4">
              <input
                type="email"
                class="form-control border-0"
                placeholder="Hãy nhập email"
                id="email"
              />
            </div>
            <div class="mb-4 wrap-input-pass">
              <input
                type="password"
                class="form-control border-0"
                placeholder="Hãy nhập mật khẩu"
                id="password"
              />
              <i class="fa-solid fa-eye"></i>
            </div>
            <div class="mb-4">
              <div class="form-check">
                <input
                  type="checkbox"
                  name="remember"
                  class="form-check-input"
                  id="remember"
                />
                <label for="remember">Ghi nhớ tài khoản</label>
              </div>
            </div>
            <div class="d-grid mb-2">
              <button
                type="submit"
                class="btn btn-primary btn-login rounded-3 fw-semibold"
              >
                Đăng Nhập
              </button>
            </div>
            <p class="mb-0">
              Bạn chưa có tài khoản?
              <a href="#" class="text-dark fw-bold">Đăng kí tài khoản</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.login-container {
  background: url(https://i.pinimg.com/1200x/1d/86/0e/1d860e6c01182b322b944e10a2fce827.jpg)
    no-repeat center center fixed;
  background-size: cover;
}
.login-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(30px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.form-control {
  background: rgba(255, 255, 255, 0.2);
  height: 40px;
}

.form-control:focus {
  background: rgba(255, 255, 255, 0.5);
}

.wrap-input-pass {
  position: relative;
}

i {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.7);
}

.btn-login {
  transition: 0.3s;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
}
</style>
