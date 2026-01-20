<script>
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPass,
} from "../utils/validator.util";
export default {
  data() {
    return {
      user: {
        email: "",
        password: "",
        phone: "",
        confirm_password: "",
        term_and_condition: false,
        tokenSMS: "",
      },

      err: {
        err_email: "",
        err_password: "",
        err_phone: "",
        err_confirm_password: "",
        err_res: "",
      },
      isShowPass: false,
      otpCode: "",
      isSent: false,
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

    initRecaptcha() {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
          },
        );
      }
    },

    async verifyOTP() {
      try {
        const result = await window.confirmationResult.confirm(this.otpCode);
        const idToken = await result.user.getIdToken();

        console.log("Xác thực thành công! Token nè ní:", idToken);
      } catch (error) {
        this.err.err_res = "Mã OTP không đúng hoặc đã hết hạn!";
      }
    },

    async handleRegister() {
      this.handleInformationUser();
      const hasError = Object.values(this.err).some((e) => e !== "");
      if (hasError) return;

      try {
        this.initRecaptcha();
        const appVerifier = window.recaptchaVerifier;

        const formatPhone = "+84" + this.user.phone.substring(1);

        window.confirmationResult = await signInWithPhoneNumber(
          auth,
          formatPhone,
          appVerifier,
        );

        this.isSent = true;
        this.err.err_res = "";
        alert("Mã OTP đã gửi về máy, check điện thoại nhe ní!");
      } catch (error) {
        this.err.err_res = "Lỗi gửi SMS: " + error.message;
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
            <div id="recaptcha-container"></div>

            <div v-if="!isSent">
              <div class="mb-4">
                <label for="email" class="fw-bold mb-1">Email:</label>
                <input
                  type="email"
                  class="form-control border-0"
                  v-model="user.email"
                />
                <p v-if="err.err_email" class="err">{{ err.err_email }}</p>
              </div>

              <div class="mb-4">
                <label for="phone" class="fw-bold mb-1">Số điện thoại:</label>
                <input
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
                    v-model="user.term_and_condition"
                  />
                  <label for="remember"><a href="#">Điều khoản</a></label>
                </div>
                <p>Bạn đã có tài khoản? <a href="#">Đăng nhập ngay</a></p>
              </div>

              <div class="d-grid mb-1">
                <button
                  type="submit"
                  class="btn btn-primary btn-login rounded-3 fw-semibold"
                  :disabled="!user.term_and_condition"
                >
                  Đăng Kí Tài Khoản
                </button>
              </div>
            </div>

            <div v-else class="text-center animate__animated animate__fadeIn">
              <div class="mb-4">
                <label class="fw-bold mb-2"
                  >Mã OTP đã gửi đến {{ user.phone }}</label
                >
                <input
                  type="text"
                  class="form-control border-0 text-center fw-bold fs-4"
                  placeholder="Nhập 6 số"
                  v-model="otpCode"
                />
              </div>
              <div class="d-grid gap-2">
                <button
                  type="button"
                  @click="verifyOTP"
                  class="btn btn-success rounded-3 fw-semibold"
                >
                  Xác nhận và Hoàn tất Đăng ký
                </button>
                <button
                  type="button"
                  @click="isSent = false"
                  class="btn btn-outline-light btn-sm"
                >
                  Quay lại sửa thông tin
                </button>
              </div>
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
  </div>
</template>
<style>
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
.grecaptcha-badge {
  visibility: hidden !important;
}
</style>
