import createAdminApiClient from "./api.service";

class Collection {
  constructor(baseUrl = "/api/collection") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllCollection = async () => {
    return (await this.privateApi.get(`/`)).data;
  };

  updateCollection = async (id, data) => {
    return (await this.privateApi.put(`/${id}`, data)).data;
  };

  createCollection = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  deleteCollection = async (id) => {
    return (await this.privateApi.delete(`/${id}`)).data;
  };

  getCollection = async (id) => {
    return (await this.privateApi.get(`/${id}`)).data;
  };
}

export default new Collection();
