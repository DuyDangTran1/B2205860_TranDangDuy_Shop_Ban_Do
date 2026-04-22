<script>
import collectionService from "@/services/collection.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";
export default {
  components: { Loading },
  data() {
    return {
      collections: [],
      searchQuery: "",
      isLoading: false,
      showModal: false,
      isEdit: false,
      currentId: null,
      formData: {
        collection_name: "",
        description: "",
      },
      selectedFile: null,
      imagePreview: null,
    };
  },
  computed: {
    filteredCollections() {
      return this.collections.filter((c) =>
        c.collection_name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase()),
      );
    },
  },
  methods: {
    async initData() {
      this.isLoading = true;
      try {
        const res = await collectionService.getAllCollection();
        this.collections = res.collections || [];
      } catch (err) {
        console.error("Lỗi lấy dữ liệu BST:", err);
      } finally {
        this.isLoading = false;
      }
    },
    onFileChange(e) {
      this.selectedFile = e.target.files[0];
      if (this.selectedFile) {
        this.imagePreview = URL.createObjectURL(this.selectedFile);
      }
    },
    openAddModal() {
      this.isEdit = false;
      this.currentId = null;
      this.formData = { collection_name: "", description: "" };
      this.imagePreview = null;
      this.selectedFile = null;
      this.showModal = true;
    },
    openEditModal(item) {
      this.isEdit = true;
      this.currentId = item._id;
      this.formData = {
        collection_name: item.collection_name,
        description: item.description,
      };
      this.imagePreview = `http://localhost:3000/${item.image_url}`;
      this.selectedFile = null;
      this.showModal = true;
    },
    async saveCollection() {
      if (!this.formData.collection_name)
        return Swal.fire({
          icon: "warning",
          title: "Chú ý",
          text: "Vui lòng nhập tên bộ sưu tập!",
          confirmButtonColor: "#533422",
        });

      const data = new FormData();
      data.append("collection_name", this.formData.collection_name);
      data.append("description", this.formData.description);
      if (this.selectedFile) {
        data.append("image", this.selectedFile);
      }

      Swal.fire({
        title: "Đang xử lý...",
        didOpen: () => {
          Swal.showLoading();
        },
        allowOutsideClick: false,
      });
      try {
        if (this.isEdit) {
          await collectionService.updateCollection(this.currentId, data);
          Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: "Đã cập nhật bộ sưu tập.",
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          await collectionService.createCollection(data);
          Swal.fire({
            icon: "success",
            title: "Thành công!",
            text: "Đã thêm bộ sưu tập mới.",
            timer: 1500,
            showConfirmButton: false,
          });
        }
        this.showModal = false;
        this.initData();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Có lỗi xảy ra trong quá trình lưu!",
          confirmButtonColor: "#533422",
        });
      } finally {
        this.isLoading = false;
      }
    },
    async deleteCollection(id) {
      if (
        confirm(
          "Xóa bộ sưu tập sẽ xóa tất cả liên kết sản phẩm bên trong. Bạn chắc chứ?",
        )
      ) {
        try {
          await collectionService.deleteCollection(id);
          this.initData();
          alert("Đã xóa thành công!");
        } catch (err) {
          alert("Lỗi khi xóa!");
        }
      }
    },
    viewDetail(id) {
      this.$router.push({ name: "CollectionDetail", params: { id: id } });
    },
  },
  mounted() {
    this.initData();
  },
};
</script>

<template>
  <div class="collection-manager p-4">
    <Loading :isLoading="isLoading" />

    <div v-if="!isLoading">
      <div class="mb-4">
        <h4 class="fw-bold text-brown m-0 text-uppercase tracking-wider">
          Bộ Sưu Tập
        </h4>
      </div>

      <div class="row align-items-center mb-4">
        <div class="col-md-6 col-lg-5">
          <div class="position-relative shadow-sm rounded-pill overflow-hidden">
            <input
              v-model="searchQuery"
              type="text"
              class="form-control ps-5 border-0 bg-white py-2"
              placeholder="Tìm tên bộ sưu tập..."
            />
            <i
              class="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"
            ></i>
          </div>
        </div>

        <div class="col-md-6 col-lg-7 text-end">
          <button
            class="btn btn-brown px-4 py-2 shadow-sm fw-bold rounded-pill text-nowrap"
            @click="openAddModal"
          >
            <i class="fas fa-plus me-2"></i> THÊM MỚI
          </button>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-3 overflow-hidden border">
        <div class="card-body p-0">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4 py-3 small fw-bold text-uppercase">
                  Bộ sưu tập
                </th>
                <th class="py-3 small fw-bold text-uppercase">Mô tả</th>
                <th class="py-3 small fw-bold text-uppercase text-end pe-4">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in filteredCollections"
                :key="item._id"
                class="border-bottom"
              >
                <td class="ps-4 py-3">
                  <div class="d-flex align-items-center gap-3">
                    <img
                      :src="`http://localhost:3000/${item.image_url}`"
                      class="rounded-3 border object-fit-cover shadow-sm"
                      style="width: 80px; height: 50px"
                      alt="img"
                    />
                    <div>
                      <div class="fw-bold text-dark fs-6">
                        {{ item.collection_name }}
                      </div>
                      <div class="text-secondary small">
                        ID: {{ item._id.substring(18) }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="text-secondary small" style="max-width: 300px">
                  <span class="text-truncate d-block">{{
                    item.description || "Không có mô tả"
                  }}</span>
                </td>
                <td class="pe-4 text-end">
                  <div
                    class="btn-group shadow-sm border rounded-3 overflow-hidden"
                  >
                    <button
                      @click="viewDetail(item._id)"
                      class="btn btn-white text-primary border-end"
                      title="Xem chi tiết"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      @click="openEditModal(item)"
                      class="btn btn-white text-warning border-end"
                      title="Sửa"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      @click="deleteCollection(item._id)"
                      class="btn btn-white text-danger"
                      title="Xóa"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredCollections.length === 0">
                <td colspan="3" class="text-center py-5 text-muted">
                  Không tìm thấy bộ sưu tập nào phù hợp.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div
        class="modal-content p-4 shadow-lg rounded-4 border-0 animate__animated animate__zoomIn animate__faster"
      >
        <h5 class="fw-bold text-brown mb-4 border-bottom pb-2">
          {{ isEdit ? "CẬP NHẬT BST" : "THÊM BỘ SƯU TẬP MỚI" }}
        </h5>
        <div class="mb-3">
          <label class="form-label small fw-bold text-uppercase text-secondary"
            >Tên bộ sưu tập</label
          >
          <input
            v-model="formData.collection_name"
            type="text"
            class="form-control bg-light border-0 rounded-3"
          />
        </div>
        <div class="mb-3">
          <label class="form-label small fw-bold text-uppercase text-secondary"
            >Mô tả</label
          >
          <textarea
            v-model="formData.description"
            class="form-control bg-light border-0 rounded-3"
            rows="3"
          ></textarea>
        </div>
        <div class="mb-4">
          <label class="form-label small fw-bold text-uppercase text-secondary"
            >Ảnh minh họa</label
          >
          <input
            type="file"
            @change="onFileChange"
            class="form-control bg-light border-0 rounded-3 mb-2"
            accept="image/*"
          />
          <div
            v-if="imagePreview"
            class="mt-2 text-center bg-light p-2 rounded-3 border border-dashed"
          >
            <img
              :src="imagePreview"
              class="rounded-3 shadow-sm"
              style="max-height: 150px; max-width: 100%"
            />
          </div>
        </div>
        <div class="d-flex gap-2">
          <button
            @click="showModal = false"
            class="btn btn-outline-secondary w-100 rounded-pill fw-bold py-2"
          >
            HỦY
          </button>
          <button
            @click="saveCollection"
            class="btn btn-brown w-100 rounded-pill fw-bold py-2"
          >
            LƯU LẠI
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-brown {
  color: #533422;
}
.btn-brown {
  background-color: #533422;
  color: white;
  border: none;
  transition: all 0.3s ease;
}
.btn-brown:hover {
  background-color: #3e2719;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(83, 52, 34, 0.2);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(83, 52, 34, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background: white;
  width: 450px;
  max-width: 90%;
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
.table-hover tbody tr:hover {
  background-color: rgba(83, 52, 34, 0.02);
}
.tracking-wider {
  letter-spacing: 1px;
}
</style>
