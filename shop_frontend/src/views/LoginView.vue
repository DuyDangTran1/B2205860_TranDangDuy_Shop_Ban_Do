<script>
import userService from "@/services/user.service";
export default {
  data() {
    return {
      account: {
        email: "",
        password: "",
        remember: false,
      },

      error: {
        error_email: "",
        error_password: "",
        error_res: "",
      },

      isShowPassword: false,
    };
  },
  methods: {
    handleRemember() {
      if (this.account.remember) {
        localStorage.setItem("remembered_email", this.account.email);
      } else {
        localStorage.removeItem("remembered_email");
      }
    },

    handleShowPassword() {
      this.isShowPassword = !this.isShowPassword;
    },

    checkEmail(email) {
      if (!email) return "Không được bỏ trống email";

      return "";
    },

    checkPassword(password) {
      if (!password) return "Không được bỏ trống mật khẩu";

      return "";
    },

    async handleLogin() {
      this.error.error_email = this.checkEmail(this.account.email);
      this.error.error_password = this.checkPassword(this.account.password);

      if (this.error.error_email || this.error.error_password) return;

      try {
        const res = await userService.login(this.account);
        sessionStorage.setItem("accessToken", res.accessToken);
        sessionStorage.setItem("name", res.name);
        this.handleRemember();
        this.$router.push("/");
      } catch (error) {
        this.error.error_res =
          error.response.data.message || "Đã có lỗi xảy ra";
      }
    },
  },

  mounted() {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      this.account.email = savedEmail;
      this.account.remember = true;
    }
  },
};
</script>
<template>
  <div class="container-fluid text-dark vh-100 login-container">
    <div class="row h-100 justify-content-center align-items-center">
      <div class="col-lg-4 col-md-8">
        <div class="login-card p-5 rounded-4">
          <h3 class="text-center mb-4">Đăng Nhập</h3>
          <form @submit.prevent="handleLogin">
            <div class="mb-4">
              <input
                type="email"
                class="form-control border-0"
                placeholder="Hãy nhập email"
                id="email"
                autocomplete="username"
                v-model="account.email"
              />
              <p v-if="error.error_email" class="text-danger small mt-1">
                {{ error.error_email }}
              </p>
            </div>
            <div class="mb-4 wrap-input-pass">
              <div class="input-pass">
                <input
                  :type="!isShowPassword ? 'password' : 'text'"
                  class="form-control border-0"
                  placeholder="Hãy nhập mật khẩu"
                  id="password"
                  v-model="account.password"
                  autocomplete="current-password"
                />
                <i class="fa-solid fa-eye" @click="handleShowPassword"></i>
              </div>
              <p v-if="error.error_password" class="text-danger small mt-1">
                {{ error.error_password }}
              </p>
            </div>
            <div class="mb-4">
              <div class="form-check">
                <input
                  type="checkbox"
                  name="remember"
                  class="form-check-input"
                  id="remember"
                  v-model="account.remember"
                />
                <label for="remember">Ghi nhớ tài khoản</label>
              </div>
            </div>

            <div class="d-grid mb-2">
              <div
                v-if="error.error_res"
                class="alert alert-danger py-2 mt-3 text-center"
              >
                {{ error.error_res }}
              </div>
              <button
                type="submit"
                class="btn btn-primary btn-login rounded-3 fw-semibold"
              >
                Đăng Nhập
              </button>
            </div>
            <p class="mb-0">
              Bạn chưa có tài khoản?
              <a href="#" class="fw-bold">Đăng kí tài khoản</a>
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

.input-pass {
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
