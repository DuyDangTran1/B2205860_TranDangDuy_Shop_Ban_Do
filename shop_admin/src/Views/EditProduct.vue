<script>
import productService from "@/services/product.service";
import categoryService from "@/services/category.service";
import supplierService from "@/services/supplier.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { markRaw } from "vue";

export default {
  components: { Loading },
  data() {
    return {
      editor: markRaw(ClassicEditor),
      editorConfig: {
        placeholder: "Cập nhật mô tả sản phẩm Duy ơi...",
        toolbar: [
          "heading",
          "|",
          "bold",
          "italic",
          "link",
          "bulletedList",
          "numberedList",
          "insertTable",
          "undo",
          "redo",
        ],
      },
      isLoading: false,
      previewUrl: null,
      selectedFile: null,
      subCategories: [],
      suppliers: [],
      tagString: "",
      product: {
        product_name: "",
        brand: "",
        category_id: null,
        supplier_id: null,
        base_price: 0,
        description: "",
        // ĐÃ BỎ DISCOUNT Ở ĐÂY
        attribute: {
          material: "",
          style: "",
          thickness: "Mỏng",
          oversize: false,
        },
        bot_knowledge: { selling_point: "", usage: "" },
      },
    };
  },
  methods: {
    async initData() {
      this.isLoading = true;
      const id = this.$route.params.id;
      try {
        await this.loadFormData();
        const res = await productService.getProductById(id);
        const data = res.product ? res.product : res;

        if (data) {
          this.product = { ...data };
          this.previewUrl = `http://localhost:3000/${data.image_url}`;
          this.tagString = Array.isArray(data.tag)
            ? data.tag.join(", ")
            : data.tag || "";
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Lỗi tải dữ liệu",
          text: "Không tìm thấy thông tin sản phẩm!",
          confirmButtonColor: "#ac7657",
        });
      } finally {
        this.isLoading = false;
      }
    },

    async loadFormData() {
      try {
        const [catRes, suppliersRes] = await Promise.all([
          categoryService.getAllCategory(),
          supplierService.getAllSupplier(),
        ]);
        const allCategories = catRes?.categories || [];
        this.subCategories = allCategories.filter((cat) => {
          const hasParent = cat.parent_name !== null && cat.parent_name !== "";
          const isLeaf = !allCategories.some(
            (c) => c.parent_name === cat.category_name,
          );
          return hasParent && isLeaf;
        });
        this.suppliers = suppliersRes.suppliers || [];
      } catch (err) {
        console.error(err);
      }
    },

    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    },

    async handleSave() {
      if (!this.product.product_name) {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu tên",
          text: "Tên sản phẩm không được để trống!",
          confirmButtonColor: "#ac7657",
        });
      }

      this.isLoading = true;
      const id = this.$route.params.id;
      const data = new FormData();

      if (this.selectedFile) {
        data.append("image", this.selectedFile);
      }

      data.append("product_name", this.product.product_name);
      data.append("brand", this.product.brand);
      data.append("category_id", this.product.category_id);
      data.append("supplier_id", this.product.supplier_id);
      data.append("base_price", this.product.base_price);
      data.append("description", this.product.description);
      data.append("tag", this.tagString);
      data.append("attribute", JSON.stringify(this.product.attribute));
      data.append("bot_knowledge", JSON.stringify(this.product.bot_knowledge));

      try {
        await productService.updateProduct(id, data);
        this.isLoading = false;
        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Thông tin sản phẩm đã được cập nhật.",
          confirmButtonColor: "#ac7657",
          timer: 2000,
          showConfirmButton: false,
        });
        this.$router.push("/products");
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Lỗi cập nhật",
          text: "Có lỗi xảy ra, vui lòng thử lại sau",
          confirmButtonColor: "#ac7657",
        });
      } finally {
        this.isLoading = false;
      }
    },
  },
  mounted() {
    this.initData();
  },
};
</script>

<template>
  <div class="edit-product p-4" v-if="product">
    <Loading :isLoading="isLoading" />

    <div class="d-flex align-items-center mb-4">
      <button
        @click="$router.back()"
        class="btn btn-light rounded-circle me-3 shadow-sm border"
      >
        <i class="fas fa-arrow-left"></i>
      </button>
      <h4 class="fw-bold text-brown m-0 text-uppercase">Chỉnh Sửa Sản Phẩm</h4>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-3 mb-4">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-4 text-secondary border-bottom pb-2">
              Thông tin cơ bản
            </h5>

            <div class="mb-3">
              <label class="form-label small fw-bold text-secondary"
                >TÊN SẢN PHẨM *</label
              >
              <input
                v-model="product.product_name"
                type="text"
                class="form-control form-control-lg border-2 modern-input"
              />
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary"
                  >THƯƠNG HIỆU</label
                >
                <input
                  v-model="product.brand"
                  type="text"
                  class="form-control border-2 modern-input"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary"
                  >GIÁ CƠ BẢN (VNĐ) *</label
                >
                <input
                  v-model="product.base_price"
                  type="number"
                  class="form-control border-2 modern-input"
                />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary"
                  >CHẤT LIỆU</label
                >
                <input
                  v-model="product.attribute.material"
                  type="text"
                  class="form-control border-2 modern-input"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary"
                  >PHONG CÁCH</label
                >
                <input
                  v-model="product.attribute.style"
                  type="text"
                  class="form-control border-2 modern-input"
                />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold text-secondary"
                  >ĐỘ DÀY</label
                >
                <select
                  v-model="product.attribute.thickness"
                  class="form-select border-2 modern-input"
                >
                  <option value="Mỏng">Mỏng</option>
                  <option value="Vừa phải">Vừa phải</option>
                  <option value="Dày">Dày</option>
                </select>
              </div>
              <div class="col-md-6">
                <label
                  class="form-label small fw-bold text-secondary text-uppercase"
                  >Thiết kế Oversize</label
                >
                <select
                  v-model="product.attribute.oversize"
                  class="form-select border-2 modern-input"
                >
                  <option :value="false">Form thường</option>
                  <option :value="true">Form rộng</option>
                </select>
              </div>
            </div>

            <div class="mb-0">
              <label class="form-label small fw-bold text-secondary"
                >MÔ TẢ CHI TIẾT *</label
              >
              <ckeditor
                :editor="editor"
                v-model="product.description"
                :config="editorConfig"
              ></ckeditor>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-3">
          <div class="card-body p-4 text-brown">
            <h5 class="fw-bold mb-4 text-secondary border-bottom pb-2">
              Kiến thức cho AI
            </h5>
            <div class="mb-3">
              <label class="form-label small fw-bold"
                >ĐIỂM BÁN HÀNG NỔI BẬT</label
              >
              <textarea
                v-model="product.bot_knowledge.selling_point"
                class="form-control border-2"
                rows="2"
              ></textarea>
            </div>
            <div class="mb-0">
              <label class="form-label small fw-bold">MỤC ĐÍCH SỬ DỤNG</label>
              <textarea
                v-model="product.bot_knowledge.usage"
                class="form-control border-2"
                rows="2"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-3 mb-4">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3 text-secondary border-bottom pb-2">
              Ảnh minh họa
            </h5>
            <div
              class="image-preview mb-3 border rounded-3 d-flex align-items-center justify-content-center bg-light"
              style="height: 250px"
            >
              <img
                v-if="previewUrl"
                :src="previewUrl"
                class="img-fluid rounded-3 h-100 object-fit-cover w-100"
              />
            </div>
            <input
              type="file"
              @change="onFileChange"
              class="form-control border-2"
              accept="image/*"
            />
            <p class="small text-muted mt-2 text-center">
              Để trống nếu không muốn thay đổi ảnh cũ
            </p>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-3">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3 text-secondary border-bottom pb-2">
              Phân loại
            </h5>
            <div class="mb-3">
              <label class="form-label small fw-bold text-secondary"
                >THỂ LOẠI *</label
              >
              <select
                v-model="product.category_id"
                class="form-select border-2 modern-input"
              >
                <option
                  v-for="cat in subCategories"
                  :key="cat._id"
                  :value="cat._id"
                >
                  {{ cat.category_name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-secondary"
                >NHÀ CUNG CẤP *</label
              >
              <select
                v-model="product.supplier_id"
                class="form-select border-2 modern-input"
              >
                <option
                  v-for="sup in suppliers"
                  :key="sup._id"
                  :value="sup._id"
                >
                  {{ sup.supplier_name }}
                </option>
              </select>
            </div>
            <div class="mb-0">
              <label class="form-label small fw-bold text-secondary"
                >TAGS (CÁCH NHAU DẤU PHẨY)</label
              >
              <input
                v-model="tagString"
                type="text"
                class="form-control border-2 modern-input"
              />
            </div>
          </div>
        </div>

        <button
          @click="handleSave"
          class="btn-save btn w-100 mt-4 py-3 fw-bold shadow rounded-pill text-white"
        >
          <i class="fas fa-save me-2"></i> LƯU THAY ĐỔI
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-brown {
  color: #533422;
}
.btn-save {
  background-color: #ac7657;
  transition: 0.3s;
}
.btn-save:hover {
  background-color: #533422;
  transform: translateY(-2px);
}
.modern-input:focus {
  border-color: #533422;
  box-shadow: 0 0 0 0.25rem rgba(83, 52, 34, 0.1);
}
:deep(.ck-editor__editable) {
  min-height: 200px !important;
}
</style>
