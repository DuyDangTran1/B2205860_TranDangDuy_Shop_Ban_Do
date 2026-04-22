<script>
import productService from "@/services/product.service";
import categoryService from "@/services/category.service";
import supplierService from "@/services/supplier.service";
import Loading from "@/components/Loading.vue";
import Swal from "sweetalert2";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { markRaw } from "vue";
const editor = ClassicEditor;
export default {
  components: {
    Loading,
  },
  data() {
    return {
      editor: markRaw(ClassicEditor),
      editorConfig: {
        placeholder: "Nhập mô tả sản phẩm...",
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
        discount: 0,
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
      if (!this.selectedFile) {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu ảnh",
          text: "Vui lòng chọn ảnh minh họa Duy ơi!",
          confirmButtonColor: "#ac7657",
        });
      }
      this.isLoading = true;
      const data = new FormData();
      data.append("image", this.selectedFile);
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
        await productService.createProduct(data);
        this.isLoading = false;
        await Swal.fire({
          icon: "success",
          title: "Thành công!",
          text: "Sản phẩm mới đã được thêm vào hệ thống.",
          confirmButtonColor: "#ac7657",
          timer: 2000,
          showConfirmButton: false,
        });
        this.$router.push("/products");
      } catch (err) {
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "Lỗi rồi Duy ơi!",
          text: "Có lỗi xảy ra khi lưu, vui lòng kiểm tra lại.",
          confirmButtonColor: "#ac7657",
        });
      } finally {
        this.isLoading = false;
      }
    },
  },
  mounted() {
    this.loadFormData();
  },
};
</script>

<template>
  <div class="create-product p-4">
    <Loading :isLoading="isLoading" />

    <div class="d-flex align-items-center mb-4">
      <button
        @click="$router.back()"
        class="btn btn-light rounded-circle me-3 shadow-sm"
      >
        <i class="fas fa-arrow-left"></i>
      </button>
      <h4 class="fw-bold text-brown m-0 text-uppercase">Thêm Sản Phẩm Mới</h4>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-3 mb-4">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-4 text-secondary border-bottom pb-2">
              Thông tin cơ bản
            </h5>

            <div class="mb-3">
              <label class="form-label small fw-bold">TÊN SẢN PHẨM *</label>
              <input
                v-model="product.product_name"
                type="text"
                class="form-control form-control-lg border-2"
                placeholder="Ví dụ: Áo Hoodie Unisex"
              />
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">THƯƠNG HIỆU</label>
                <input
                  v-model="product.brand"
                  type="text"
                  class="form-control border-2"
                  placeholder="Ví dụ: Local Brand"
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold"
                  >GIÁ CƠ BẢN (VNĐ) *</label
                >
                <input
                  v-model="product.base_price"
                  type="number"
                  class="form-control border-2"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-6">
                <label class="form-label small fw-bold">CHẤT LIỆU</label>
                <input
                  v-model="product.attribute.material"
                  type="text"
                  class="form-control border-2"
                  placeholder="Ví dụ: Cotton, Nỉ, Poly..."
                />
              </div>
              <div class="col-md-6">
                <label class="form-label small fw-bold">PHONG CÁCH</label>
                <input
                  v-model="product.attribute.style"
                  type="text"
                  class="form-control border-2"
                  placeholder="Ví dụ: Basic, Streetwear, Vintage..."
                />
              </div>
            </div>

            <div class="row mb-3 align-items-end">
              <div class="col-md-6">
                <label class="form-label small fw-bold">ĐỘ DÀY</label>
                <select
                  v-model="product.attribute.thickness"
                  class="form-select border-2"
                >
                  <option value="Mỏng">Mỏng</option>
                  <option value="Vừa phải">Vừa phải</option>
                  <option value="Dày">Dày</option>
                </select>
              </div>

              <div class="col-md-6">
                <label class="form-label small fw-bold text-uppercase"
                  >Thiết kế Oversize</label
                >
                <select
                  v-model="product.attribute.oversize"
                  class="form-select border-2"
                >
                  <option :value="false">Form thường</option>
                  <option :value="true">Form rộng</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold">MÔ TẢ CHI TIẾT *</label>
              <ckeditor
                :editor="editor"
                v-model="product.description"
                :config="editorConfig"
              ></ckeditor>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-3">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-4 text-secondary border-bottom pb-2">
              Kiến thức cho AI
            </h5>
            <div class="mb-3">
              <label class="form-label small fw-bold"
                >ĐIỂM BÁN HÀNG NỔI BẬT CỦA SẢN PHẨM</label
              >
              <textarea
                v-model="product.bot_knowledge.selling_point"
                class="form-control border-2 border-success-subtle"
                rows="2"
                placeholder="Ví dụ: Không nhăn, thấm hút mồ hôi cực tốt..."
              ></textarea>
            </div>
            <div class="mb-0">
              <label class="form-label small fw-bold"
                >MỤC ĐÍCH SỬ DỤNG SẢN PHẨM</label
              >
              <textarea
                v-model="product.bot_knowledge.usage"
                class="form-control border-2 border-success-subtle"
                rows="2"
                placeholder="Ví dụ: Đi học, đi làm, dạo phố..."
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
              class="image-preview mb-3 border rounded-3 d-flex align-items-center justify-content-center bg-light position-relative"
              style="height: 250px"
            >
              <img
                v-if="previewUrl"
                :src="previewUrl"
                class="img-fluid rounded-3 h-100 object-fit-cover w-100"
              />
              <div v-else class="text-center text-muted">
                <i class="fas fa-cloud-upload-alt fa-3x mb-2"></i>
                <p class="small m-0">Chưa có ảnh</p>
              </div>
            </div>
            <input
              type="file"
              @change="onFileChange"
              class="form-control border-2"
              accept="image/*"
            />
          </div>
        </div>

        <div class="card border-0 shadow-sm rounded-3">
          <div class="card-body p-4">
            <h5 class="fw-bold mb-3 text-secondary border-bottom pb-2">
              Phân loại
            </h5>
            <div class="mb-3">
              <label class="form-label small fw-bold">THỂ LOẠI *</label>
              <select
                v-model="product.category_id"
                class="form-select border-2"
              >
                <option :value="null">-- Chọn thể loại --</option>
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
              <label class="form-label small fw-bold">NHÀ CUNG CẤP *</label>
              <select
                v-model="product.supplier_id"
                class="form-select border-2"
              >
                <option :value="null">-- Chọn nhà cung cấp --</option>
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
              <label class="form-label small fw-bold"
                >TAGS (CÁCH NHAU DẤU PHẨY)</label
              >
              <input
                v-model="tagString"
                type="text"
                class="form-control border-2"
                placeholder="hoodie, thu dong, hottrend"
              />
            </div>
          </div>
        </div>

        <button
          @click="handleSave"
          class="btn-save btn w-100 mt-4 py-3 fw-bold shadow"
        >
          LƯU SẢN PHẨM
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn-save {
  background-color: #ac7657;
}

.btn-save:hover {
  color: #fff;
  background-color: #533422;
}

.ck-editor__editable {
  min-height: 250px !important;
  border: 1px solid #ddd !important;
  display: block !important;
}
:deep(.ck-toolbar) {
  background: #f8f9fa !important;
  border: 1px solid #ccced1 !important;
}

.btn-save {
  background-color: #ac7657;
  color: white;
}
</style>
