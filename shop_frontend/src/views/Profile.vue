<template>
  <Loading :isLoading="isLoading" />

  <div v-if="!isLoading">
    <my_header></my_header>
    <div class="container my-3">
      <!-- {{ user }} -->
      <!-- {{ user.phone && user.phone !== "" }} -->
      <!-- {{ user.phone }}
      {{ user.phone !== "" }} -->
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 p-4 p-lg-5">
            <h3 class="fw-bold text-brown mb-4 border-bottom pb-3">
              HỒ SƠ CỦA TÔI
            </h3>

            <div class="row g-4">
              <div class="col-md-4 text-center border-md-end">
                <div
                  class="avatar-preview position-relative mb-3 d-inline-block"
                >
                  <img
                    :src="
                      !user.image_url
                        ? '/images/avatar_default/avatar_default.jpg'
                        : user.image_url.startsWith('http')
                          ? user.image_url
                          : 'http://localhost:3000/' + user.image_url
                    "
                    class="rounded-circle shadow-sm border"
                    style="width: 160px; height: 160px; object-fit: cover"
                  />

                  <label for="avatarInput" class="btn-edit-avatar shadow-sm">
                    <i class="fa-solid fa-camera"></i>
                  </label>
                </div>
                <div class="mt-2 mb-1">
                  <h5 class="fw-bold text-dark mb-0">{{ user.name }}</h5>
                </div>
                <div class="mb-2">
                  <span
                    :class="getRankClass(user.rank)"
                    class="text-brown badge rounded-pill px-3 py-2 shadow-sm border"
                  >
                    Hạng
                    {{ user.rank || "Đồng" }}
                  </span>
                </div>
                <input
                  type="file"
                  id="avatarInput"
                  hidden
                  @change="onFileChange"
                  accept="image/*"
                />
                <p class="text-muted mt-2 x-small">
                  Hỗ trợ: .JPG, .PNG (Max 1MB)
                </p>
              </div>

              <div class="col-md-8">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted"
                    >HỌ VÀ TÊN</label
                  >
                  <input
                    type="text"
                    v-model="user.name"
                    class="form-control bg-light border-0 py-2 rounded-3"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted"
                    >EMAIL</label
                  >
                  <input
                    type="email"
                    :value="user.email"
                    disabled
                    class="form-control bg-white border-0 py-2 rounded-3 opacity-75"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted"
                    >SỐ ĐIỆN THOẠI</label
                  >
                  <input
                    type="text"
                    v-model="user.phone"
                    :disabled="isPhoneConfirmed"
                    :class="{
                      'bg-white opacity-75': user.phone && user.phone !== '',
                      'bg-light': !user.phone || user.phone === '',
                    }"
                    class="form-control border-0 py-2 rounded-3"
                    :style="
                      isPhoneConfirmed ? 'cursor: not-allowed' : 'cursor: text'
                    "
                    placeholder="Vui lòng cập nhật số điện thoại để bảo mật tài khoản"
                  />
                  <p v-if="!user.phone" class="x-small text-warning mt-1">
                    * Lưu ý: Số điện thoại chỉ được cập nhật một lần duy nhất.
                  </p>
                </div>
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted"
                    >NGÀY SINH</label
                  >
                  <input
                    type="date"
                    v-model="user.birthday"
                    class="form-control bg-light border-0 py-2 rounded-3"
                  />
                </div>
                <div class="mb-4">
                  <label class="form-label small fw-bold text-muted"
                    >ĐỊA CHỈ</label
                  >
                  <textarea
                    v-model="user.address"
                    class="form-control bg-light border-0 py-2 rounded-3"
                    rows="2"
                    placeholder="Số nhà, tên đường, Phường/Xã..."
                  ></textarea>
                </div>

                <button
                  @click="updateProfile"
                  class="btn btn-brown w-100 py-2 fw-bold shadow-sm rounded-pill transition-all"
                >
                  CẬP NHẬT THÔNG TIN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <my_footer></my_footer>
  </div>
</template>

<script>
import userService from "@/services/user.service";
import my_header from "@/components/header.vue";
import my_footer from "@/components/footer.vue";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";

export default {
  components: { my_header, my_footer, Loading },
  data() {
    return {
      isLoading: true,
      user: {},
      selectedFile: null,
      previewImage: null,
      isPhoneConfirmed: false,
    };
  },
  methods: {
    async loadUserData() {
      this.isLoading = true;
      try {
        const res = await userService.me();
        this.user = res.user_information || {};

        if (this.user.phone && this.user.phone.toString().trim() !== "") {
          this.isPhoneConfirmed = true;
        } else {
          this.isPhoneConfirmed = false;
        }

        sessionStorage.setItem("user", JSON.stringify(this.user));
      } catch (err) {
        console.error("Lỗi lấy thông tin cá nhân:", err);
      } finally {
        this.isLoading = false;
      }
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          return Swal.fire(
            "Lỗi",
            "Ảnh quá lớn, vui lòng chọn file dưới 1MB",
            "error",
          );
        }
        this.selectedFile = file;
        this.previewImage = URL.createObjectURL(file);
      }
    },
    getRankClass(rank) {
      switch (rank) {
        case "Vàng":
          return "bg-warning";
        case "Bạc":
          return "bg-secondary";
        case "Kim cương":
          return "bg-info";
        default:
          return "bg-bronze";
      }
    },
    async updateProfile() {
      const formData = new FormData();
      formData.append("name", this.user.name || "");
      formData.append("phone", this.user.phone || "");
      formData.append("birthday", this.user.birthday || "");
      formData.append("address", this.user.address || "");

      if (this.selectedFile) {
        formData.append("image", this.selectedFile);
      }

      this.isLoading = true;
      try {
        await userService.changeInformationUser(formData);
        this.isLoading = false;
        await Swal.fire("Thành công", "Thông tin đã được cập nhật!", "success");

        // location.reload();
      } catch (err) {
        this.isLoading = false;
        Swal.fire("Lỗi", "Không thể cập nhật, vui lòng thử lại sau!", "error");
      }
    },
  },
  mounted() {
    if (!sessionStorage.getItem("accessToken")) {
      this.$router.push({ name: "Login" });
    } else {
      this.loadUserData();
    }
  },
};
</script>
<style scoped>
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
}

.btn-brown:hover {
  background-color: #3e2719;
  transform: translateY(-2px);
}
.text-brown {
  color: #533422;
}
.x-small {
  font-size: 0.7rem;
}
.transition-all {
  transition: all 0.3s ease;
}

.btn-edit-avatar {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #ddd;
}

@media (min-width: 768px) {
  .border-md-end {
    border-right: 1px solid #eee;
  }
}
</style>
