<template>
  <Loading :isLoading="isLoadingPage || isUpdating" />

  <div class="container-fluid py-4" v-if="!isLoadingPage">
    <div class="row g-4">
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm text-center p-4 h-100">
          <div class="card-body">
            <div class="avatar-wrapper mb-3 mx-auto">
              <div class="avatar-container shadow-sm">
                <img
                  v-if="adminAvatar"
                  :src="
                    adminAvatar.startsWith('blob')
                      ? adminAvatar
                      : `http://localhost:3000/${adminAvatar}`
                  "
                  class="avatar-img"
                />
                <span v-else class="avatar-text">{{ firstChar }}</span>
              </div>
              <label for="avatarInput" class="btn-change-avatar shadow">
                <i class="fas fa-camera"></i>
                <input
                  type="file"
                  id="avatarInput"
                  @change="onFileChange"
                  hidden
                  accept="image/*"
                />
              </label>
            </div>

            <h4 class="fw-bold text-brown">{{ adminName }}</h4>
            <p class="text-muted small mb-3 text-uppercase fw-semibold">
              {{ adminRole }}
            </p>
            <div
              class="badge bg-success-subtle text-success px-3 py-2 rounded-pill"
            >
              <i class="fas fa-circle me-1" style="font-size: 8px"></i> Đang
              hoạt động
            </div>
            <hr class="my-4" />
            <div class="text-start">
              <p class="mb-2"><strong>Email:</strong> {{ formData.email }}</p>
              <p class="mb-2">
                <strong>Ngày sinh:</strong> {{ formatDate(formData.birthday) }}
              </p>
              <p class="mb-0">
                <strong>Ngày tham gia:</strong>
                {{ formatDate(formData.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white py-3 border-0">
            <h5 class="fw-bold m-0 text-brown">Chỉnh sửa hồ sơ</h5>
          </div>
          <div class="card-body px-4 pb-4">
            <form @submit.prevent="handleUpdateInfo">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Họ và tên</label>
                  <input
                    v-model="formData.name"
                    type="text"
                    class="form-control rounded-3"
                    required
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Ngày sinh</label>
                  <input
                    v-model="formData.birthday"
                    type="date"
                    class="form-control rounded-3"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Số điện thoại</label>
                  <input
                    v-model="formData.phone"
                    type="text"
                    class="form-control rounded-3"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Email</label>
                  <input
                    :value="formData.email"
                    type="email"
                    class="form-control rounded-3"
                    disabled
                  />
                </div>
                <div class="col-12">
                  <label class="form-label fw-bold">Địa chỉ</label>
                  <textarea
                    v-model="formData.address"
                    class="form-control rounded-3"
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div class="text-end mt-4">
                <button
                  type="submit"
                  class="btn btn-brown px-4 py-2"
                  :disabled="isUpdating"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white py-3 border-0">
            <h5 class="fw-bold m-0 text-danger">Đổi mật khẩu</h5>
          </div>
          <div class="card-body px-4 pb-4">
            <form @submit.prevent="handleChangePass">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label fw-bold">Mật khẩu cũ</label>
                  <input
                    v-model="passData.oldPassword"
                    type="password"
                    class="form-control rounded-3"
                    required
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Mật khẩu mới</label>
                  <input
                    v-model="passData.newPassword"
                    type="password"
                    class="form-control rounded-3"
                    required
                  />
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Xác nhận</label>
                  <input
                    v-model="passData.confirmPassword"
                    type="password"
                    class="form-control rounded-3"
                    required
                  />
                </div>
              </div>
              <div class="text-end mt-4">
                <button
                  type="submit"
                  class="btn btn-outline-danger px-4 py-2"
                  :disabled="isUpdating"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EmployeeService from "@/services/employee.service";
import Swal from "sweetalert2";
import Loading from "@/components/Loading.vue";

export default {
  components: {
    Loading,
  },
  data() {
    return {
      adminName: "",
      adminRole: "",
      adminAvatar: null,
      selectedFile: null,
      isLoadingPage: true,
      isUpdating: false,
      formData: {
        name: "",
        email: "",
        phone: "",
        address: "",
        birthday: "",
        created_at: "",
      },
      passData: {
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    };
  },
  computed: {
    firstChar() {
      return this.adminName ? this.adminName.charAt(0).toUpperCase() : "A";
    },
  },
  methods: {
    async fetchProfile() {
      this.isLoadingPage = true;
      try {
        const adminId = sessionStorage.getItem("id");
        const response = await EmployeeService.getDetail(adminId);
        const info = response.infor;

        this.adminName = info.name;
        this.adminRole = info.role;
        this.adminAvatar =
          info.url_image && info.url_image !== "undefined"
            ? info.url_image
            : null;

        this.formData = {
          name: info.name,
          email: info.email,
          phone: info.phone || "",
          address: info.address || "",
          birthday: info.birthday ? info.birthday.split("T")[0] : "",
          created_at: info.created_at,
        };
      } catch (error) {
        console.error("Lỗi lấy thông tin Profile:", error);
      } finally {
        this.isLoadingPage = false;
      }
    },

    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.selectedFile = file;
      this.adminAvatar = URL.createObjectURL(file);
    },

    async handleUpdateInfo() {
      this.isUpdating = true;
      try {
        const data = new FormData();
        data.append("name", this.formData.name);
        data.append("phone", this.formData.phone);
        data.append("address", this.formData.address);
        data.append("birthday", this.formData.birthday);

        if (this.selectedFile) {
          data.append("avatar", this.selectedFile);
        }

        await EmployeeService.update(data);

        sessionStorage.setItem("name", this.formData.name);
        this.adminName = this.formData.name;
        this.isUpdating = false;
        await Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Hồ sơ của bạn đã được cập nhật!",
          confirmButtonColor: "#533422",
        });

        this.selectedFile = null;
        await this.fetchProfile();
      } catch (error) {
        Swal.fire(
          "Lỗi!",
          "Cập nhật thất bại, bạn vui lòng thử lại sau.",
          "error",
        );
      } finally {
        this.isUpdating = false;
      }
    },

    async handleChangePass() {
      if (this.passData.newPassword !== this.passData.confirmPassword) {
        return Swal.fire("Lỗi", "Mật khẩu xác nhận không khớp!", "error");
      }
      this.isUpdating = true;
      try {
        await EmployeeService.changePassword({
          oldPassword: this.passData.oldPassword,
          newPassword: this.passData.newPassword,
        });
        Swal.fire("Thành công", "Đổi mật khẩu thành công", "success");
        this.passData = {
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        };
      } catch (error) {
        const serverMessage =
          error.response?.data?.message || "Đã có lỗi không xác định xảy ra";
        Swal.fire("Lỗi", serverMessage, "error");
      } finally {
        this.isUpdating = false;
      }
    },

    formatDate(dateString) {
      if (!dateString) return "Chưa cập nhật";
      return new Date(dateString).toLocaleDateString("vi-VN");
    },
  },
  mounted() {
    this.fetchProfile();
  },
};
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}
.avatar-container {
  width: 100%;
  height: 100%;
  background-color: #533422;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-text {
  font-size: 3.5rem;
  color: white;
  font-weight: bold;
}
.btn-change-avatar {
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #533422;
  transition: 0.3s;
}
.btn-change-avatar:hover {
  background: #f8f9fa;
  transform: scale(1.1);
}
.text-brown {
  color: #533422;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
}
.btn-brown:hover {
  background-color: #3d2619;
  color: white;
}
</style>
