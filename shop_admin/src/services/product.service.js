import createAdminApiClient from "./api.service";

class Product {
  constructor(baseUrl = "/api/products") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllProducts = async () => {
    return (await this.privateApi.get(`/`)).data;
  };

  updateProduct = async (id, data) => {
    return (await this.privateApi.put(`/detail/${id}`, data)).data;
  };

  createProduct = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  deleteProduct = async (id) => {
    return (await this.privateApi.delete(`/detail/${id}`)).data;
  };

  getProductById = async (id) => {
    return (await this.privateApi.get(`/detail/${id}`)).data;
  };

  setDiscount = async (id, discountData) => {
    return (await this.privateApi.patch(`/set-discount/${id}`, discountData))
      .data;
  };
}

export default new Product();
