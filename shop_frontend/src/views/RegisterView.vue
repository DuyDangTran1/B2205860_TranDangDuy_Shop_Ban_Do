<script>
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPass,
} from "../utils/validator.util";

import UserService from "../services/user.service";

export default {
  data() {
    return {
      user: {
        email: "",
        password: "",
        phone: "",
        confirm_password: "",
        terms_and_condition: false,
      },

      err: {
        err_email: "",
        err_password: "",
        err_phone: "",
        err_confirm_password: "",
        err_res: "",
      },
      isShowPass: false,
      showToast: false,
    };
  },

  methods: {
    handleShowPassword() {
      this.isShowPass = !this.isShowPass;
    },

    handleInformationUser() {
      this.err.err_email = validateEmail(this.user.email);
      this.err.err_phone = validatePhone(this.user.phone);
      this.err.err_password = validatePassword(this.user.password);
      this.err.err_confirm_password = validateConfirmPass(
        this.user.password,
        this.user.confirm_password,
      );
    },

    async handleRegister() {
      this.handleInformationUser();
      const hasError = Object.values(this.err).some((e) => e !== "");
      if (hasError) return;

      try {
        console.log(this.user);
        const result = await UserService.register(this.user);

        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
        }, 1000);
      } catch (error) {
        const serverRes = error.response;

        if (serverRes && serverRes.status === 409) {
          const serverErrors = serverRes.data.message;
          this.err.err_email = serverErrors.err_email
            ? serverErrors.err_email
            : this.err.err_email;
          this.err.err_phone = serverErrors.err_phone
            ? serverErrors.err_phone
            : this.err.err_phone;
        } else {
          this.err.err_res = serverRes?.data?.message || "Đã có lỗi xảy ra!";
        }
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
          <h3 class="text-center mb-4">Đăng Ký</h3>
          <form @submit.prevent="handleRegister">
            <div class="mb-4">
              <label for="email" class="fw-bold mb-1">Email:</label>
              <input
                id="email"
                type="email"
                class="form-control border-0"
                v-model="user.email"
              />
              <p v-if="err.err_email" class="err">{{ err.err_email }}</p>
            </div>

            <div class="mb-4">
              <label for="phone" class="fw-bold mb-1">Số điện thoại:</label>
              <input
                id="phone"
                type="text"
                class="form-control border-0"
                v-model="user.phone"
              />
              <p v-if="err.err_phone" class="err">{{ err.err_phone }}</p>
            </div>

            <div class="mb-4 wrap-input-pass">
              <label for="password" class="mt-1 fw-bold">Mật khẩu:</label>
              <div class="input-pass">
                <input
                  id="password"
                  :type="!isShowPass ? 'password' : 'text'"
                  class="form-control border-0"
                  v-model="user.password"
                />
                <i
                  :class="
                    isShowPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'
                  "
                  @click="handleShowPassword"
                ></i>
              </div>
              <p v-if="err.err_password" class="err">
                {{ err.err_password }}
              </p>
            </div>

            <div class="mb-4 wrap-input-pass">
              <label for="confirm-password" class="mt-1 fw-bold"
                >Xác nhận mật khẩu:</label
              >
              <div class="input-pass">
                <input
                  id="confirm-password"
                  :type="!isShowPass ? 'password' : 'text'"
                  class="form-control border-0"
                  v-model="user.confirm_password"
                />
                <i
                  :class="
                    isShowPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'
                  "
                  @click="handleShowPassword"
                ></i>
              </div>
              <p v-if="err.err_confirm_password" class="err">
                {{ err.err_confirm_password }}
              </p>
            </div>

            <div class="mb-4 d-flex justify-content-between">
              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="remember"
                  v-model="user.terms_and_condition"
                />
                <label for="remember"
                  ><a class="fw-bold" href="#">Điều khoản</a></label
                >
              </div>
              <p>
                Bạn đã có tài khoản?
                <a class="fw-bold" href="#">Đăng nhập ngay</a>
              </p>
            </div>

            <div class="d-grid mb-1">
              <button
                type="submit"
                class="btn btn-primary btn-login rounded-3 fw-semibold"
                :disabled="!user.terms_and_condition"
              >
                Đăng Kí Tài Khoản
              </button>
            </div>

            <div
              v-if="err.err_res"
              class="alert alert-danger py-2 text-center mt-3"
              role="alert"
            >
              {{ err.err_res }}
            </div>
          </form>
        </div>
      </div>
    </div>
    <div v-if="showToast" class="toast-container-center">
      <div class="custom-toast animate__animated animate__zoomIn">
        <div class="toast-body">
          <h5>Đăng ký thành công!</h5>
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

i:hover {
  cursor: pointer;
}

.btn-login {
  transition: 0.3s;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
}

.err {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 4px;
  font-weight: 500;
}

.toast-container-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-toast {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  /* Chỉnh width và height ở đây nè ní */
  width: 450px;
  height: 250px;
  /* Dùng flexbox để canh chữ vào giữa hộp cho chuẩn */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  border-radius: 30px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.toast-body h5 {
  font-size: 2rem; /* Cho chữ to lên tương ứng với cái hộp */
  color: #533422;
  font-weight: bold;
}

.toast-body p {
  color: #666;
  margin-bottom: 0;
}
</style>
