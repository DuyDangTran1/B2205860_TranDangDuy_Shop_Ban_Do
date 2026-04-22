import createAdminApiClient from "./api.service";

class Category {
  constructor(baseUrl = "/api/categories") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllCategory = async () => {
    return (await this.privateApi.get(`/`)).data;
  };

  updateCategory = async (id, data) => {
    return (await this.privateApi.put(`/${id}`, data)).data;
  };

  createCategory = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  deleteCategory = async (id) => {
    return (await this.privateApi.delete(`/${id}`)).data;
  };
}

export default new Category();
