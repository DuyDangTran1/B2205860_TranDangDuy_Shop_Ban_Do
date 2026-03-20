<script>
import employeeService from "@/services/employee.service";
export default {
  data() {
    return {
      account: {
        email: "",
        password: "",
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
        const res = await employeeService.login(this.account);
        sessionStorage.setItem("accessToken", res.accessToken);
        sessionStorage.setItem("name", res.name);
        sessionStorage.setItem("role", res.role);
        this.$router.push("/dashboard");
      } catch (error) {
        this.error.error_res =
          error.response.data.message || "Đã có lỗi xảy ra";
      }
    },
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
                <i
                  :class="
                    isShowPassword ? 'fas fa-eye-slash' : 'fa-solid fa-eye'
                  "
                  @click="handleShowPassword"
                ></i>
              </div>
              <p v-if="error.error_password" class="text-danger small mt-1">
                {{ error.error_password }}
              </p>
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
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.login-container {
  background: url(../assets//image//login/b4ae5e2e3a0009177b65c160dc3c95ef.jpg)
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
