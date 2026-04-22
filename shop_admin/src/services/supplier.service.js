import createAdminApiClient from "./api.service";

class Supplier {
  constructor(baseUrl = "/api/supplier") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllSupplier = async () => {
    return (await this.privateApi.get(`/`)).data;
  };

  updateSupplier = async (id, data) => {
    return (await this.privateApi.put(`/${id}`, data)).data;
  };

  updateCollaborateStatus = async (id) => {
    return (await this.privateApi.patch(`/${id}`)).data;
  };

  createSupplier = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  deleteSupplier = async (id) => {
    return (await this.privateApi.delete(`/${id}`)).data;
  };
}

export default new Supplier();
