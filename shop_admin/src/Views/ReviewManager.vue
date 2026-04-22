<script>
import reviewAdminService from "@/services/review.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";

export default {
  components: { Loading },
  data() {
    return {
      reviews: [],
      searchQuery: "",
      isLoading: false,
      filterRating: "",
      filterStatus: "",
      filterDate: "",
      showDetailModal: false,
      selectedReview: null,
    };
  },
  computed: {
    filteredReviews() {
      return this.reviews.filter((r) => {
        const uName = r.user_name || "";
        const pName = r.product_name || "";

        const matchSearch =
          uName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          pName.toLowerCase().includes(this.searchQuery.toLowerCase());

        const matchRating =
          !this.filterRating || r.rating_score === parseInt(this.filterRating);

        const matchStatus =
          this.filterStatus === "" ||
          r.is_visible === (this.filterStatus === "visible");

        let matchDate = true;
        if (this.filterDate) {
          const rDate = new Date(r.created_at).toISOString().split("T")[0];
          matchDate = rDate === this.filterDate;
        }

        return matchSearch && matchRating && matchStatus && matchDate;
      });
    },
  },
  methods: {
    async initData() {
      this.isLoading = true;
      try {
        const res = await reviewAdminService.getAllReview();
        this.reviews = res || [];
      } catch (err) {
        console.error("Lỗi lấy danh sách đánh giá:", err);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Không thể tải danh sách đánh giá!",
          confirmButtonColor: "#533422",
        });
      } finally {
        this.isLoading = false;
      }
    },
    resetFilters() {
      this.searchQuery = "";
      this.filterRating = "";
      this.filterStatus = "";
      this.filterDate = "";
    },
    async toggleStatus(review) {
      const isHiding = review.is_visible;
      const result = await Swal.fire({
        title: isHiding ? "Xác nhận ẩn?" : "Xác nhận hiển thị?",
        text: isHiding
          ? "Đánh giá này sẽ không còn xuất hiện trên trang sản phẩm!"
          : "Đánh giá sẽ được hiển thị công khai cho mọi khách hàng.",
        icon: isHiding ? "warning" : "question",
        showCancelButton: true,
        confirmButtonColor: isHiding ? "#d33" : "#533422",
        confirmButtonText: isHiding ? "Đồng ý ẩn" : "Hiển thị ngay",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        this.isLoading = true;
        try {
          await reviewAdminService.updateReviewVisibility(review._id, {
            is_visible: !isHiding,
          });

          Swal.fire({
            icon: "success",
            title: "Thành công",
            text: `Đã ${isHiding ? "ẩn" : "hiển thị"} đánh giá!`,
            timer: 1500,
            showConfirmButton: false,
          });
          this.initData();
        } catch (err) {
          Swal.fire("Lỗi", "Thao tác thất bại", "error");
        } finally {
          this.isLoading = false;
        }
      }
    },
    openDetail(review) {
      this.selectedReview = review;
      this.showDetailModal = true;
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString("vi-VN");
    },
  },
  mounted() {
    this.initData();
  },
};
</script>

<template>
  <div class="review-manager p-4">
    <Loading :isLoading="isLoading" />

    <div v-if="!isLoading">
      <div class="mb-4 d-flex justify-content-between align-items-center">
        <h4 class="fw-bold text-brown m-0 text-uppercase tracking-wider">
          Quản lý Đánh giá Sản phẩm
        </h4>
        <div class="badge bg-brown px-3 py-2 rounded-pill shadow-sm">
          Tổng: {{ reviews.length }} bản ghi
        </div>
      </div>

      <div class="row mb-4 g-2">
        <div class="col-md-4">
          <div
            class="position-relative shadow-sm rounded-pill overflow-hidden border"
          >
            <input
              v-model="searchQuery"
              type="text"
              class="form-control ps-5 border-0 bg-white py-2"
              placeholder="Tìm tên khách hoặc sản phẩm..."
            />
            <i
              class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"
            ></i>
          </div>
        </div>
        <div class="col-md-2">
          <select
            v-model="filterRating"
            class="form-select rounded-pill shadow-sm border-0 py-2 ps-3"
          >
            <option value="">Tất cả sao</option>
            <option v-for="s in 5" :key="s" :value="6 - s">
              {{ 6 - s }} Sao
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <select
            v-model="filterStatus"
            class="form-select rounded-pill shadow-sm border-0 py-2 ps-3"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="hidden">Đang bị ẩn</option>
          </select>
        </div>
        <div class="col-md-2">
          <input
            v-model="filterDate"
            type="date"
            class="form-control rounded-pill shadow-sm border-0 py-2 px-3"
          />
        </div>
        <div class="col-md-2">
          <button
            @click="resetFilters"
            class="btn btn-outline-secondary rounded-pill w-100 py-2 border-0 shadow-sm bg-white"
          >
            <i class="fas fa-sync-alt me-1"></i> Làm mới
          </button>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 overflow-hidden border">
        <div class="card-body p-0">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th
                  class="ps-4 py-3 small fw-bold text-uppercase text-brown text-start"
                >
                  Khách hàng
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-start"
                >
                  Sản phẩm
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-center"
                >
                  Đánh giá
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-center"
                >
                  Nội dung
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-center"
                >
                  Media
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-center"
                >
                  Trạng thái
                </th>
                <th
                  class="py-3 small fw-bold text-uppercase text-brown text-end pe-4"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in filteredReviews"
                :key="r._id"
                class="border-bottom"
              >
                <td class="ps-4 text-start">
                  <div class="fw-bold text-dark">
                    {{ r.is_anonymous ? "Khách ẩn danh" : r.user_name }}
                  </div>
                  <div v-if="r.is_anonymous" class="x-small text-muted">
                    ({{ r.user_name }})
                  </div>
                  <div class="x-small text-secondary">
                    {{ formatDate(r.created_at) }}
                  </div>
                </td>
                <td class="text-start">
                  <div
                    class="fw-bold text-shop text-truncate"
                    style="max-width: 150px"
                    :title="r.product_name"
                  >
                    {{ r.product_name || "N/A" }}
                  </div>
                </td>
                <td class="text-center">
                  <div class="text-warning small d-flex justify-content-center">
                    <i
                      v-for="i in 5"
                      :key="i"
                      :class="
                        i <= r.rating_score ? 'fas fa-star' : 'far fa-star'
                      "
                    ></i>
                  </div>
                </td>
                <td class="text-center">
                  <div
                    class="text-secondary small text-truncate mx-auto"
                    style="max-width: 200px"
                  >
                    {{ r.comment }}
                  </div>
                </td>
                <td class="text-center">
                  <div class="d-flex justify-content-center gap-1">
                    <span
                      v-if="r.images && r.images.length"
                      class="badge bg-info rounded-pill x-small shadow-sm"
                    >
                      <i class="fas fa-image"></i> {{ r.images.length }}
                    </span>
                    <span
                      v-if="r.video"
                      class="badge bg-danger rounded-pill x-small shadow-sm"
                    >
                      <i class="fas fa-video"></i>
                    </span>
                    <span
                      v-if="(!r.images || !r.images.length) && !r.video"
                      class="text-muted x-small"
                      >-</span
                    >
                  </div>
                </td>
                <td class="text-center">
                  <span
                    :class="[
                      'badge rounded-pill shadow-sm',
                      r.is_visible ? 'bg-success' : 'bg-secondary',
                    ]"
                  >
                    {{ r.is_visible ? "Hiển thị" : "Đang ẩn" }}
                  </span>
                </td>
                <td class="pe-4 text-end">
                  <div
                    class="btn-group shadow-sm border rounded-pill bg-white px-1"
                  >
                    <button
                      @click="openDetail(r)"
                      class="btn btn-white text-info shadow-none border-0"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      @click="toggleStatus(r)"
                      class="btn btn-white shadow-none border-0"
                      :class="r.is_visible ? 'text-danger' : 'text-success'"
                    >
                      <i
                        :class="
                          r.is_visible
                            ? 'fas fa-eye-slash'
                            : 'fas fa-check-circle'
                        "
                      ></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="showDetailModal = false"
    >
      <div class="modal-content p-4 shadow-lg rounded-4 border-0">
        <h5
          class="fw-bold text-brown mb-2 text-uppercase border-bottom pb-2 d-flex justify-content-between"
        >
          <span>Chi tiết đánh giá</span>
          <i
            class="fas fa-times cursor-pointer text-muted"
            @click="showDetailModal = false"
          ></i>
        </h5>

        <div class="fw-bold small text-secondary mb-1">
          Sản phẩm được đánh giá:
        </div>
        <div class="text-brown fw-bold fs-6">
          {{ selectedReview.product_name || "Sản phẩm không xác định" }}
        </div>

        <div class="row mb-4 mt-4">
          <div class="col-6">
            <div class="fw-bold small text-secondary mb-1">
              Mức độ hài lòng:
            </div>
            <div class="text-warning fs-5">
              <i
                v-for="i in 5"
                :key="i"
                :class="
                  i <= selectedReview.rating_score
                    ? 'fas fa-star'
                    : 'far fa-star'
                "
              ></i>
              <span class="ms-2 text-muted small"
                >({{ selectedReview.rating_score }}/5)</span
              >
            </div>
          </div>
          <div class="col-6 text-end">
            <div class="fw-bold small text-secondary uppercase mb-1">
              Ngày đánh giá:
            </div>
            <div class="text-dark fw-bold">
              {{ formatDate(selectedReview.created_at) }}
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="fw-bold small text-secondary uppercase mb-2">
            Lời nhắn từ khách hàng:
          </div>
          <div class="comment-box shadow-sm">
            <p class="italic mb-0 text-dark">"{{ selectedReview.comment }}"</p>
          </div>
        </div>

        <div
          class="mb-4"
          v-if="
            (selectedReview.images && selectedReview.images.length) ||
            selectedReview.video
          "
        >
          <div class="fw-bold small text-secondary uppercase mb-2">
            Hình ảnh & Video đính kèm:
          </div>
          <div class="d-flex flex-wrap gap-2">
            <img
              v-for="img in selectedReview.images"
              :key="img"
              :src="'http://localhost:3000/' + img"
              class="rounded border shadow-sm review-img-preview"
              width="110"
              height="110"
            />
            <video
              v-if="selectedReview.video"
              :src="'http://localhost:3000/' + selectedReview.video"
              class="rounded border shadow-sm"
              width="110"
              height="110"
              style="object-fit: cover"
              controls
            ></video>
          </div>
        </div>

        <button
          @click="showDetailModal = false"
          class="btn btn-brown w-100 rounded-pill fw-bold py-3 mt-2 shadow-sm text-uppercase tracking-wider"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-brown {
  background-color: #533422;
}
.text-brown {
  color: #533422;
}
.text-shop {
  color: #ac7657;
}
.border-brown {
  border-color: #533422 !important;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
  transition: 0.3s;
}
.btn-brown:hover {
  background-color: #3e2719;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(83, 52, 34, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(83, 52, 34, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: white;
  width: 600px;
  max-width: 95%;
  border-radius: 20px !important;
}

.comment-box {
  background-color: #fcfaf9;
  border-radius: 15px;
  padding: 25px;
  border: 1px solid #efebe9;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100px;
}

.btn-white {
  background: white;
  border: none;
  color: #6c757d;
}
.btn-white:hover {
  background: #f8f9fa;
  color: #333;
}
.x-small {
  font-size: 0.7rem;
}
.tracking-wider {
  letter-spacing: 1.5px;
}
.italic {
  font-style: italic;
  font-size: 1.05rem;
}
.cursor-pointer {
  cursor: pointer;
}

.review-img-preview {
  object-fit: cover;
  transition: all 0.3s;
  cursor: pointer;
}
.review-img-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.modal-content {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
