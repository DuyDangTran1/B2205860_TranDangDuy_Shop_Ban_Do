import createAdminApiClient from "./api.service";

class ProductVariant {
  constructor(baseUrl = "/api/product_variant") {
    this.privateApi = createAdminApiClient(baseUrl);
  }

  updateVariant = async (id, data) => {
    return (await this.privateApi.put(`/${id}`, data)).data;
  };

  createVariant = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  deleteVariant = async (id) => {
    return (await this.privateApi.delete(`/${id}`)).data;
  };
}

export default new ProductVariant();
